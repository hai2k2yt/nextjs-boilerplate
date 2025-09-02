// Initialize logging system
import { logger, LogCategory, LogLevel } from '@/lib/logger'

// Initialize the logger with some startup logs
export function initializeLogger() {
  logger.info(LogCategory.SYSTEM, 'Logging system initialized', {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  })

  // Log system startup
  logger.info(LogCategory.SYSTEM, 'Application starting up', {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  })

  return logger
}

// Export the initialized logger
export { logger }
export { LogCategory, LogLevel }
export type { LogEntry, LogStatistics } from '@/lib/logger'
