import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { db } from '@/server/db'

// Note: This router uses database audit logs as the single source of truth
// All log pages read from the AuditLog table for consistency

// Define log enums for validation
enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

enum LogCategory {
  SYSTEM = 'system',
  WEBSOCKET = 'websocket',
  REDIS = 'redis',
  DATABASE = 'database',
  COLLABORATION = 'collaboration',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

// Input validation schemas
const logFiltersSchema = z.object({
  level: z.nativeEnum(LogLevel).optional(),
  category: z.nativeEnum(LogCategory).optional(),
  userId: z.string().optional(),
  roomId: z.string().optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  limit: z.number().min(1).max(1000).default(100),
})

const logSearchSchema = z.object({
  query: z.string().min(1),
  filters: logFiltersSchema.optional(),
})

export const logsRouter = createTRPCRouter({
  // Get logs with filtering - using audit logs for consistency
  getLogs: publicProcedure
    .input(logFiltersSchema)
    .query(async ({ input }) => {
      // Get logs from audit log database for consistency across all log pages
      const auditLogs = await db.auditLog.findMany({
        where: {
          ...(input.userId && { userId: input.userId }),
          ...(input.roomId && { roomId: input.roomId }),
          // Map category filter to category field
          ...(input.category && { category: { contains: input.category, mode: 'insensitive' } }),
          ...(input.startTime && { timestamp: { gte: input.startTime } }),
          ...(input.endTime && { timestamp: { lte: input.endTime } }),
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit,
      })

      // Convert audit logs to logger format
      return auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        category: log.category as LogCategory,
        message: log.message,
        metadata: log.metadata,
        userId: log.userId,
        roomId: log.roomId,
      }))
    }),

  // Search logs in database
  searchLogs: publicProcedure
    .input(logSearchSchema)
    .query(async ({ input }) => {
      const auditLogs = await db.auditLog.findMany({
        where: {
          OR: [
            { message: { contains: input.query, mode: 'insensitive' } },
            { category: { contains: input.query, mode: 'insensitive' } },
          ],
          ...(input.filters?.userId && { userId: input.filters.userId }),
          ...(input.filters?.roomId && { roomId: input.filters.roomId }),
          ...(input.filters?.category && { category: { contains: input.filters.category, mode: 'insensitive' } }),
          ...(input.filters?.startTime && { timestamp: { gte: input.filters.startTime } }),
          ...(input.filters?.endTime && { timestamp: { lte: input.filters.endTime } }),
        },
        orderBy: { timestamp: 'desc' },
        take: input.filters?.limit || 100,
      })

      // Convert to logger format
      return auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        category: log.category as LogCategory,
        message: log.message,
        metadata: log.metadata,
        userId: log.userId,
        roomId: log.roomId,
      }))
    }),

  // Get statistics - using audit logs for consistency
  getStatistics: publicProcedure
    .query(async () => {
      // Get statistics from audit logs
      const totalLogs = await db.auditLog.count()
      // Get recent logs for analysis (not used in response but kept for potential future use)
      const _recentLogs = await db.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      })

      // Calculate basic statistics
      const logsByCategory = await db.auditLog.groupBy({
        by: ['category'],
        _count: { category: true },
      })

      const categoryStats = Object.values(LogCategory).reduce((acc, category) => {
        const found = logsByCategory.find(stat => stat.category.toLowerCase().includes(category))
        acc[category] = found?._count.category || 0
        return acc
      }, {} as Record<LogCategory, number>)

      const logsByLevel = {
        [LogLevel.ERROR]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.INFO]: totalLogs, // Most audit logs are info level
        [LogLevel.DEBUG]: 0,
      }

      return {
        totalLogs,
        logsByLevel,
        logsByCategory: categoryStats,
        recentErrors: [], // Could be enhanced to track errors
        performanceMetrics: {
          averageResponseTime: 0,
          slowestOperations: [],
        },
        redisMetrics: {
          cacheHits: 0,
          cacheMisses: 0,
          hitRate: 0,
        },
        collaborationMetrics: {
          activeRooms: 0,
          totalParticipants: 0,
          conflictsResolved: 0,
        },
      }
    }),

  // Get recent logs from database (for dashboard widgets)
  getRecentLogs: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      level: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const auditLogs = await db.auditLog.findMany({
        where: {
          ...(input.level && { level: input.level }),
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit,
      })

      return auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level as LogLevel,
        category: log.category as LogCategory,
        message: log.message,
        metadata: log.metadata,
        userId: log.userId,
        roomId: log.roomId,
      }))
    }),

  // Get audit logs from database
  getAuditLogs: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(1000).default(100),
      category: z.string().optional(),
      roomId: z.string().optional(),
      userId: z.string().optional(),
      level: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const auditLogs = await ctx.db.auditLog.findMany({
        where: {
          ...(input.category && { category: input.category }),
          ...(input.roomId && { roomId: input.roomId }),
          ...(input.userId && { userId: input.userId }),
          ...(input.level && { level: input.level }),
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit,
      })

      return auditLogs
    }),

  // Get React Flow specific audit logs
  getFlowActionLogs: publicProcedure
    .input(z.object({
      roomId: z.string().optional(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const flowLogs = await ctx.db.auditLog.findMany({
        where: {
          category: 'collaboration',
          ...(input.roomId && { roomId: input.roomId }),
          message: {
            contains: 'Collaboration'
          }
        },
        orderBy: { timestamp: 'desc' },
        take: input.limit,
      })

      return flowLogs
    }),

  // Clear all logs
  clearLogs: protectedProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.auditLog.deleteMany({})
      return { success: true }
    }),

  // Get performance metrics (placeholder implementation)
  getPerformanceMetrics: publicProcedure
    .query(async () => {
      // Placeholder implementation - could be enhanced with real metrics
      return {
        averageResponseTime: 0,
        slowestOperations: [],
        throughput: 0,
        errorRate: 0,
      }
    }),

  // Get Redis metrics (placeholder implementation)
  getRedisMetrics: publicProcedure
    .query(async () => {
      // Placeholder implementation - could be enhanced with real Redis metrics
      return {
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        memoryUsage: 0,
        connectedClients: 0,
      }
    }),

  // Get collaboration metrics (placeholder implementation)
  getCollaborationMetrics: publicProcedure
    .query(async () => {
      // Placeholder implementation - could be enhanced with real collaboration metrics
      return {
        activeRooms: 0,
        totalParticipants: 0,
        conflictsResolved: 0,
        averageSessionDuration: 0,
      }
    }),
})
