import Redis from 'ioredis'
import { env } from '@/env'
import { COLLABORATION_CONSTANTS } from '@/lib/constants/collaboration'
// Removed logger import - using database-only logging

const getRedisConfig = () => {
  // Build configuration from host and port
  const config: any = {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    connectTimeout: 10000,
    lazyConnect: true,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  }

  // Add authentication if provided
  if (env.REDIS_USERNAME && env.REDIS_PASSWORD) {
    config.username = env.REDIS_USERNAME
    config.password = env.REDIS_PASSWORD
  } else if (env.REDIS_PASSWORD) {
    config.password = env.REDIS_PASSWORD
  }

  // Add database selection if provided
  if (env.REDIS_DB) {
    // For Redis Cloud, database name might be a string, but ioredis expects a number
    // Try to parse as number, fallback to 0 if it's a string
    const dbNum = parseInt(env.REDIS_DB)
    config.db = isNaN(dbNum) ? 0 : dbNum
  }

  // Note: TLS is not required for this Redis Cloud configuration
  // Some Redis Cloud instances use non-TLS connections
  // Enable TLS only if your Redis Cloud instance requires it
  // if (env.REDIS_HOST.includes('redns.redis-cloud.com')) {
  //   config.tls = {
  //     servername: env.REDIS_HOST,
  //     rejectUnauthorized: false
  //   }
  // }

  return config
}

// Create Redis client with environment configuration
const redisConfig = getRedisConfig()
export const redis = new Redis(redisConfig)

// Handle Redis connection errors gracefully
redis.on('error', (error) => {
  console.error('Redis connection error:', error.message)
})

redis.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Redis connected successfully')
})

// Flow room cache keys
export const FLOW_ROOM_KEY = (roomId: string) => `flow:room:${roomId}`
export const FLOW_ROOM_PARTICIPANTS_KEY = (roomId: string) => `flow:room:${roomId}:participants`
export const FLOW_ROOM_CHANGES_KEY = (roomId: string) => `flow:room:${roomId}:changes`

// Cache TTL (Time To Live) in seconds - using constants from collaboration config
export const FLOW_ROOM_TTL = COLLABORATION_CONSTANTS.REDIS_TTL.FLOW_ROOM
export const FLOW_PARTICIPANTS_TTL = COLLABORATION_CONSTANTS.REDIS_TTL.FLOW_PARTICIPANTS
export const FLOW_CHANGES_TTL = COLLABORATION_CONSTANTS.REDIS_TTL.FLOW_CHANGES

export interface FlowRoomCache {
  roomId: string
  ownerId: string
  flowData: {
    nodes: unknown[]
    edges: unknown[]
    viewport?: unknown
    [key: string]: unknown
  }
  lastSyncedAt: string
}

export interface ParticipantInfo {
  userId: string
  name: string
  role: string
  cursor?: { x: number; y: number }
  lastActiveAt: string
}

export class FlowRedisManager {
  // Cache flow room data
  async cacheFlowRoom(roomId: string, data: FlowRoomCache): Promise<void> {
    try {
      await redis.setex(
        FLOW_ROOM_KEY(roomId),
        FLOW_ROOM_TTL,
        JSON.stringify(data)
      )
    } catch (error) {
      throw error
    }
  }

  // Get cached flow room data
  async getFlowRoom(roomId: string): Promise<FlowRoomCache | null> {
    try {
      const data = await redis.get(FLOW_ROOM_KEY(roomId))
      return data ? JSON.parse(data) : null
    } catch (error) {
      throw error
    }
  }

  // Add participant to room
  async addParticipant(roomId: string, participant: ParticipantInfo): Promise<void> {
    await redis.hset(
      FLOW_ROOM_PARTICIPANTS_KEY(roomId),
      participant.userId,
      JSON.stringify(participant)
    )
    await redis.expire(FLOW_ROOM_PARTICIPANTS_KEY(roomId), FLOW_PARTICIPANTS_TTL)
  }

  // Remove participant from room
  async removeParticipant(roomId: string, userId: string): Promise<void> {
    await redis.hdel(FLOW_ROOM_PARTICIPANTS_KEY(roomId), userId)
  }

  // Get all participants in room
  async getParticipants(roomId: string): Promise<ParticipantInfo[]> {
    const data = await redis.hgetall(FLOW_ROOM_PARTICIPANTS_KEY(roomId))
    return Object.values(data).map(p => JSON.parse(p))
  }

  // Update participant cursor position
  async updateParticipantCursor(
    roomId: string,
    userId: string,
    cursor: { x: number; y: number }
  ): Promise<void> {
    const participantData = await redis.hget(FLOW_ROOM_PARTICIPANTS_KEY(roomId), userId)
    if (participantData) {
      const participant = JSON.parse(participantData)
      participant.cursor = cursor
      participant.lastActiveAt = new Date().toISOString()
      await redis.hset(
        FLOW_ROOM_PARTICIPANTS_KEY(roomId),
        userId,
        JSON.stringify(participant)
      )
    }
  }

  // Store pending changes (for batch processing)
  async addPendingChange(roomId: string, change: any): Promise<void> {
    await redis.lpush(
      FLOW_ROOM_CHANGES_KEY(roomId),
      JSON.stringify({
        ...change,
        timestamp: Date.now()
      })
    )
    await redis.expire(FLOW_ROOM_CHANGES_KEY(roomId), FLOW_CHANGES_TTL)
  }

  // Get and clear pending changes
  async getAndClearPendingChanges(roomId: string): Promise<any[]> {
    const changes = await redis.lrange(FLOW_ROOM_CHANGES_KEY(roomId), 0, -1)
    if (changes.length > 0) {
      await redis.del(FLOW_ROOM_CHANGES_KEY(roomId))
    }
    return changes.map(change => JSON.parse(change))
  }

  // Ensure room data exists in cache (with database fallback)
  async ensureRoomCached(roomId: string, dbFallback?: () => Promise<any>): Promise<FlowRoomCache | null> {
    let roomData = await this.getFlowRoom(roomId)

    if (!roomData && dbFallback) {
      const dbData = await dbFallback()
      if (dbData) {
        roomData = {
          roomId: dbData.id,
          ownerId: dbData.ownerId,
          flowData: dbData.flowData || { nodes: [], edges: [] },
          lastSyncedAt: dbData.updatedAt?.toISOString() || new Date().toISOString()
        }

        await this.cacheFlowRoom(roomId, roomData)
      }
    }

    return roomData
  }

  // Clean up room data
  async cleanupRoom(roomId: string): Promise<void> {
    await Promise.all([
      redis.del(FLOW_ROOM_KEY(roomId)),
      redis.del(FLOW_ROOM_PARTICIPANTS_KEY(roomId)),
      redis.del(FLOW_ROOM_CHANGES_KEY(roomId))
    ])
  }
}

export const flowRedisManager = new FlowRedisManager()
