import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { addEdge, Connection, NodeChange, EdgeChange, applyNodeChanges, applyEdgeChanges } from '@xyflow/react'
import { CustomNode, CustomEdge, CustomNodeData, NodeType, initialNodes, initialEdges } from '@/components/reactflow/node-types'
import { io, Socket } from 'socket.io-client'
import debounce from 'lodash.debounce'
import {
  FlowChangeEvent,
  FlowEventData,
  BulkNodesData,
  GranularNodeChangesData,
  BulkEdgesData,
  GranularEdgeChangesData,
  CursorMoveData,
  FlowViewport
} from '@/lib/websocket'
import { COLLABORATION_CONSTANTS, WEBSOCKET_EVENTS, FLOW_CHANGE_TYPES } from '@/lib/constants/collaboration'
import { generateUniqueNodeId, fixDuplicateNodeIds, validateUniqueNodeIds } from '@/lib/utils/node-id-utils'

export interface Participant {
  userId: string
  name: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  cursor?: CursorMoveData
  isActive: boolean
}

// Separate state interface (data only)
interface FlowState {
  nodes: CustomNode[]
  edges: CustomEdge[]
  selectedNodeId: string | null
  nodeIdCounter: number

  // Collaboration state
  roomId: string | null
  isConnected: boolean
  participants: Participant[]
  socket: Socket | null
  isOwner: boolean
  canEdit: boolean
}

// Separate actions interface
interface FlowActions {
  // Original flow actions
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void
  addNode: (type: NodeType) => void
  updateNode: (nodeId: string, updates: Partial<CustomNodeData>) => void
  deleteSelectedNodes: () => void
  selectNode: (nodeId: string | null) => void
  clearAll: () => void

  // Collaboration actions
  connectToRoom: (roomId: string, userId: string) => Promise<void>
  disconnectFromRoom: () => void
  updateCursor: (x: number, y: number) => void
  loadRoomData: (flowData: { nodes: CustomNode[]; edges: CustomEdge[]; viewport?: FlowViewport }) => void
  handleRemoteChange: (event: FlowChangeEvent) => void
  setParticipants: (participants: Participant[]) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (userId: string) => void
  updateParticipantCursor: (userId: string, cursor: CursorMoveData) => void
}

// Cursor queue management (200ms batching, send last position in each batch)
interface CursorQueue {
  x: number
  y: number
  timestamp: number
  lastSentX?: number
  lastSentY?: number
  batchStartTime: number
}

const cursorQueues = new Map<string, CursorQueue>()
const cursorTimers = new Map<string, NodeJS.Timeout>()

function queueCursorUpdate(socket: Socket, roomId: string, x: number, y: number) {
  const currentQueue = cursorQueues.get(roomId)
  const now = Date.now()

  // Check if cursor position has actually changed
  if (currentQueue && currentQueue.lastSentX === x && currentQueue.lastSentY === y) {
    return // No change, don't queue or send
  }

  // Check if we have an active timer (within 200ms batch)
  const hasActiveTimer = cursorTimers.has(roomId)

  if (hasActiveTimer && currentQueue) {
    // We're within an active batch - just update the position (don't reset timer)
    cursorQueues.set(roomId, {
      x,
      y,
      timestamp: now,
      lastSentX: currentQueue.lastSentX,
      lastSentY: currentQueue.lastSentY,
      batchStartTime: currentQueue.batchStartTime
    })
    console.log(`Updated cursor position in active batch for room ${roomId}: (${x}, ${y})`)
  } else {
    // No active timer - start a new batch
    cursorQueues.set(roomId, {
      x,
      y,
      timestamp: now,
      lastSentX: currentQueue?.lastSentX,
      lastSentY: currentQueue?.lastSentY,
      batchStartTime: now
    })

    // Set timer for cursor batch delay to send the last position in this batch
    const timer = setTimeout(() => {
      const cursorData = cursorQueues.get(roomId)

      if (cursorData) {
        // Send the latest cursor position from this batch
        socket.emit(WEBSOCKET_EVENTS.CURSOR_MOVE, {
          x: cursorData.x,
          y: cursorData.y
        })

        // Update last sent position to track changes
        cursorQueues.set(roomId, {
          ...cursorData,
          lastSentX: cursorData.x,
          lastSentY: cursorData.y
        })

        console.log(`Sent batched cursor update for room ${roomId}: (${cursorData.x}, ${cursorData.y})`)
      }

      // Remove timer reference - batch is complete
      cursorTimers.delete(roomId)
    }, COLLABORATION_CONSTANTS.CURSOR_BATCH_DELAY)

    cursorTimers.set(roomId, timer)
    console.log(`Started new cursor batch for room ${roomId}: (${x}, ${y})`)
  }
}

