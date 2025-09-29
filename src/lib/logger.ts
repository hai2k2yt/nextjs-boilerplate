/**
 * Simple logger utility for the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry = this.formatMessage(level, message, data)
    
    if (this.isDevelopment) {
      // In development, use console for immediate feedback
      switch (level) {
        case 'error':
          console.error(`[${entry.timestamp}] ERROR: ${message}`, data || '')
          break
        case 'warn':
          console.warn(`[${entry.timestamp}] WARN: ${message}`, data || '')
          break
        case 'info':
          console.info(`[${entry.timestamp}] INFO: ${message}`, data || '')
          break
        case 'debug':
          console.debug(`[${entry.timestamp}] DEBUG: ${message}`, data || '')
          break
      }
    } else {
      // In production, you might want to send logs to a service
      // For now, we'll suppress console output in production
      // TODO: Integrate with logging service (e.g., Winston, Pino, or cloud logging)
    }
  }

  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()
