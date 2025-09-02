import { v4 as uuidv4 } from 'uuid'

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Log categories for better organization
export enum LogCategory {
  WEBSOCKET = 'websocket',
  REDIS = 'redis',
  DATABASE = 'database',
  COLLABORATION = 'collaboration',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SYSTEM = 'system'
}

// Log entry interface
export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: LogCategory
  message: string
  metadata?: Record<string, any>
  correlationId?: string
  userId?: string
  roomId?: string
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
}

// Statistics interface
export interface LogStatistics {
  totalLogs: number
  logsByLevel: Record<LogLevel, number>
  logsByCategory: Record<LogCategory, number>
  recentErrors: LogEntry[]
  performanceMetrics: {
    averageResponseTime: number
    slowestOperations: Array<{
      operation: string
      duration: number
      timestamp: Date
    }>
  }
  redisMetrics: {
    cacheHits: number
    cacheMisses: number
    hitRate: number
  }
  collaborationMetrics: {
    activeRooms: number
    totalParticipants: number
    conflictsResolved: number
  }
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 10000 // Keep last 10k logs in memory
  private subscribers: Set<(log: LogEntry) => void> = new Set()
  private statsSubscribers: Set<(stats: LogStatistics) => void> = new Set()
  
  // Performance tracking
  private performanceMetrics: Map<string, number[]> = new Map()
  private redisMetrics = { hits: 0, misses: 0 }
  private collaborationMetrics = { 
    activeRooms: new Set<string>(), 
    participants: new Set<string>(),
    conflicts: 0 
  }

  private log(level: LogLevel, category: LogCategory, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      level,
      category,
      message,
      metadata,
      correlationId: metadata?.correlationId,
      userId: metadata?.userId,
      roomId: metadata?.roomId,
      duration: metadata?.duration,
      error: metadata?.error
    }

    // Add to logs array
    this.logs.push(entry)
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Update metrics
    this.updateMetrics(entry)

