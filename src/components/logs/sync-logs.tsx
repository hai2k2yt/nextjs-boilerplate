'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  RefreshCw,
  AlertTriangle, 
  Info, 
  AlertCircle, 
  Bug,
  ScrollText
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import { formatDistanceToNow } from 'date-fns'

// Define log enums locally
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

// LogEntry interface removed - using database AuditLog type instead

interface SyncLogsProps {
  maxLogs?: number
  filters?: {
    level?: LogLevel
    category?: LogCategory
    userId?: string
    roomId?: string
  }
}

export function SyncLogs({ maxLogs = 30, filters }: SyncLogsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch logs from database
  const { data: logs, refetch, isLoading, isFetching } = trpc.logs.getLogs.useQuery({
    level: filters?.level as any,
    category: filters?.category as any,
    userId: filters?.userId,
    roomId: filters?.roomId,
    limit: maxLogs,
  }, {
    refetchInterval: false, // No auto-refresh, only manual sync
  })

  const handleSync = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case LogLevel.WARN:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-blue-500" />
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-gray-500" />
      default:
        return <ScrollText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: LogCategory) => {
    switch (category) {
      case LogCategory.WEBSOCKET:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case LogCategory.DATABASE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case LogCategory.REDIS:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case LogCategory.COLLABORATION:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case LogCategory.PERFORMANCE:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case LogCategory.SECURITY:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case LogCategory.SYSTEM:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const LogEntrySkeleton = () => (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle className="text-lg">
              Latest Logs {logs?.length || 0} / {maxLogs}
              {isFetching && !isRefreshing && (
                <span className="ml-2 text-sm text-muted-foreground">Updating...</span>
              )}
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isRefreshing || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || isFetching) ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Syncing...' : isFetching ? 'Loading...' : 'Sync'}
          </Button>
        </div>
        <CardDescription>
          Click sync to load the latest logs from database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <LogEntrySkeleton key={index} />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <ScrollText className="h-8 w-8 mr-2" />
              <span>No logs found. Click sync to load latest logs.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={getCategoryColor(log.category)}>
                          {log.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        {log.message}
                      </p>
                      {(log.userId || log.roomId) && (
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {log.userId && (
                            <span>User: {log.userId.slice(0, 8)}...</span>
                          )}
                          {log.roomId && (
                            <span>Room: {log.roomId.slice(-8)}</span>
                          )}
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Category-specific components for different tabs
export function WebSocketLogs() {
  return <SyncLogs filters={{ category: LogCategory.WEBSOCKET }} />
}

export function DatabaseLogs() {
  return <SyncLogs filters={{ category: LogCategory.DATABASE }} />
}

export function RedisLogs() {
  return <SyncLogs filters={{ category: LogCategory.REDIS }} />
}

export function ErrorLogs() {
  return <SyncLogs filters={{ level: LogLevel.ERROR }} />
}

export function CollaborationLogs() {
  return <SyncLogs filters={{ category: LogCategory.COLLABORATION }} />
}

export function PerformanceLogs() {
  return <SyncLogs filters={{ category: LogCategory.PERFORMANCE }} />
}
