/* eslint-disable no-console */
import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Extend Socket interface to include custom properties
interface CustomSocket extends Socket {
  roomId?: string
  userId?: string
}
import { db } from '@/server/db'
import { flowRedisManager, ParticipantInfo } from '@/lib/redis'
import { CustomNode, CustomEdge } from '@/components/reactflow/node-types'
import { COLLABORATION_CONSTANTS, WEBSOCKET_EVENTS, FLOW_CHANGE_TYPES } from '@/lib/constants/collaboration'
// Removed in-memory logger - using database-only logging

// Helper function to log to database - using direct database calls instead of HTTP fetch
async function logToDatabase(event: string, action: string, userId?: string, roomId?: string, details?: any) {
  try {
    // Create audit log entry directly in database
    await db.auditLog.create({
      data: {
        message: event,        // event -> message
        category: action,      // action -> category
        level: 'INFO',         // default level
        userId,
        roomId,
        metadata: details || {},  // details -> metadata
        timestamp: new Date()
      }
    })
    // Successfully logged to database
  } catch (error) {
    console.error('❌ Failed to log to database:', error)
  }
}

// Define proper types for React Flow data
export interface FlowViewport {
  x: number
  y: number
  zoom: number
}

// Import NodeChange and EdgeChange from React Flow for granular changes
import { NodeChange, EdgeChange } from '@xyflow/react'

// Define specific data types for each event type
export interface BulkNodesData {
  nodes: CustomNode[] // For bulk operations (load, clear, replace all)
}

export interface GranularNodeChangesData {
  changes: NodeChange[] // For individual node changes (move, edit, add one, remove one)
}

export interface BulkEdgesData {
  edges: CustomEdge[] // For bulk operations (replace all edges)
}

export interface GranularEdgeChangesData {
  changes: EdgeChange[] // For individual edge changes (add one, remove one)
}

export interface CursorMoveData {
  x: number
  y: number
}

// Union type for all possible event data
export type FlowEventData =
  | BulkNodesData
  | GranularNodeChangesData
  | BulkEdgesData
  | GranularEdgeChangesData
  | CursorMoveData

export interface FlowChangeEvent {
  type: typeof FLOW_CHANGE_TYPES[keyof typeof FLOW_CHANGE_TYPES]
  roomId: string
  userId: string
  data: FlowEventData
  timestamp: number
}

export interface FlowData {
  nodes: CustomNode[]
  edges: CustomEdge[]
  viewport?: FlowViewport // Stored but not synchronized (each user has local viewport)
  [key: string]: unknown // Keep for Prisma JSON compatibility
}

export interface RoomData {
  roomId: string
  ownerId: string
  flowData: FlowData
  lastSyncedAt: string
}

export interface AuthenticatedSocket extends Socket {
  userId?: string
  roomId?: string
}

export class FlowWebSocketManager {
  private readonly io: SocketIOServer

  // Queue-based debouncing system
  private broadcastQueues: Map<string, FlowChangeEvent[]> = new Map()
  private broadcastTimers: Map<string, NodeJS.Timeout> = new Map()
  private databaseQueues: Map<string, FlowChangeEvent[]> = new Map()
  private databaseTimers: Map<string, NodeJS.Timeout> = new Map()

  // Connection tracking to prevent duplicate logging
  private connectionLogged: Set<string> = new Set()

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    // Using database-only logging - no initialization needed

    this.setupSocketHandlers()
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log('Client connected:', socket.id)