function clearCursorQueue(roomId: string) {
  // Clear the timer
  const timer = cursorTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    cursorTimers.delete(roomId)
  }

  // Clear any pending cursor data
  cursorQueues.delete(roomId)

  console.log(`Cleared cursor queue for room ${roomId}`)
}

// Create the store with separated state and actions
export const useRemoteCollaborativeFlowStore = create<FlowState & FlowActions>()(
  devtools(
    (set, get) => {
      // Debounced function for sending changes
      const debouncedSendChange = debounce((type: FlowChangeEvent['type'], data: FlowEventData) => {
        const state = get()
        if (state.socket && state.roomId && state.canEdit) {
          state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
            type,
            roomId: state.roomId,
            data
          })
        }
      }, COLLABORATION_CONSTANTS.FLOW_CHANGE_DEBOUNCE_DELAY)

      return {
        // Initial state
        nodes: initialNodes,
        edges: initialEdges,
        selectedNodeId: null,
        nodeIdCounter: 4,

        // Collaboration state
        roomId: null,
        isConnected: false,
        participants: [],
        socket: null,
        isOwner: false,
        canEdit: false,

        // React Flow change handlers with real-time sync
        onNodesChange: (changes) => {
          const state = get()
          const newNodes = applyNodeChanges(changes, state.nodes) as CustomNode[]
          set({ nodes: newNodes }, false, 'onNodesChange')

          // Send individual changes to other participants (debounced)
          if (state.canEdit) {
            debouncedSendChange(FLOW_CHANGE_TYPES.GRANULAR_NODES, { changes } as GranularNodeChangesData)
          }
        },

        onEdgesChange: (changes) => {
          const state = get()
          const newEdges = applyEdgeChanges(changes, state.edges) as CustomEdge[]
          set({ edges: newEdges }, false, 'onEdgesChange')

          // Send individual changes to other participants (debounced)
          if (state.canEdit) {
            debouncedSendChange(FLOW_CHANGE_TYPES.GRANULAR_EDGES, { changes } as GranularEdgeChangesData)
          }
        },

        onConnect: (connection) => {
          const state = get()
          if (!state.canEdit) return

          const newEdges = addEdge(connection, state.edges) as CustomEdge[]
          set({ edges: newEdges }, false, 'onConnect')

          // Send change immediately for connections
          if (state.socket && state.roomId) {
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_EDGES,
              roomId: state.roomId,
              data: { edges: newEdges } as BulkEdgesData
            })
          }
        },

        addNode: (type) => {
          const state = get()
          if (!state.canEdit) return

          // Generate a unique ID to prevent collisions in collaborative environments
          const newNodeId = generateUniqueNodeId(state.nodes)

          const newNode: CustomNode = {
            id: newNodeId,
            type,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: {
              label: `${type} Node`,
              description: '',
              ...(type === 'input' && { inputValue: '' }),
              ...(type === 'output' && { outputValue: '' }),
            },
          }

          const newNodes = [...state.nodes, newNode]
          set({
            nodes: newNodes,
            nodeIdCounter: state.nodeIdCounter + 1
          }, false, 'addNode')

          // Send change immediately for new nodes
          if (state.socket && state.roomId) {
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_NODES,
              roomId: state.roomId,
              data: { nodes: newNodes } as BulkNodesData
            })
          }
        },

        updateNode: (nodeId, updates) => {
          const state = get()
          if (!state.canEdit) return

          const newNodes = state.nodes.map(node =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...updates } }
              : node
          ) as CustomNode[]

          set({ nodes: newNodes }, false, 'updateNode')

          // Send individual change for node data updates (debounced for frequent updates like typing)
          const nodeChange: NodeChange = {
            id: nodeId,
            type: 'replace',
            item: newNodes.find(node => node.id === nodeId)!
          }
          debouncedSendChange(FLOW_CHANGE_TYPES.GRANULAR_NODES, { changes: [nodeChange] } as GranularNodeChangesData)
        },

        deleteSelectedNodes: () => {
          const state = get()
          if (!state.canEdit || !state.selectedNodeId) return

          const newNodes = state.nodes.filter(node => node.id !== state.selectedNodeId)
          const newEdges = state.edges.filter(edge =>
            edge.source !== state.selectedNodeId && edge.target !== state.selectedNodeId
          )

          set({
            nodes: newNodes,
            edges: newEdges,
            selectedNodeId: null
          }, false, 'deleteSelectedNodes')

          // Send changes immediately for deletions
          if (state.socket && state.roomId) {
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_NODES,
              roomId: state.roomId,
              data: { nodes: newNodes } as BulkNodesData
            })
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_EDGES,
              roomId: state.roomId,
              data: { edges: newEdges } as BulkEdgesData
            })
          }
        },

        selectNode: (nodeId) => {
          set({ selectedNodeId: nodeId }, false, 'selectNode')
        },

        clearAll: () => {
          const state = get()
          if (!state.canEdit) return

          set({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            nodeIdCounter: 1
          }, false, 'clearAll')

          // Send clear changes
          if (state.socket && state.roomId) {
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_NODES,
              roomId: state.roomId,
              data: { nodes: [] } as BulkNodesData
            })
            state.socket.emit(WEBSOCKET_EVENTS.FLOW_CHANGE, {
              type: FLOW_CHANGE_TYPES.BULK_EDGES,
              roomId: state.roomId,
              data: { edges: [] } as BulkEdgesData
            })
          }
        },

        // Collaboration actions
        connectToRoom: async (roomId: string, userId: string) => {
          const state = get()

          // Disconnect from previous room if any
          if (state.socket) {
            state.socket.disconnect()
          }

          try {
            // Ensure WebSocket server is initialized before connecting
            console.log('Initializing WebSocket server...')
            const initResponse = await fetch('/api/socket')
            if (!initResponse.ok) {
              throw new Error('Failed to initialize WebSocket server')
            }
            console.log('WebSocket server initialized successfully')

            // Add a small delay to ensure server is ready
            await new Promise(resolve => setTimeout(resolve, 100))

            // Create new socket connection
            const socket = io(process.env.NEXT_PUBLIC_WS_URL || window.location.origin, {
              transports: ['websocket', 'polling'],
              timeout: 10000,
              forceNew: true
            })

            set({ socket, roomId }, false, 'connectToRoom')

            return new Promise<void>((resolve, reject) => {
              // Set up timeout for connection
              const connectionTimeout = setTimeout(() => {
                socket.disconnect()
                reject(new Error('Connection timeout - WebSocket server may not be ready'))
              }, 15000)

              socket.on(WEBSOCKET_EVENTS.CONNECT, () => {
                console.log('Connected to WebSocket server')
                clearTimeout(connectionTimeout)

                // Join the room
                socket.emit(WEBSOCKET_EVENTS.JOIN_ROOM, { roomId, token: userId })
              })

              socket.on(WEBSOCKET_EVENTS.ROOM_JOINED, (data: { roomId: string; flowData: any; participants: Participant[] }) => {
                console.log('Joined room:', data.roomId)

                // Load room data
                if (data.flowData) {
                  get().loadRoomData(data.flowData)
                }

                // Set participants
                get().setParticipants(data.participants)

                set({
                  isConnected: true,
                  canEdit: true // Will be updated based on actual permissions
                }, false, 'room_joined')

                resolve()
              })

              socket.on(WEBSOCKET_EVENTS.FLOW_CHANGE, (event: FlowChangeEvent) => {
                get().handleRemoteChange(event)
              })

              socket.on(WEBSOCKET_EVENTS.PARTICIPANT_JOINED, (participant: Participant) => {
                get().addParticipant(participant)
              })

              socket.on(WEBSOCKET_EVENTS.PARTICIPANT_LEFT, (data: { userId: string }) => {
                get().removeParticipant(data.userId)
              })

              socket.on(WEBSOCKET_EVENTS.CURSOR_MOVE, (data: { userId: string; cursor: { x: number; y: number } }) => {
                get().updateParticipantCursor(data.userId, data.cursor)
              })

              socket.on('operation_conflict', (data: { type: string; timestamp: number; reason: string; suggestion: string }) => {
                console.warn('Operation conflict:', data)
                // You can add toast notification here or handle conflicts as needed
                // For now, just log the conflict
              })

              socket.on(WEBSOCKET_EVENTS.ERROR, (error: any) => {
                console.error('WebSocket error:', error)
                clearTimeout(connectionTimeout)
                reject(new Error(error.message))
              })

              socket.on('connect_error', (error: any) => {
                console.error('WebSocket connection error:', error)
                clearTimeout(connectionTimeout)
                reject(new Error(`Connection failed: ${error.message}`))
              })

              socket.on(WEBSOCKET_EVENTS.DISCONNECT, () => {
                console.log('Disconnected from WebSocket server')
                clearTimeout(connectionTimeout)
                set({
                  isConnected: false,
                  participants: []
                }, false, 'disconnected')
              })
            })
          } catch (error) {
            console.error('Failed to connect to room:', error)
            throw error
          }
        },

        disconnectFromRoom: () => {
          const state = get()

          // Clear cursor queue before disconnecting
          if (state.roomId) {
            clearCursorQueue(state.roomId)
          }

          if (state.socket) {
            state.socket.disconnect()
          }

          set({
            socket: null,
            roomId: null,
            isConnected: false,
            participants: [],
            canEdit: false,
            isOwner: false
          }, false, 'disconnectFromRoom')
        },

        updateCursor: (x: number, y: number) => {
          const state = get()

          if (state.socket && state.roomId) {
            // Queue cursor position for batched sending (200ms intervals)
            queueCursorUpdate(state.socket, state.roomId, x, y)
          }
        },

        loadRoomData: (flowData: { nodes: CustomNode[]; edges: CustomEdge[]; viewport?: FlowViewport }) => {
          if (flowData) {
            const existingNodes = flowData.nodes || []

            // Validate and fix any duplicate node IDs
            const duplicateIds = validateUniqueNodeIds(existingNodes)
            let processedNodes = existingNodes

            if (duplicateIds.length > 0) {
              console.warn(`Found duplicate node IDs in room data: ${duplicateIds.join(', ')}`)
              processedNodes = fixDuplicateNodeIds(existingNodes)
              console.log('Fixed duplicate node IDs in loaded room data')
            }

            // Calculate the next node counter based on existing nodes
            // Extract numeric IDs from existing nodes and find the maximum
            let maxNodeId = 0

            processedNodes.forEach(node => {
              // Try to extract numeric ID from node-X format
              const match = node.id.match(/^node-(\d+)$/)
              if (match) {
                const nodeNum = parseInt(match[1], 10)
                if (nodeNum > maxNodeId) {
                  maxNodeId = nodeNum
                }
              }
            })

            set({
              nodes: processedNodes,
              edges: flowData.edges || [],
              selectedNodeId: null,
              nodeIdCounter: maxNodeId + 1 // Set counter to next available number
            }, false, 'loadRoomData')
          }
        },

        handleRemoteChange: (event: FlowChangeEvent) => {
          // Don't apply our own changes
          const state = get()
          if (event.userId === state.socket?.id) return

          switch (event.type) {
            case FLOW_CHANGE_TYPES.BULK_NODES: {
              // Bulk node operation (replace all nodes)
              const data = event.data as BulkNodesData
              let processedNodes = data.nodes

              // Validate and fix any duplicate node IDs from remote changes
              const duplicateIds = validateUniqueNodeIds(processedNodes)
              if (duplicateIds.length > 0) {
                console.warn(`Received remote nodes with duplicate IDs: ${duplicateIds.join(', ')}`)
                processedNodes = fixDuplicateNodeIds(processedNodes)
                console.log('Fixed duplicate node IDs from remote change')
              }

              set({ nodes: processedNodes }, false, 'remote_bulk_nodes')
              break
            }
            case FLOW_CHANGE_TYPES.GRANULAR_NODES: {
              // Granular node changes
              const data = event.data as GranularNodeChangesData
              const currentNodes = state.nodes
              const updatedNodes = applyNodeChanges(data.changes, currentNodes) as CustomNode[]

              // Validate and fix any duplicate node IDs that might result from changes
              const duplicateIds = validateUniqueNodeIds(updatedNodes)
              let processedNodes = updatedNodes
              if (duplicateIds.length > 0) {
                console.warn(`Remote node changes resulted in duplicate IDs: ${duplicateIds.join(', ')}`)
                processedNodes = fixDuplicateNodeIds(updatedNodes)
                console.log('Fixed duplicate node IDs from remote node changes')
              }

              set({ nodes: processedNodes }, false, 'remote_granular_nodes')
              break
            }
            case FLOW_CHANGE_TYPES.BULK_EDGES: {
              // Bulk edge operation (replace all edges)
              const data = event.data as BulkEdgesData
              set({ edges: data.edges }, false, 'remote_bulk_edges')
              break
            }
            case FLOW_CHANGE_TYPES.GRANULAR_EDGES: {
              // Granular edge changes
              const data = event.data as GranularEdgeChangesData
              const currentEdges = state.edges
              const updatedEdges = applyEdgeChanges(data.changes, currentEdges) as CustomEdge[]
              set({ edges: updatedEdges }, false, 'remote_granular_edges')
              break
            }
            case FLOW_CHANGE_TYPES.CURSOR_MOVE:
              // Cursor moves are handled separately
              break
          }
        },

        setParticipants: (participants: Participant[]) => {
          set({ participants }, false, 'setParticipants')
        },

        addParticipant: (participant: Participant) => {
          const state = get()
          const existingIndex = state.participants.findIndex(p => p.userId === participant.userId)

          if (existingIndex >= 0) {
            // Update existing participant
            const updatedParticipants = [...state.participants]
            updatedParticipants[existingIndex] = participant
            set({ participants: updatedParticipants }, false, 'updateParticipant')
          } else {
            // Add new participant
            set({
              participants: [...state.participants, participant]
            }, false, 'addParticipant')
          }
        },

        removeParticipant: (userId: string) => {
          const state = get()
          set({
            participants: state.participants.filter(p => p.userId !== userId)
          }, false, 'removeParticipant')
        },

        updateParticipantCursor: (userId: string, cursor: CursorMoveData) => {
          const state = get()
          const updatedParticipants = state.participants.map(p =>
            p.userId === userId ? { ...p, cursor } : p
          )
          set({ participants: updatedParticipants }, false, 'updateParticipantCursor')
        }
      }
    },
    { name: 'flow-store' }
  )
)

// Hooks for better component integration
export const useRemoteCollaborativeFlowActions = () => {
  return useRemoteCollaborativeFlowStore(useShallow(state => ({
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    onConnect: state.onConnect,
    addNode: state.addNode,
    updateNode: state.updateNode,
    deleteSelectedNodes: state.deleteSelectedNodes,
    selectNode: state.selectNode,
    clearAll: state.clearAll,
    connectToRoom: state.connectToRoom,
    disconnectFromRoom: state.disconnectFromRoom,
    updateCursor: state.updateCursor
  })))
}

export const useRemoteCollaborativeSelectedNode = () => {
  return useRemoteCollaborativeFlowStore(useShallow(state => {
    const selectedNodeId = state.selectedNodeId
    return selectedNodeId ? state.nodes.find(node => node.id === selectedNodeId) : null
  }))
}

export const useRemoteCollaborationState = () => {
  return useRemoteCollaborativeFlowStore(useShallow(state => ({
    roomId: state.roomId,
    isConnected: state.isConnected,
    participants: state.participants,
    canEdit: state.canEdit,
    isOwner: state.isOwner
  })))
}
