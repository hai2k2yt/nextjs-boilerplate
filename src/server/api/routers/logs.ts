import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'
import { logger, LogLevel, LogCategory } from '@/lib/logger-init'

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
  // Get logs with filtering
  getLogs: publicProcedure
    .input(logFiltersSchema)
    .query(({ input }) => {
      return logger.getLogs(input)
    }),

  // Search logs
  searchLogs: publicProcedure
    .input(logSearchSchema)
    .query(({ input }) => {
      const logs = logger.getLogs(input.filters)
      
      // Simple text search in message and metadata
      const filteredLogs = logs.filter(log => {
        const searchText = input.query.toLowerCase()
        const messageMatch = log.message.toLowerCase().includes(searchText)
        const metadataMatch = log.metadata ? 
          JSON.stringify(log.metadata).toLowerCase().includes(searchText) : false
        
        return messageMatch || metadataMatch
      })

      return filteredLogs
    }),

  // Get statistics
  getStatistics: publicProcedure
    .query(() => {
      return logger.getStatistics()
    }),

  // Get recent logs (for dashboard widgets)
  getRecentLogs: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      level: z.nativeEnum(LogLevel).optional(),
    }))
    .query(({ input }) => {
      return logger.getLogs({
        limit: input.limit,
        level: input.level,
      })
    }),

  // Get logs by category (for category-specific views)
  getLogsByCategory: publicProcedure
    .input(z.object({
      category: z.nativeEnum(LogCategory),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(({ input }) => {
      return logger.getLogs({
        category: input.category,
        limit: input.limit,
      })
    }),

  // Get logs for a specific room (collaboration context)
  getRoomLogs: publicProcedure
    .input(z.object({
      roomId: z.string(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(({ input }) => {
      return logger.getLogs({
        roomId: input.roomId,
        limit: input.limit,
      })
    }),

  // Get logs for a specific user
  getUserLogs: publicProcedure
    .input(z.object({
      userId: z.string(),
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(({ input }) => {
      return logger.getLogs({
        userId: input.userId,
        limit: input.limit,
      })
    }),

  // Get performance metrics
  getPerformanceMetrics: publicProcedure
    .query(() => {
      const stats = logger.getStatistics()
      return {
        averageResponseTime: stats.performanceMetrics.averageResponseTime,
        slowestOperations: stats.performanceMetrics.slowestOperations,
      }
    }),

  // Get Redis metrics
  getRedisMetrics: publicProcedure
    .query(() => {
      const stats = logger.getStatistics()
      return stats.redisMetrics
    }),

  // Get collaboration metrics
  getCollaborationMetrics: publicProcedure
    .query(() => {
      const stats = logger.getStatistics()
      return stats.collaborationMetrics
    }),

  // Clear logs (protected - only authenticated users)
  clearLogs: protectedProcedure
    .mutation(() => {
      logger.clearLogs()
      return { success: true, message: 'Logs cleared successfully' }
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








})