    // Notify subscribers
    this.subscribers.forEach(callback => callback(entry))
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 'log'
      console[consoleMethod](`[${category.toUpperCase()}] ${message}`, metadata || '')
    }
  }

  private updateMetrics(entry: LogEntry) {
    // Update performance metrics
    if (entry.duration && entry.metadata?.operation) {
      const operation = entry.metadata.operation
      if (!this.performanceMetrics.has(operation)) {
        this.performanceMetrics.set(operation, [])
      }
      this.performanceMetrics.get(operation)!.push(entry.duration)
      
      // Keep only last 100 measurements per operation
      const measurements = this.performanceMetrics.get(operation)!
      if (measurements.length > 100) {
        this.performanceMetrics.set(operation, measurements.slice(-100))
      }
    }

    // Update Redis metrics
    if (entry.category === LogCategory.REDIS) {
      if (entry.metadata?.cacheHit === true) this.redisMetrics.hits++
      if (entry.metadata?.cacheHit === false) this.redisMetrics.misses++
    }

    // Update collaboration metrics
    if (entry.category === LogCategory.COLLABORATION) {
      if (entry.roomId) this.collaborationMetrics.activeRooms.add(entry.roomId)
      if (entry.userId) this.collaborationMetrics.participants.add(entry.userId)
      if (entry.metadata?.conflict) this.collaborationMetrics.conflicts++
    }

    // Notify stats subscribers
    this.notifyStatsSubscribers()
  }

  private notifyStatsSubscribers() {
    const stats = this.getStatistics()
    this.statsSubscribers.forEach(callback => callback(stats))
  }

  // Public logging methods
  error(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, category, message, metadata)
  }

  warn(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, category, message, metadata)
  }

  info(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, category, message, metadata)
  }

  debug(category: LogCategory, message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, category, message, metadata)
  }

  // Performance tracking helpers
  startTimer(operation: string): () => void {
    const startTime = performance.now()
    return () => {
      const duration = performance.now() - startTime
      this.info(LogCategory.PERFORMANCE, `Operation completed: ${operation}`, {
        operation,
        duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
      })
    }
  }

  // Redis operation helpers
  logRedisOperation(operation: string, key: string, hit: boolean, duration?: number) {
    this.info(LogCategory.REDIS, `Redis ${operation}: ${key}`, {
      operation,
      key,
      cacheHit: hit,
      duration
    })
  }

  // Database operation helpers
  logDatabaseOperation(operation: string, table: string, recordCount?: number, duration?: number) {
    this.info(LogCategory.DATABASE, `Database ${operation}: ${table}`, {
      operation,
      table,
      recordCount,
      duration
    })
  }

  // WebSocket operation helpers
  logWebSocketEvent(event: string, userId?: string, roomId?: string, metadata?: Record<string, any>) {
    this.info(LogCategory.WEBSOCKET, `WebSocket ${event}`, {
      event,
      userId,
      roomId,
      ...metadata
    })
  }

  // Collaboration helpers
  logCollaborationEvent(event: string, userId: string, roomId: string, metadata?: Record<string, any>) {
    this.info(LogCategory.COLLABORATION, `Collaboration ${event}`, {
      event,
      userId,
      roomId,
      ...metadata
    })
  }

  // Get logs with filtering
  getLogs(filters?: {
    level?: LogLevel
    category?: LogCategory
    userId?: string
    roomId?: string
    startTime?: Date
    endTime?: Date
    limit?: number
  }): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level)
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category)
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
      }
      if (filters.roomId) {
        filteredLogs = filteredLogs.filter(log => log.roomId === filters.roomId)
      }
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!)
      }
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!)
      }
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Apply limit
    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit)
    }

    return filteredLogs
  }

  // Get statistics
  getStatistics(): LogStatistics {
    const logsByLevel = Object.values(LogLevel).reduce((acc, level) => {
      acc[level] = this.logs.filter(log => log.level === level).length
      return acc
    }, {} as Record<LogLevel, number>)

    const logsByCategory = Object.values(LogCategory).reduce((acc, category) => {
      acc[category] = this.logs.filter(log => log.category === category).length
      return acc
    }, {} as Record<LogCategory, number>)

    const recentErrors = this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-10)
      .reverse()

    // Calculate average response time
    const allDurations = Array.from(this.performanceMetrics.values()).flat()
    const averageResponseTime = allDurations.length > 0 
      ? allDurations.reduce((sum, duration) => sum + duration, 0) / allDurations.length 
      : 0

    // Get slowest operations
    const slowestOperations = Array.from(this.performanceMetrics.entries())
      .map(([operation, durations]) => ({
        operation,
        duration: Math.max(...durations),
        timestamp: new Date() // This could be improved to track actual timestamps
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)

    const totalRedisOps = this.redisMetrics.hits + this.redisMetrics.misses
    const hitRate = totalRedisOps > 0 ? (this.redisMetrics.hits / totalRedisOps) * 100 : 0

    return {
      totalLogs: this.logs.length,
      logsByLevel,
      logsByCategory,
      recentErrors,
      performanceMetrics: {
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        slowestOperations
      },
      redisMetrics: {
        cacheHits: this.redisMetrics.hits,
        cacheMisses: this.redisMetrics.misses,
        hitRate: Math.round(hitRate * 100) / 100
      },
      collaborationMetrics: {
        activeRooms: this.collaborationMetrics.activeRooms.size,
        totalParticipants: this.collaborationMetrics.participants.size,
        conflictsResolved: this.collaborationMetrics.conflicts
      }
    }
  }

  // Subscribe to real-time logs
  subscribe(callback: (log: LogEntry) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Subscribe to statistics updates
  subscribeToStats(callback: (stats: LogStatistics) => void): () => void {
    this.statsSubscribers.add(callback)
    return () => this.statsSubscribers.delete(callback)
  }

  // Clear logs
  clearLogs() {
    this.logs = []
    this.performanceMetrics.clear()
    this.redisMetrics = { hits: 0, misses: 0 }
    this.collaborationMetrics = { 
      activeRooms: new Set(), 
      participants: new Set(),
      conflicts: 0 
    }
    this.notifyStatsSubscribers()
  }
}

// Export singleton instance
export const logger = new Logger()
