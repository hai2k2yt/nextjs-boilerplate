'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Pause, 
  Play, 
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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc'
import { LogLevel, LogCategory, type LogEntry } from '@/lib/logger-init'
import { formatDistanceToNow } from 'date-fns'

interface RealTimeLogsProps {
  maxLogs?: number
  filters?: {
    level?: LogLevel
    category?: LogCategory
    userId?: string
    roomId?: string
  }
}

export function RealTimeLogs({ maxLogs = 50, filters }: RealTimeLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fallback to polling if subscriptions are not available
  const { data: polledLogs } = trpc.logs.getLogs.useQuery({
    level: filters?.level,
    category: filters?.category,
    userId: filters?.userId,
    roomId: filters?.roomId,
    limit: maxLogs,
  }, {
    refetchInterval: isPaused ? false : 2000, // Poll every 2 seconds when not paused
  })

  // Update logs when polled data changes
  useEffect(() => {
    if (polledLogs && !isPaused) {
      setLogs(polledLogs)
    }
  }, [polledLogs, isPaused])

  // Try to subscribe to real-time logs (fallback gracefully if not supported)
  useEffect(() => {
    // This is a placeholder for real-time subscription
    // In a production environment, you would implement WebSocket subscriptions here
    const interval = setInterval(() => {
      // Trigger a refetch to simulate real-time updates
      // This will be replaced by actual WebSocket subscriptions
    }, 1000)

    return () => clearInterval(interval)
  }, [filters, isPaused])

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case LogLevel.WARN:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case LogLevel.INFO:
        return <Info className="h-4 w-4 text-blue-500" />
      case LogLevel.DEBUG:
        return <Bug className="h-4 w-4 text-gray-500" />
    }
  }

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return 'border-l-red-500 bg-red-50'
      case LogLevel.WARN:
        return 'border-l-yellow-500 bg-yellow-50'
      case LogLevel.INFO:
        return 'border-l-blue-500 bg-blue-50'
      case LogLevel.DEBUG:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getCategoryColor = (category: LogCategory) => {
    const colors = {
      [LogCategory.WEBSOCKET]: 'bg-purple-100 text-purple-800',
      [LogCategory.REDIS]: 'bg-red-100 text-red-800',
      [LogCategory.DATABASE]: 'bg-green-100 text-green-800',
      [LogCategory.COLLABORATION]: 'bg-blue-100 text-blue-800',
      [LogCategory.PERFORMANCE]: 'bg-orange-100 text-orange-800',
      [LogCategory.SECURITY]: 'bg-red-100 text-red-800',
      [LogCategory.SYSTEM]: 'bg-gray-100 text-gray-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Logs
              <Badge variant="outline" className="ml-2">
                {logs.length} / {maxLogs}
              </Badge>
            </CardTitle>
            <CardDescription>
              Live stream of system events and activities
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-scroll"
                checked={autoScroll}
                onCheckedChange={setAutoScroll}
              />
              <Label htmlFor="auto-scroll" className="text-sm">Auto-scroll</Label>
            </div>
            <Button
              variant={isPaused ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-6 pb-6" ref={scrollAreaRef}>
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <ScrollText className="h-8 w-8 mr-2" />
              Waiting for log events...
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`p-3 rounded-lg border-l-4 ${getLevelColor(log.level)} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getLevelIcon(log.level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className={getCategoryColor(log.category)}>
                              {log.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                            </span>
                            {log.duration && (
                              <Badge variant="outline" className="text-xs">
                                {log.duration}ms
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-1">{log.message}</p>
                          {(log.userId || log.roomId) && (
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                              {log.userId && <span>User: {log.userId.slice(0, 8)}...</span>}
                              {log.roomId && <span>Room: {log.roomId.slice(0, 8)}...</span>}
                            </div>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                Show details
                              </summary>
                              <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto max-w-full">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                          {log.error && (
                            <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                              <div className="font-medium text-red-800">
                                {log.error.name}: {log.error.message}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Specialized components for different log types
export function WebSocketLogs() {
  return (
    <RealTimeLogs
      maxLogs={30}
      filters={{ category: LogCategory.WEBSOCKET }}
    />
  )
}

export function DatabaseLogs() {
  return (
    <RealTimeLogs
      maxLogs={20}
      filters={{ category: LogCategory.DATABASE }}
    />
  )
}

export function RedisLogs() {
  return (
    <RealTimeLogs
      maxLogs={25}
      filters={{ category: LogCategory.REDIS }}
    />
  )
}

export function ErrorLogs() {
  return (
    <RealTimeLogs
      maxLogs={15}
      filters={{ level: LogLevel.ERROR }}
    />
  )
}

export function CollaborationLogs() {
  return (
    <RealTimeLogs
      maxLogs={25}
      filters={{ category: LogCategory.COLLABORATION }}
    />
  )
}
