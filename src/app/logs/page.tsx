'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Database,
  Server,
  Users,
  AlertTriangle,
  Info,
  AlertCircle,
  Bug,
  Search,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useToast } from '@/hooks/use-toast'
import { trpc } from '@/lib/trpc'
import { LogLevel, LogCategory, type LogEntry } from '@/lib/logger-init'
import { formatDistanceToNow } from 'date-fns'

export default function LogsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all')
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch logs with filters
  const { data: logs = [], refetch: refetchLogs, isLoading } = trpc.logs.getLogs.useQuery({
    level: selectedLevel === 'all' ? undefined : selectedLevel,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    limit: 500,
  }, {
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  })

  // Fetch statistics
  const { data: stats } = trpc.logs.getStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Search logs
  const { data: searchResults = [], refetch: refetchSearch } = trpc.logs.searchLogs.useQuery({
    query: searchQuery,
    filters: {
      level: selectedLevel === 'all' ? undefined : selectedLevel,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      limit: 100,
    }
  }, {
    enabled: searchQuery.length > 0,
  })

  // Clear logs mutation
  const clearLogsMutation = trpc.logs.clearLogs.useMutation({
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Logs cleared successfully',
      })
      refetchLogs()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Export logs - using query instead of mutation for now
  const handleExportLogs = async () => {
    try {
      // For now, we'll export the current logs data
      const logsToExport = {
        exportedAt: new Date().toISOString(),
        totalLogs: displayedLogs.length,
        filters: {
          level: selectedLevel === 'all' ? undefined : selectedLevel,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        },
        logs: displayedLogs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
        })),
      }

      const blob = new Blob([JSON.stringify(logsToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `logs-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Logs exported successfully',
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to export logs',
        variant: 'destructive',
      })
    }
  }

  const displayedLogs = searchQuery ? searchResults : logs

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      clearLogsMutation.mutate()
    }
  }

  // This function is now defined above as handleExportLogs

  useEffect(() => {
    if (searchQuery) {
      const debounceTimer = setTimeout(() => {
        refetchSearch()
      }, 300)
      return () => clearTimeout(debounceTimer)
    }
  }, [searchQuery, refetchSearch])

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system events, performance metrics, and troubleshoot issues
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.logsByLevel.error} errors, {stats.logsByLevel.warn} warnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.redisMetrics.hitRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.redisMetrics.cacheHits} hits, {stats.redisMetrics.cacheMisses} misses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Collaboration</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.collaborationMetrics.activeRooms}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.collaborationMetrics.totalParticipants} participants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.performanceMetrics.averageResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  {stats.collaborationMetrics.conflictsResolved} conflicts resolved
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Log Filters & Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Level Filter */}
              <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as LogLevel | 'all')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Log Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={LogLevel.ERROR}>Error</SelectItem>
                  <SelectItem value={LogLevel.WARN}>Warning</SelectItem>
                  <SelectItem value={LogLevel.INFO}>Info</SelectItem>
                  <SelectItem value={LogLevel.DEBUG}>Debug</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as LogCategory | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value={LogCategory.WEBSOCKET}>WebSocket</SelectItem>
                  <SelectItem value={LogCategory.REDIS}>Redis</SelectItem>
                  <SelectItem value={LogCategory.DATABASE}>Database</SelectItem>
                  <SelectItem value={LogCategory.COLLABORATION}>Collaboration</SelectItem>
                  <SelectItem value={LogCategory.PERFORMANCE}>Performance</SelectItem>
                  <SelectItem value={LogCategory.SECURITY}>Security</SelectItem>
                  <SelectItem value={LogCategory.SYSTEM}>System</SelectItem>
                </SelectContent>
              </Select>

              {/* Auto Refresh Toggle */}
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>

              {/* Export */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportLogs}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              {/* Clear Logs */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearLogs}
                disabled={clearLogsMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Display */}
        <Card>
          <CardHeader>
            <CardTitle>
              Recent Logs ({displayedLogs.length})
              {searchQuery && <span className="text-sm font-normal text-muted-foreground ml-2">- Search: &quot;{searchQuery}&quot;</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading logs...</span>
                </div>
              ) : displayedLogs.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  No logs found matching your criteria
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedLogs.map((log) => (
                    <LogEntryComponent key={log.id} log={log} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function LogEntryComponent({ log }: { log: LogEntry }) {
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
        return 'bg-red-100 text-red-800 border-red-200'
      case LogLevel.WARN:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case LogLevel.INFO:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case LogLevel.DEBUG:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
    <div className={`p-3 rounded-lg border ${getLevelColor(log.level)} hover:shadow-sm transition-shadow`}>
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
                {log.userId && <span>User: {log.userId}</span>}
                {log.roomId && <span>Room: {log.roomId}</span>}
              </div>
            )}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Show metadata
                </summary>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </details>
            )}
            {log.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <div className="font-medium text-red-800">{log.error.name}: {log.error.message}</div>
                {log.error.stack && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Show stack trace
                    </summary>
                    <pre className="mt-1 text-red-700 whitespace-pre-wrap">{log.error.stack}</pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