      // Handle room joining
      socket.on(WEBSOCKET_EVENTS.JOIN_ROOM, async (data: { roomId: string; token: string }) => {
        try {
          const { roomId, token } = data

          // Verify user authentication using the token
          const user = await this.authenticateUser(token)
          if (!user) {
            logToDatabase('WebSocket join_room_failed', 'websocket', undefined, roomId, { reason: 'authentication_failed' })
            socket.emit('error', { message: 'Authentication failed' })
            return
          }

          // Check if user has access to the room
          const hasAccess = await this.checkRoomAccess(roomId, user.id)
          if (!hasAccess) {
            logToDatabase('WebSocket join_room_failed', 'websocket', user.id, roomId, { reason: 'access_denied' })
            socket.emit('error', { message: 'Access denied to room' })
            return
          }

          // Leave previous room if any
          if (socket.roomId) {
            await this.leaveRoom(socket, socket.roomId)
          }

          // Join the new room
          socket.userId = user.id
          socket.roomId = roomId
          socket.join(roomId)

          // Add participant to Redis
          const participant: ParticipantInfo = {
            userId: user.id,
            name: user.name || 'Anonymous',
            role: await this.getUserRoleInRoom(roomId, user.id),
            lastActiveAt: new Date().toISOString()
          }

          await flowRedisManager.addParticipant(roomId, participant)

          // Get current room state with database fallback
          const roomData = await this.getRoomDataWithFallback(roomId)
          const participants = await flowRedisManager.getParticipants(roomId)

          // Send current state to the joining user
          socket.emit(WEBSOCKET_EVENTS.ROOM_JOINED, {
            roomId,
            flowData: roomData?.flowData,
            participants: participants.filter(p => p.userId !== user.id),
            userRole: participant.role
          })

          // Notify other participants
          socket.to(roomId).emit(WEBSOCKET_EVENTS.PARTICIPANT_JOINED, participant)

          // Enhanced WebSocket connection logging (prevent duplicates)
          const connectionKey = `${roomId}-${user.id}`
          if (!this.connectionLogged.has(connectionKey)) {
            const existingParticipants = this.getActiveParticipants(roomId).length - 1 // Exclude current user
            const connectionEventName = existingParticipants > 0 ?
              `WebSocket: User joined active room (${existingParticipants + 1} total)` :
              'WebSocket: User created new session (first participant)'

            logToDatabase(connectionEventName, 'websocket', user.id, roomId, {
              participantName: user.name,
              role: participant.role,
              existingParticipants: existingParticipants,
              totalParticipants: existingParticipants + 1,
              connectionType: existingParticipants > 0 ? 'join_existing' : 'create_session'
            })

            this.connectionLogged.add(connectionKey)
          }
          console.log(`User ${user.id} joined room ${roomId} successfully`)

        } catch (error) {
          console.error('Error joining room:', error)
          socket.emit('error', {
            message: 'Failed to join room',
            details: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      // Handle flow changes with queue-based debouncing
      socket.on(WEBSOCKET_EVENTS.FLOW_CHANGE, async (event: Omit<FlowChangeEvent, 'timestamp'>) => {
        if (!socket.userId || !socket.roomId) return

        const flowEvent: FlowChangeEvent = {
          ...event,
          userId: socket.userId,
          roomId: socket.roomId,
          timestamp: Date.now()
        }

        // Removed timer logging
        try {
          // Check queue state before adding to Redis
          const actionDetails = this.getActionDetails(event.type, event.data)
          const cacheExists = await flowRedisManager.hasPendingChanges(socket.roomId)

          // Store change in Redis immediately for persistence
          await flowRedisManager.addPendingChange(socket.roomId, flowEvent)

          // Enhanced Redis queue operations logging
          const redisEventName = cacheExists ?
            'Redis: Insert to existing queue' :
            'Redis: Create new queue'

          logToDatabase(redisEventName, 'collaboration', socket.userId, socket.roomId, {
            changeType: event.type,
            timestamp: flowEvent.timestamp,
            action: actionDetails.action,
            nodeCount: actionDetails.nodeCount,
            edgeCount: actionDetails.edgeCount,
            changeDetails: actionDetails.details,
            queueOperation: cacheExists ? 'insert_to_existing_queue' : 'create_new_queue',
            redisKey: `flow:${socket.roomId}:pending`,
            queueState: cacheExists ? 'existing' : 'new'
          })

          // Queue for delayed broadcast (500ms)
          const broadcastQueueSize = this.getBroadcastQueueSize(socket.roomId)
          const broadcastEventName = broadcastQueueSize > 0 ?
            'Broadcast: Add to existing queue' :
            'Broadcast: Create new queue'

          this.queueBroadcastEvent(socket.roomId, flowEvent)
          logToDatabase(broadcastEventName, 'collaboration', socket.userId, socket.roomId, {
            changeType: event.type,
            broadcastDelay: `${COLLABORATION_CONSTANTS.BROADCAST_DELAY}ms`,
            action: actionDetails.action,
            nodeCount: actionDetails.nodeCount,
            edgeCount: actionDetails.edgeCount,
            changeDetails: actionDetails.details,
            queueOperation: broadcastQueueSize > 0 ? 'add_to_existing_queue' : 'create_new_queue',
            queueSize: broadcastQueueSize + 1,
            scheduledFor: new Date(Date.now() + COLLABORATION_CONSTANTS.BROADCAST_DELAY).toISOString()
          })

          // Queue for delayed database sync (30 seconds)
          const dbQueueSize = this.getDatabaseQueueSize(socket.roomId)
          const dbEventName = dbQueueSize > 0 ?
            'Database: Add to existing sync queue' :
            'Database: Create new sync queue'

          this.queueDatabaseSync(socket.roomId, flowEvent)
          logToDatabase(dbEventName, 'collaboration', socket.userId, socket.roomId, {
            changeType: event.type,
            syncDelay: `${COLLABORATION_CONSTANTS.DATABASE_SYNC_DELAY / 1000}s`,
            action: actionDetails.action,
            nodeCount: actionDetails.nodeCount,
            edgeCount: actionDetails.edgeCount,
            changeDetails: actionDetails.details,
            queueOperation: dbQueueSize > 0 ? 'add_to_existing_sync_queue' : 'create_new_sync_queue',
            queueSize: dbQueueSize + 1,
            scheduledFor: new Date(Date.now() + COLLABORATION_CONSTANTS.DATABASE_SYNC_DELAY).toISOString()
          })

        } catch (error) {
          console.error('Error handling flow change:', error)
        }
      })

      // Handle cursor movement (high frequency, Redis only)
      socket.on(WEBSOCKET_EVENTS.CURSOR_MOVE, async (data: CursorMoveData) => {
        if (!socket.userId || !socket.roomId) return

        try {
          await flowRedisManager.updateParticipantCursor(
            socket.roomId,
            socket.userId,
            data
          )

          // Broadcast cursor position to other participants
          socket.to(socket.roomId).emit(WEBSOCKET_EVENTS.CURSOR_MOVE, {
            userId: socket.userId,
            cursor: data
          })
        } catch (error) {
          console.error('Error updating cursor:', error)
        }
      })

      // Handle disconnection
      socket.on('disconnect', async () => {
        // Client disconnected
        console.log('Client disconnected:', socket.id)

        if (socket.userId && socket.roomId) {
          await this.leaveRoom(socket, socket.roomId)
        }
      })
    })
  }

  private async leaveRoom(socket: AuthenticatedSocket, roomId: string) {
    if (!socket.userId) return

    try {
      // Remove from Redis
      await flowRedisManager.removeParticipant(roomId, socket.userId)

      // Clean up connection tracking
      const connectionKey = `${roomId}-${socket.userId}`
      this.connectionLogged.delete(connectionKey)

      // Leave socket room
      socket.leave(roomId)

      // Notify other participants
      socket.to(roomId).emit(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, { userId: socket.userId })

      // Check if this was the last participant
      const room = this.io.sockets.adapter.rooms.get(roomId)
      if (!room || room.size === 0) {
        console.log(`Last participant left room ${roomId}, persisting pending changes before cleanup`)

        // Process any pending changes before cleanup
        await this.finalizeRoomBeforeCleanup(roomId)

        // Now clean up the queues
        this.cleanupRoomQueues(roomId)
      }

    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  private queueBroadcastEvent(roomId: string, event: FlowChangeEvent) {
    // Add event to broadcast queue
    if (!this.broadcastQueues.has(roomId)) {
      this.broadcastQueues.set(roomId, [])
    }
    this.broadcastQueues.get(roomId)!.push(event)

    // If no timer exists, create one
    if (!this.broadcastTimers.has(roomId)) {
      const timer = setTimeout(() => {
        this.processBroadcastQueue(roomId)
      }, COLLABORATION_CONSTANTS.BROADCAST_DELAY)

      this.broadcastTimers.set(roomId, timer)
      console.log(`Started broadcast timer for room ${roomId} (${COLLABORATION_CONSTANTS.BROADCAST_DELAY}ms delay)`)
    }
  }

  private async processBroadcastQueue(roomId: string) {
    try {
      const events = this.broadcastQueues.get(roomId) || []

      if (events.length === 0) return

      console.log(`Processing ${events.length} broadcast events for room ${roomId}`)

      // Sort events by timestamp to apply them in order
      const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp)

      // Consolidate changes by type to get the latest change of each type
      // For broadcast, we skip non-persistent changes (cursor_move)
      const consolidatedChanges = this.consolidateChangesByType(sortedEvents, true)

      // Broadcast each type of change separately to ensure all participants get complete state
      for (const [changeType, latestChange] of consolidatedChanges) {
        this.io.to(roomId).emit(WEBSOCKET_EVENTS.FLOW_CHANGE, latestChange)
        console.log(`Broadcasted ${changeType} change to room ${roomId}`)
      }

      // Log broadcast completion with detailed event name
      const participantCount = this.getActiveParticipants(roomId).length
      const broadcastEventName = participantCount > 1 ?
        `Broadcast: Queue broadcast to clients (${participantCount} participants)` :
        'Broadcast: Queue broadcast to clients (no other participants)'

      logToDatabase(broadcastEventName, 'collaboration', undefined, roomId, {
        eventsProcessed: events.length,
        consolidatedChanges: consolidatedChanges.size,
        broadcastDelay: `${COLLABORATION_CONSTANTS.BROADCAST_DELAY}ms`,
        changeTypes: Array.from(consolidatedChanges.keys()),
        participantCount: participantCount,
        broadcastScope: participantCount > 1 ? 'multi_user' : 'single_user',
        timestamp: new Date().toISOString()
      })

      console.log(`Broadcasted ${consolidatedChanges.size} consolidated changes to room ${roomId}`)

      // Clear the queue and timer
      this.broadcastQueues.delete(roomId)
      this.broadcastTimers.delete(roomId)

    } catch (error) {
      console.error('Error processing broadcast queue:', error)
      // Clean up even on error
      this.broadcastQueues.delete(roomId)
      this.broadcastTimers.delete(roomId)
    }
  }

  private queueDatabaseSync(roomId: string, event: FlowChangeEvent) {
    // Add event to database queue
    if (!this.databaseQueues.has(roomId)) {
      this.databaseQueues.set(roomId, [])
    }
    this.databaseQueues.get(roomId)!.push(event)

    // If no timer exists, create one
    if (!this.databaseTimers.has(roomId)) {
      const timer = setTimeout(() => {
        this.processDatabaseQueue(roomId)
      }, COLLABORATION_CONSTANTS.DATABASE_SYNC_DELAY)

      this.databaseTimers.set(roomId, timer)
      console.log(`Started database sync timer for room ${roomId} (${COLLABORATION_CONSTANTS.DATABASE_SYNC_DELAY / 1000}s delay)`)
    }
  }

  private async processDatabaseQueue(roomId: string) {
    // Removed timer logging
    try {
      const events = this.databaseQueues.get(roomId) || []

      if (events.length === 0) return

      // Processing database sync events
      console.log(`Processing ${events.length} database sync events for room ${roomId}`)

      // Get current room data with database fallback
      const roomData = await this.getRoomDataWithFallback(roomId)
      if (!roomData) {
        // Cannot sync room - room data not found
        console.warn(`Cannot sync room ${roomId} - room data not found`)
        return
      }

      // Apply all queued changes to flow data
      const updatedFlowData = this.applyChangesToFlowData(roomData.flowData, events)

      // Update database (cast to any for Prisma JSON compatibility)
      await db.flowRoom.update({
        where: { id: roomId },
        data: {
          flowData: updatedFlowData as any,
          updatedAt: new Date()
        }
      })

      // Update Redis cache
      await flowRedisManager.cacheFlowRoom(roomId, {
        ...roomData,
        flowData: updatedFlowData,
        lastSyncedAt: new Date().toISOString()
      })

      // Log detailed database sync completion with specific event name
      const syncSummary = this.getSyncSummary(events)
      const totalChanges = syncSummary.totalNodeChanges + syncSummary.totalEdgeChanges
      const dbEventName = totalChanges > 10 ?
        `Database: Sync to db completed (${totalChanges} changes)` :
        `Database: Sync to db completed (${totalChanges} changes)`

      logToDatabase(dbEventName, 'collaboration', undefined, roomId, {
        eventsProcessed: events.length,
        syncSummary: syncSummary,
        syncDuration: `${COLLABORATION_CONSTANTS.DATABASE_SYNC_DELAY / 1000}s`,
        syncType: totalChanges > 10 ? 'bulk_sync' : 'standard_sync',
        totalChanges: totalChanges,
        lastSyncedAt: new Date().toISOString()
      })
      console.log(`Synced ${events.length} changes to database for room ${roomId}:`, syncSummary)

      // Clear the queue and timer
      this.databaseQueues.delete(roomId)
      this.databaseTimers.delete(roomId)

    } catch (error) {
      // Error processing database queue
      console.error('Error processing database queue:', error)
      // Clean up even on error
      this.databaseQueues.delete(roomId)
      this.databaseTimers.delete(roomId)
    }
  }

  private async finalizeRoomBeforeCleanup(roomId: string) {
    try {
      // Process any pending broadcast queue (though not critical for persistence)
      if (this.broadcastQueues.has(roomId) && this.broadcastQueues.get(roomId)!.length > 0) {
        console.log(`Processing final broadcast queue for room ${roomId}`)
        await this.processBroadcastQueue(roomId)
      }

      // Process any pending database queue (critical for data persistence)
      if (this.databaseQueues.has(roomId) && this.databaseQueues.get(roomId)!.length > 0) {
        console.log(`Processing final database queue for room ${roomId}`)
        await this.processDatabaseQueue(roomId)
      }

      // Also clear any pending changes from Redis and sync them
      const pendingChanges = await flowRedisManager.getAndClearPendingChanges(roomId)
      if (pendingChanges.length > 0) {
        console.log(`Found ${pendingChanges.length} additional pending changes in Redis for room ${roomId}`)

        // Get room data and apply the changes
        const roomData = await this.getRoomDataWithFallback(roomId)
        if (roomData) {
          const updatedFlowData = this.applyChangesToFlowData(roomData.flowData, pendingChanges)

          // Update database (cast to any for Prisma JSON compatibility)
          await db.flowRoom.update({
            where: { id: roomId },
            data: {
              flowData: updatedFlowData as any,
              updatedAt: new Date()
            }
          })

          // Update Redis cache
          await flowRedisManager.cacheFlowRoom(roomId, {
            ...roomData,
            flowData: updatedFlowData,
            lastSyncedAt: new Date().toISOString()
          })

          console.log(`Finalized ${pendingChanges.length} pending changes for room ${roomId}`)
        }
      }

    } catch (error) {
      console.error(`Error finalizing room ${roomId} before cleanup:`, error)
    }
  }

  private cleanupRoomQueues(roomId: string) {
    // Clear broadcast queue and timer
    if (this.broadcastTimers.has(roomId)) {
      clearTimeout(this.broadcastTimers.get(roomId)!)
      this.broadcastTimers.delete(roomId)
    }
    this.broadcastQueues.delete(roomId)

    // Clear database queue and timer
    if (this.databaseTimers.has(roomId)) {
      clearTimeout(this.databaseTimers.get(roomId)!)
      this.databaseTimers.delete(roomId)
    }
    this.databaseQueues.delete(roomId)

    console.log(`Cleaned up queues for room ${roomId}`)
  }



  private applyChangesToFlowData(currentData: FlowData, changes: FlowChangeEvent[]): FlowData {
    const startTime = performance.now()

    // Early return for empty changes
    if (!changes || changes.length === 0) {
      return currentData
    }

    // Early return for single change - validate and apply
    if (changes.length === 1) {
      const change = changes[0]
      if (this.isValidChange(change, currentData)) {
        return this.applySingleChange(currentData, change)
      } else {
        console.warn('Invalid single change rejected:', change)
        this.notifyConflict(change, 'Change validation failed')
        return currentData
      }
    }

    // Apply timestamp-based conflict resolution for multiple changes
    const validChanges = this.resolveConflictsByTimestamp(changes, currentData)

    // Check if changes are already sorted to avoid unnecessary sorting
    const needsSorting = this.needsSorting(validChanges)
    const sortedChanges = needsSorting
      ? validChanges.sort((a, b) => a.timestamp - b.timestamp)
      : validChanges

    // Consolidate changes by type to reduce redundant operations
    // For flow data application, we skip non-persistent changes (cursor_move)
    const consolidatedChanges = this.consolidateChangesByType(sortedChanges, true)

    // Apply consolidated changes efficiently
    const result = this.applyConsolidatedChanges(currentData, consolidatedChanges)

    const endTime = performance.now()
    if (changes.length > 10) {
      console.log(`Applied ${changes.length} changes in ${(endTime - startTime).toFixed(2)}ms`)
    }

    return result
  }

  private applySingleChange(currentData: FlowData, change: FlowChangeEvent): FlowData {
    switch (change.type) {
      case FLOW_CHANGE_TYPES.BULK_NODES: {
        // Bulk node operation (replace all nodes)
        const data = change.data as BulkNodesData
        return {
          ...currentData,
          nodes: data.nodes
        }
      }
      case FLOW_CHANGE_TYPES.GRANULAR_NODES: {
        // Granular node changes
        const data = change.data as GranularNodeChangesData
        const { applyNodeChanges } = require('@xyflow/react')
        return {
          ...currentData,
          nodes: applyNodeChanges(data.changes, currentData.nodes)
        }
      }
      case FLOW_CHANGE_TYPES.BULK_EDGES: {
        // Bulk edge operation (replace all edges)
        const data = change.data as BulkEdgesData
        return {
          ...currentData,
          edges: data.edges
        }
      }
      case FLOW_CHANGE_TYPES.GRANULAR_EDGES: {
        // Granular edge changes
        const data = change.data as GranularEdgeChangesData
        const { applyEdgeChanges } = require('@xyflow/react')
        return {
          ...currentData,
          edges: applyEdgeChanges(data.changes, currentData.edges)
        }
      }
      case FLOW_CHANGE_TYPES.CURSOR_MOVE:
        // Cursor moves are not persisted to database
        return currentData
      default:
        return currentData
    }
  }

  private needsSorting(changes: FlowChangeEvent[]): boolean {
    for (let i = 1; i < changes.length; i++) {
      if (changes[i].timestamp < changes[i - 1].timestamp) {
        return true
      }
    }
    return false
  }

  /**
   * Resolve conflicts using timestamp-based validation approach
   * Process changes in chronological order, rejecting invalid operations
   */
  private resolveConflictsByTimestamp(changes: FlowChangeEvent[], initialData: FlowData): FlowChangeEvent[] {
    // Sort changes by timestamp (earliest first)
    const sortedChanges = changes.sort((a, b) => a.timestamp - b.timestamp)
    const validChanges: FlowChangeEvent[] = []
    let currentState = { ...initialData }

    for (const change of sortedChanges) {
      if (this.isValidChange(change, currentState)) {
        validChanges.push(change)
        // Update current state for next validation
        currentState = this.applySingleChange(currentState, change)
      } else {
        console.warn('Change rejected due to conflict:', {
          change: change.type,
          userId: change.userId,
          timestamp: change.timestamp,
          reason: this.getValidationFailureReason(change, currentState)
        })
        this.notifyConflict(change, this.getValidationFailureReason(change, currentState))
      }
    }

    console.log(`Conflict resolution: ${validChanges.length}/${changes.length} changes accepted`)
    return validChanges
  }

  /**
   * Validate if a change can be applied to the current state
   */
  private isValidChange(change: FlowChangeEvent, currentState: FlowData): boolean {
    switch (change.type) {
      case FLOW_CHANGE_TYPES.BULK_NODES:
        // Bulk node operations are always valid (they replace entire state)
        return true

      case FLOW_CHANGE_TYPES.GRANULAR_NODES: {
        const data = change.data as GranularNodeChangesData
        return this.validateGranularNodeChanges(data.changes, currentState.nodes)
      }

      case FLOW_CHANGE_TYPES.BULK_EDGES:
        // Bulk edge operations are always valid (they replace entire state)
        return true

      case FLOW_CHANGE_TYPES.GRANULAR_EDGES: {
        const data = change.data as GranularEdgeChangesData
        return this.validateGranularEdgeChanges(data.changes, currentState.nodes, currentState.edges)
      }

      case FLOW_CHANGE_TYPES.CURSOR_MOVE:
        // Cursor moves are always valid
        return true

      default:
        return false
    }
  }

  /**
   * Validate granular node changes
   */
  private validateGranularNodeChanges(changes: NodeChange[], currentNodes: CustomNode[]): boolean {
    const nodeMap = new Map(currentNodes.map(node => [node.id, node]))

    for (const change of changes) {
      const nodeId = this.getNodeChangeId(change)

      switch (change.type) {
        case 'add':
          // Check if node ID already exists
          if (nodeMap.has(nodeId)) {
            return false
          }
          break

        case 'remove':
          // Check if node exists to remove
          if (!nodeMap.has(nodeId)) {
            return false
          }
          break

        case 'replace':
        case 'position':
        case 'dimensions':
        case 'select':
          // Check if node exists to modify
          if (!nodeMap.has(nodeId)) {
            return false
          }
          break

        default:
          return false
      }

      // Update nodeMap for subsequent validations in the same batch
      if (change.type === 'add' && 'item' in change && change.item) {
        nodeMap.set(nodeId, change.item as CustomNode)
      } else if (change.type === 'remove') {
        nodeMap.delete(nodeId)
      } else if (change.type === 'replace' && 'item' in change && change.item) {
        nodeMap.set(nodeId, change.item as CustomNode)
      }
    }

    return true
  }

  /**
   * Get node ID from different types of node changes
   */
  private getNodeChangeId(change: NodeChange): string {
    if ('id' in change) {
      return change.id
    }
    // For add changes, the ID is in the item
    if (change.type === 'add' && 'item' in change && change.item) {
      return change.item.id
    }
    throw new Error(`Cannot extract ID from node change: ${change.type}`)
  }

  /**
   * Validate granular edge changes
   */
  private validateGranularEdgeChanges(changes: EdgeChange[], currentNodes: CustomNode[], currentEdges: CustomEdge[]): boolean {
    const nodeMap = new Map(currentNodes.map(node => [node.id, node]))
    const edgeMap = new Map(currentEdges.map(edge => [edge.id, edge]))

    for (const change of changes) {
      const edgeId = this.getEdgeChangeId(change)

      switch (change.type) {
        case 'add':
          // Check if edge ID already exists
          if (edgeMap.has(edgeId)) {
            return false
          }
          // Check if source and target nodes exist
          if ('item' in change && change.item) {
            const edge = change.item as CustomEdge
            if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
              return false
            }
          }
          break

        case 'remove':
          // Check if edge exists to remove
          if (!edgeMap.has(edgeId)) {
            return false
          }
          break

        case 'replace':
        case 'select':
          // Check if edge exists to modify
          if (!edgeMap.has(edgeId)) {
            return false
          }
          // For replace, also check if new source/target nodes exist
          if (change.type === 'replace' && 'item' in change && change.item) {
            const edge = change.item as CustomEdge
            if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
              return false
            }
          }
          break

        default:
          return false
      }

      // Update edgeMap for subsequent validations in the same batch
      if (change.type === 'add' && 'item' in change && change.item) {
        edgeMap.set(edgeId, change.item as CustomEdge)
      } else if (change.type === 'remove') {
        edgeMap.delete(edgeId)
      } else if (change.type === 'replace' && 'item' in change && change.item) {
        edgeMap.set(edgeId, change.item as CustomEdge)
      }
    }

    return true
  }

  /**
   * Get edge ID from different types of edge changes
   */
  private getEdgeChangeId(change: EdgeChange): string {
    if ('id' in change) {
      return change.id
    }
    // For add changes, the ID is in the item
    if (change.type === 'add' && 'item' in change && change.item) {
      return change.item.id
    }
    throw new Error(`Cannot extract ID from edge change: ${change.type}`)
  }

  /**
   * Get current broadcast queue size for a room
   */
  private getBroadcastQueueSize(roomId: string): number {
    const timeout = this.broadcastTimers.get(roomId)
    const events = this.broadcastQueues.get(roomId) || []
    return timeout ? events.length : 0
  }

  /**
   * Get current database sync queue size for a room
   */
  private getDatabaseQueueSize(roomId: string): number {
    const timeout = this.databaseTimers.get(roomId)
    const events = this.databaseQueues.get(roomId) || []
    return timeout ? events.length : 0
  }

  /**
   * Get active participants in a room
   */
  private getActiveParticipants(roomId: string): string[] {
    const sockets = Array.from(this.io.sockets.sockets.values()) as CustomSocket[]
    return sockets
      .filter(socket => socket.roomId === roomId)
      .map(socket => socket.userId)
      .filter((userId): userId is string => userId !== undefined)
      .filter((userId, index, array) => array.indexOf(userId) === index) // Remove duplicates
  }

  /**
   * Get a human-readable reason for validation failure
   */
  private getValidationFailureReason(change: FlowChangeEvent, currentState: FlowData): string {
    switch (change.type) {
      case FLOW_CHANGE_TYPES.GRANULAR_NODES: {
        const data = change.data as GranularNodeChangesData
        const nodeMap = new Map(currentState.nodes.map(node => [node.id, node]))

        for (const nodeChange of data.changes) {
          const nodeId = this.getNodeChangeId(nodeChange)

          switch (nodeChange.type) {
            case 'add':
              if (nodeMap.has(nodeId)) {
                return `Node ${nodeId} already exists`
              }
              break
            case 'remove':
            case 'replace':
            case 'position':
            case 'dimensions':
            case 'select':
              if (!nodeMap.has(nodeId)) {
                return `Node ${nodeId} does not exist (may have been deleted)`
              }
              break
          }
        }
        return 'Invalid granular node changes'
      }

      case FLOW_CHANGE_TYPES.GRANULAR_EDGES: {
        const data = change.data as GranularEdgeChangesData
        const nodeMap = new Map(currentState.nodes.map(node => [node.id, node]))
        const edgeMap = new Map(currentState.edges.map(edge => [edge.id, edge]))

        for (const edgeChange of data.changes) {
          const edgeId = this.getEdgeChangeId(edgeChange)

          switch (edgeChange.type) {
            case 'add':
              if (edgeMap.has(edgeId)) {
                return `Edge ${edgeId} already exists`
              }
              if ('item' in edgeChange && edgeChange.item) {
                const edge = edgeChange.item as CustomEdge
                if (!nodeMap.has(edge.source)) {
                  return `Source node ${edge.source} does not exist (may have been deleted)`
                }
                if (!nodeMap.has(edge.target)) {
                  return `Target node ${edge.target} does not exist (may have been deleted)`
                }
              }
              break
            case 'remove':
            case 'replace':
            case 'select':
              if (!edgeMap.has(edgeId)) {
                return `Edge ${edgeId} does not exist (may have been deleted)`
              }
              break
          }
        }
        return 'Invalid granular edge changes'
      }

      default:
        return 'Unknown validation error'
    }
  }

  /**
   * Notify client about conflict/rejected change
   */
  private notifyConflict(change: FlowChangeEvent, reason: string): void {
    // Find the socket for this user and notify them
    const userSocket = Array.from(this.io.sockets.sockets.values())
      .find(socket => (socket as AuthenticatedSocket).userId === change.userId)

    if (userSocket) {
      userSocket.emit('operation_conflict', {
        type: change.type,
        timestamp: change.timestamp,
        reason: reason,
        suggestion: this.getConflictSuggestion(change.type, reason)
      })
    }

    console.log(`Conflict notification sent to user ${change.userId}: ${reason}`)
  }

  /**
   * Get user-friendly suggestion for resolving conflicts
   */
  private getConflictSuggestion(changeType: string, reason: string): string {
    if (reason.includes('does not exist') || reason.includes('deleted')) {
      return 'The item you tried to modify was deleted by another user. Please refresh and try again.'
    }

    if (reason.includes('already exists')) {
      return 'This item was already created by another user. Please refresh to see the latest state.'
    }

    switch (changeType) {
      case 'granular_nodes':
        return 'Node operation failed due to conflicts. Please refresh and retry your changes.'
      case 'granular_edges':
        return 'Edge operation failed due to conflicts. Please refresh and retry your connection.'
      case 'bulk_nodes':
        return 'Bulk node operation failed due to conflicts. Please refresh and try again.'
      case 'bulk_edges':
        return 'Bulk edge operation failed due to conflicts. Please refresh and try again.'
      default:
        return 'Operation failed due to conflicts. Please refresh and try again.'
    }
  }

  private consolidateChangesByType(changes: FlowChangeEvent[], skipNonPersistent: boolean = true): Map<string, FlowChangeEvent> {
    const consolidated = new Map<string, FlowChangeEvent>()
    const changeTypeCounts = new Map<string, number>()

    // Track accumulated granular changes
    const accumulatedGranularNodes: NodeChange[] = []
    const accumulatedGranularEdges: EdgeChange[] = []

    // Track latest bulk change timestamps to determine precedence
    let latestBulkNodesTimestamp = 0
    let latestBulkEdgesTimestamp = 0

    // Process changes in chronological order
    for (const change of changes) {
      // Count changes by type for logging
      changeTypeCounts.set(change.type, (changeTypeCounts.get(change.type) || 0) + 1)

      if (skipNonPersistent && change.type === FLOW_CHANGE_TYPES.CURSOR_MOVE) {
        continue // Skip non-persistent changes
      }

      switch (change.type) {
        case FLOW_CHANGE_TYPES.BULK_NODES:
          // Bulk operations override - clear any accumulated granular changes and update timestamp
          accumulatedGranularNodes.length = 0
          latestBulkNodesTimestamp = change.timestamp
          consolidated.set(change.type, change)
          break

        case FLOW_CHANGE_TYPES.GRANULAR_NODES: {
          // Only accumulate if no bulk change came after this granular change
          if (change.timestamp > latestBulkNodesTimestamp) {
            const data = change.data as GranularNodeChangesData
            accumulatedGranularNodes.push(...data.changes)
          }
          break
        }

        case FLOW_CHANGE_TYPES.BULK_EDGES:
          // Bulk operations override - clear any accumulated granular changes and update timestamp
          accumulatedGranularEdges.length = 0
          latestBulkEdgesTimestamp = change.timestamp
          consolidated.set(change.type, change)
          break

        case FLOW_CHANGE_TYPES.GRANULAR_EDGES: {
          // Only accumulate if no bulk change came after this granular change
          if (change.timestamp > latestBulkEdgesTimestamp) {
            const data = change.data as GranularEdgeChangesData
            accumulatedGranularEdges.push(...data.changes)
          }
          break
        }

        default:
          // For other types (like cursor_move if not skipped), keep the latest
          consolidated.set(change.type, change)
          break
      }
    }

    // Add accumulated granular changes if any exist and no bulk change overrides them
    if (accumulatedGranularNodes.length > 0) {
      // Create a consolidated granular nodes change with the latest timestamp from accumulated changes
      const latestGranularNodeTimestamp = Math.max(
        ...changes
          .filter(c => c.type === FLOW_CHANGE_TYPES.GRANULAR_NODES && c.timestamp > latestBulkNodesTimestamp)
          .map(c => c.timestamp)
      )

      consolidated.set(FLOW_CHANGE_TYPES.GRANULAR_NODES, {
        type: FLOW_CHANGE_TYPES.GRANULAR_NODES,
        roomId: changes[0].roomId, // Use roomId from first change
        userId: changes[0].userId, // Use userId from first change
        data: { changes: accumulatedGranularNodes } as GranularNodeChangesData,
        timestamp: latestGranularNodeTimestamp
      })
    }

    if (accumulatedGranularEdges.length > 0) {
      // Create a consolidated granular edges change with the latest timestamp from accumulated changes
      const latestGranularEdgeTimestamp = Math.max(
        ...changes
          .filter(c => c.type === FLOW_CHANGE_TYPES.GRANULAR_EDGES && c.timestamp > latestBulkEdgesTimestamp)
          .map(c => c.timestamp)
      )

      consolidated.set(FLOW_CHANGE_TYPES.GRANULAR_EDGES, {
        type: FLOW_CHANGE_TYPES.GRANULAR_EDGES,
        roomId: changes[0].roomId, // Use roomId from first change
        userId: changes[0].userId, // Use userId from first change
        data: { changes: accumulatedGranularEdges } as GranularEdgeChangesData,
        timestamp: latestGranularEdgeTimestamp
      })
    }

    // Log consolidation summary
    if (changes.length > 1) {
      const _summary = Array.from(changeTypeCounts.entries())
        .map(([type, count]) => `${type}:${count}`)
        .join(', ')
      const _granularNodesCount = accumulatedGranularNodes.length
      const _granularEdgesCount = accumulatedGranularEdges.length
      // Consolidated changes for batch processing
    }

    return consolidated
  }

  private applyConsolidatedChanges(currentData: FlowData, consolidatedChanges: Map<string, FlowChangeEvent>): FlowData {
    // Start with current data and only modify what's necessary
    let result = currentData
    let hasChanges = false

    // Get both bulk and granular changes for nodes
    const bulkNodesChange = consolidatedChanges.get(FLOW_CHANGE_TYPES.BULK_NODES)
    const granularNodesChange = consolidatedChanges.get(FLOW_CHANGE_TYPES.GRANULAR_NODES)

    // Apply node changes based on timestamp precedence
    if (bulkNodesChange && granularNodesChange) {
      // Both exist - apply based on timestamp (latest wins)
      if (bulkNodesChange.timestamp > granularNodesChange.timestamp) {
        // Bulk change is newer - apply bulk only
        const data = bulkNodesChange.data as BulkNodesData
        result = { ...result, nodes: data.nodes }
        hasChanges = true
        console.log('Applied bulk nodes change (newer than granular)')
      } else {
        // Granular changes are newer - apply granular to current nodes
        const data = granularNodesChange.data as GranularNodeChangesData
        const { applyNodeChanges } = require('@xyflow/react')
        result = { ...result, nodes: applyNodeChanges(data.changes, result.nodes) }
        hasChanges = true
        console.log(`Applied ${data.changes.length} accumulated granular node changes (newer than bulk)`)
      }
    } else if (bulkNodesChange) {
      // Only bulk change exists
      const data = bulkNodesChange.data as BulkNodesData
      result = { ...result, nodes: data.nodes }
      hasChanges = true
      console.log('Applied bulk nodes change (only option)')
    } else if (granularNodesChange) {
      // Only granular changes exist
      const data = granularNodesChange.data as GranularNodeChangesData
      const { applyNodeChanges } = require('@xyflow/react')
      result = { ...result, nodes: applyNodeChanges(data.changes, result.nodes) }
      hasChanges = true
      console.log(`Applied ${data.changes.length} accumulated granular node changes (only option)`)
    }

    // Get both bulk and granular changes for edges
    const bulkEdgesChange = consolidatedChanges.get(FLOW_CHANGE_TYPES.BULK_EDGES)
    const granularEdgesChange = consolidatedChanges.get(FLOW_CHANGE_TYPES.GRANULAR_EDGES)

    // Apply edge changes based on timestamp precedence
    if (bulkEdgesChange && granularEdgesChange) {
      // Both exist - apply based on timestamp (latest wins)
      if (bulkEdgesChange.timestamp > granularEdgesChange.timestamp) {
        // Bulk change is newer - apply bulk only
        const data = bulkEdgesChange.data as BulkEdgesData
        result = { ...result, edges: data.edges }
        hasChanges = true
        console.log('Applied bulk edges change (newer than granular)')
      } else {
        // Granular changes are newer - apply granular to current edges
        const data = granularEdgesChange.data as GranularEdgeChangesData
        const { applyEdgeChanges } = require('@xyflow/react')
        result = { ...result, edges: applyEdgeChanges(data.changes, result.edges) }
        hasChanges = true
        console.log(`Applied ${data.changes.length} accumulated granular edge changes (newer than bulk)`)
      }
    } else if (bulkEdgesChange) {
      // Only bulk change exists
      const data = bulkEdgesChange.data as BulkEdgesData
      result = { ...result, edges: data.edges }
      hasChanges = true
      console.log('Applied bulk edges change (only option)')
    } else if (granularEdgesChange) {
      // Only granular changes exist
      const data = granularEdgesChange.data as GranularEdgeChangesData
      const { applyEdgeChanges } = require('@xyflow/react')
      result = { ...result, edges: applyEdgeChanges(data.changes, result.edges) }
      hasChanges = true
      console.log(`Applied ${data.changes.length} accumulated granular edge changes (only option)`)
    }

    return hasChanges ? result : currentData
  }



  private async authenticateUser(token: string) {
    // This would typically verify a JWT token or session
    // For now, we'll implement a basic approach
    try {
      // You might want to implement proper JWT verification here
      // For this example, we'll use a simple approach
      return await db.user.findFirst({
        where: { id: token } // In real implementation, decode JWT to get user ID
      })
    } catch {
      return null
    }
  }

  private async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await db.flowRoom.findFirst({
        where: {
          id: roomId,
          OR: [
            { ownerId: userId },
            { isPublic: true },
            {
              participants: {
                some: { userId }
              }
            }
          ]
        }
      })

      return !!room
    } catch {
      return false
    }
  }

  private getActionDetails(changeType: string, data: FlowEventData) {
    let action = 'unknown'
    let details: Record<string, any> = {}
    let nodeCount = 0
    let edgeCount = 0

    switch (changeType) {
      case FLOW_CHANGE_TYPES.BULK_NODES:
        const bulkNodesData = data as BulkNodesData
        nodeCount = bulkNodesData.nodes.length
        action = nodeCount === 0 ? 'clear_all_nodes' : 'bulk_update_nodes'

        // Enhanced metadata for bulk nodes
        details = {
          nodeCount,
          operation: nodeCount === 0 ? 'clear' : 'bulk_update',
          nodes: bulkNodesData.nodes.map(node => ({
            id: node.id,
            type: node.type,
            label: node.data?.label || 'Untitled',
            position: node.position,
            selected: node.selected || false
          }))
        }
        break

      case FLOW_CHANGE_TYPES.GRANULAR_NODES:
        const granularNodesData = data as GranularNodeChangesData
        const changes = granularNodesData.changes
        nodeCount = changes.length

        // Analyze the types of changes
        const changeTypes = changes.map(change => change.type)
        const uniqueChangeTypes = [...new Set(changeTypes)]

        if (uniqueChangeTypes.includes('add')) {
          action = 'add_nodes'
        } else if (uniqueChangeTypes.includes('remove')) {
          action = 'delete_nodes'
        } else if (uniqueChangeTypes.includes('position')) {
          action = 'move_nodes'
        } else if (uniqueChangeTypes.includes('replace')) {
          action = 'update_nodes'
        } else {
          action = 'modify_nodes'
        }

        // Enhanced metadata for granular node changes
        details = {
          changeTypes: uniqueChangeTypes,
          nodeCount,
          changes: changes.map(change => {
            const baseChange = {
              type: change.type,
              id: this.getNodeChangeId(change)
            }

            // Add specific details based on change type
            if (change.type === 'add' && 'item' in change && change.item) {
              return {
                ...baseChange,
                nodeType: change.item.type,
                label: change.item.data?.label || 'Untitled',
                position: change.item.position,
                data: change.item.data
              }
            } else if (change.type === 'position' && 'position' in change) {
              return {
                ...baseChange,
                newPosition: change.position,
                positionAbsolute: change.positionAbsolute
              }
            } else if (change.type === 'replace' && 'item' in change && change.item) {
              return {
                ...baseChange,
                nodeType: change.item.type,
                label: change.item.data?.label || 'Untitled',
                position: change.item.position,
                selected: change.item.selected || false,
                data: change.item.data
              }
            } else if (change.type === 'remove') {
              return {
                ...baseChange,
                operation: 'delete'
              }
            } else if (change.type === 'select') {
              return {
                ...baseChange,
                selected: 'selected' in change ? change.selected : true
              }
            }

            return baseChange
          })
        }
        break

      case FLOW_CHANGE_TYPES.BULK_EDGES:
        const bulkEdgesData = data as BulkEdgesData
        edgeCount = bulkEdgesData.edges.length
        action = edgeCount === 0 ? 'clear_all_edges' : 'bulk_update_edges'

        // Enhanced metadata for bulk edges
        details = {
          edgeCount,
          operation: edgeCount === 0 ? 'clear' : 'bulk_update',
          edges: bulkEdgesData.edges.map(edge => ({
            id: edge.id,
            type: edge.type || 'default',
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            label: edge.label || '',
            animated: edge.animated || false,
            selected: edge.selected || false
          }))
        }
        break

      case FLOW_CHANGE_TYPES.GRANULAR_EDGES:
        const granularEdgesData = data as GranularEdgeChangesData
        const edgeChanges = granularEdgesData.changes
        edgeCount = edgeChanges.length

        const edgeChangeTypes = edgeChanges.map(change => change.type)
        const uniqueEdgeChangeTypes = [...new Set(edgeChangeTypes)]

        if (uniqueEdgeChangeTypes.includes('add')) {
          action = 'add_edges'
        } else if (uniqueEdgeChangeTypes.includes('remove')) {
          action = 'delete_edges'
        } else {
          action = 'modify_edges'
        }

        // Enhanced metadata for granular edge changes
        details = {
          changeTypes: uniqueEdgeChangeTypes,
          edgeCount,
          changes: edgeChanges.map(change => {
            const baseChange = {
              type: change.type,
              id: this.getEdgeChangeId(change)
            }

            // Add specific details based on change type
            if (change.type === 'add' && 'item' in change && change.item) {
              return {
                ...baseChange,
                edgeType: change.item.type || 'default',
                source: change.item.source,
                target: change.item.target,
                sourceHandle: change.item.sourceHandle,
                targetHandle: change.item.targetHandle,
                label: (change.item as any).label || '',
                animated: change.item.animated || false,
                data: change.item.data
              }
            } else if (change.type === 'remove') {
              return {
                ...baseChange,
                operation: 'delete'
              }
            } else if (change.type === 'select') {
              return {
                ...baseChange,
                selected: 'selected' in change ? change.selected : true
              }
            }

            return baseChange
          })
        }
        break

      case FLOW_CHANGE_TYPES.CURSOR_MOVE:
        action = 'cursor_move'
        const cursorData = data as CursorMoveData

        // Enhanced metadata for cursor movement
        details = {
          position: {
            x: cursorData.x,
            y: cursorData.y
          },
          timestamp: new Date().toISOString(),
          movement: 'cursor_position_update'
        }
        break
    }

    return { action, details, nodeCount, edgeCount }
  }

  private getSyncSummary(events: FlowChangeEvent[]) {
    const summary = {
      nodeActions: [] as string[],
      edgeActions: [] as string[],
      totalNodeChanges: 0,
      totalEdgeChanges: 0,
      actionCounts: {} as Record<string, number>
    }

    events.forEach(event => {
      const actionDetails = this.getActionDetails(event.type, event.data)
      const action = actionDetails.action

      // Count actions
      summary.actionCounts[action] = (summary.actionCounts[action] || 0) + 1

      // Track node and edge changes
      if (action.includes('node')) {
        summary.nodeActions.push(action)
        summary.totalNodeChanges += actionDetails.nodeCount
      }
      if (action.includes('edge')) {
        summary.edgeActions.push(action)
        summary.totalEdgeChanges += actionDetails.edgeCount
      }
    })

    return summary
  }

  private async getRoomDataWithFallback(roomId: string): Promise<RoomData | null> {
    try {
      // First, try to get from Redis cache
      let roomData = await flowRedisManager.getFlowRoom(roomId)

      if (!roomData) {
        console.log(`Cache miss for room ${roomId}, loading from database`)

        // Cache miss - load from database
        const dbRoom = await db.flowRoom.findUnique({
          where: { id: roomId },
          select: {
            id: true,
            ownerId: true,
            flowData: true,
            updatedAt: true
          }
        })

        if (dbRoom) {
          // Create room data structure with proper typing
          const flowData: FlowData = {
            nodes: [],
            edges: [],
            viewport: undefined,
            ...(dbRoom.flowData as Record<string, unknown> || {})
          }

          roomData = {
            roomId: dbRoom.id,
            ownerId: dbRoom.ownerId,
            flowData,
            lastSyncedAt: dbRoom.updatedAt.toISOString()
          }

          // Cache it for future requests
          await flowRedisManager.cacheFlowRoom(roomId, roomData)
          console.log(`Cached room data for ${roomId} from database`)
        } else {
          console.warn(`Room ${roomId} not found in database`)
          return null
        }
      }

      return roomData as RoomData
    } catch (error) {
      console.error('Error getting room data with fallback:', error)
      return null
    }
  }

  private async getUserRoleInRoom(roomId: string, userId: string): Promise<string> {
    try {
      const room = await db.flowRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            where: { userId }
          }
        }
      })

      if (room?.ownerId === userId) return 'OWNER'
      if (room?.participants[0]) return room.participants[0].role
      return 'VIEWER'
    } catch {
      return 'VIEWER'
    }
  }

  public getIO(): SocketIOServer {
    return this.io
  }

  // Method to finalize all rooms during server shutdown
  public async finalizeAllRooms(): Promise<void> {
    console.log('Finalizing all rooms before server shutdown...')

    const allRoomIds = new Set([
      ...Array.from(this.broadcastQueues.keys()),
      ...Array.from(this.databaseQueues.keys())
    ])

    const finalizationPromises = Array.from(allRoomIds).map(async (roomId) => {
      try {
        await this.finalizeRoomBeforeCleanup(roomId)
        this.cleanupRoomQueues(roomId)
      } catch (error) {
        console.error(`Error finalizing room ${roomId} during shutdown:`, error)
      }
    })

    await Promise.all(finalizationPromises)
    console.log(`Finalized ${allRoomIds.size} rooms during shutdown`)
  }
}

export let flowWebSocketManager: FlowWebSocketManager | null = null

export function initializeWebSocketManager(server: HTTPServer): SocketIOServer {
  if (!flowWebSocketManager) {
    flowWebSocketManager = new FlowWebSocketManager(server)

    // Setup graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, performing graceful shutdown...`)

      if (flowWebSocketManager) {
        await flowWebSocketManager.finalizeAllRooms()
      }

      process.exit(0)
    }

    // Handle various shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')) // Nodemon restart
  }
  return flowWebSocketManager.getIO()
}
