// Note: This file is optional and only used when database persistence is needed
// It's disabled by default to avoid import errors during development

import { LogLevel, type LogEntry } from '@/lib/logger-init'

// Configuration for database logging
interface DatabaseLoggerConfig {
  enabled: boolean
  batchSize: number
  flushInterval: number // milliseconds
}

const DEFAULT_CONFIG: DatabaseLoggerConfig = {
  enabled: false, // Disable by default to avoid database errors during development
  batchSize: 50, // Batch insert 50 logs at a time
  flushInterval: 30000, // Flush every 30 seconds
}

class DatabaseLogger {
  private config: DatabaseLoggerConfig
  private logQueue: LogEntry[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private isShuttingDown = false

  constructor(config: Partial<DatabaseLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    if (this.config.enabled) {
      this.startBatchProcessor()
      this.subscribeToLogger()
      this.setupGracefulShutdown()
    }
  }

  private subscribeToLogger() {
    // Dynamic import to avoid circular dependencies
    import('@/lib/logger-init').then(({ logger }) => {
      logger.subscribe((logEntry) => {
        if (this.shouldPersistLog(logEntry)) {
          this.queueLog(logEntry)
        }
      })
    }).catch(() => {
      console.warn('[DatabaseLogger] Could not subscribe to logger - logger module not available')
    })
  }

  private shouldPersistLog(logEntry: LogEntry): boolean {
    return this.config.enabled && (logEntry.level === LogLevel.ERROR || logEntry.level === LogLevel.WARN || logEntry.level === LogLevel.INFO)
  }

  private queueLog(logEntry: LogEntry) {
    this.logQueue.push(logEntry)
    
    // Flush immediately if batch size is reached
    if (this.logQueue.length >= this.config.batchSize) {
      this.flushLogs()
    }
  }

  private startBatchProcessor() {
    this.flushTimer = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flushLogs()
      }
    }, this.config.flushInterval)
  }

  private async flushLogs() {
    if (this.logQueue.length === 0 || this.isShuttingDown) return

    const logsToFlush = this.logQueue.splice(0, this.config.batchSize)
    
    try {
      await this.persistLogs(logsToFlush)
      console.log(`[DatabaseLogger] Persisted ${logsToFlush.length} logs to database`)
    } catch (error) {
      console.error('[DatabaseLogger] Failed to persist logs:', error)
      
      // Re-queue logs on failure (but limit to prevent memory issues)
      if (this.logQueue.length < 1000) {
        this.logQueue.unshift(...logsToFlush)
      }
    }
  }

  private async persistLogs(logs: LogEntry[]) {
    try {
      // Dynamic import to avoid module resolution issues
      const { db } = await import('@/server/db')

      const auditLogs = logs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        category: log.category,
        message: log.message,
        metadata: log.metadata ? JSON.parse(JSON.stringify(log.metadata)) : undefined,
        correlationId: log.correlationId || undefined,
        userId: log.userId || undefined,
        roomId: log.roomId || undefined,
        duration: log.duration || undefined,
        error: log.error ? JSON.parse(JSON.stringify(log.error)) : undefined,
      }))

      await db.auditLog.createMany({
        data: auditLogs,
        skipDuplicates: true, // Skip if ID already exists
      })
    } catch (error) {
      console.error('[DatabaseLogger] Failed to persist logs - database not available:', error)
      throw error
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      console.log(`[DatabaseLogger] Received ${signal}, flushing remaining logs...`)
      this.isShuttingDown = true
      
      if (this.flushTimer) {
        clearInterval(this.flushTimer)
      }
      
      // Flush any remaining logs
      if (this.logQueue.length > 0) {
        try {
          await this.persistLogs(this.logQueue)
          console.log(`[DatabaseLogger] Flushed ${this.logQueue.length} remaining logs`)
        } catch (error) {
          console.error('[DatabaseLogger] Failed to flush remaining logs:', error)
        }
      }
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGUSR2', () => shutdown('SIGUSR2')) // Nodemon restart
  }

  // Get current queue status
  getStatus() {
    return {
      enabled: this.config.enabled,
      queueSize: this.logQueue.length,
      batchSize: this.config.batchSize,
      flushInterval: this.config.flushInterval,
      isShuttingDown: this.isShuttingDown,
    }
  }
}









// Export singleton instance (lazy initialization to avoid import errors)
let _databaseLogger: DatabaseLogger | null = null

export function getDatabaseLogger(): DatabaseLogger {
  if (!_databaseLogger) {
    _databaseLogger = new DatabaseLogger()
  }
  return _databaseLogger
}

// Export configuration for customization
export type { DatabaseLoggerConfig }
