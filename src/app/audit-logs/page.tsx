'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Filter } from 'lucide-react'

export default function AuditLogsPage() {
  const [roomId, setRoomId] = useState('')
  const [category, setCategory] = useState<string>('')
  const [limit, setLimit] = useState(100)

  const { data: auditLogs, isLoading, refetch } = trpc.logs.getAuditLogs.useQuery({
    limit,
    ...(category && category !== 'all' && { category }),
    ...(roomId && { roomId }),
  })

  const { data: flowLogs, isLoading: flowLogsLoading } = trpc.logs.getFlowActionLogs.useQuery({
    limit: 50,
    ...(roomId && { roomId }),
  })

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'destructive'
      case 'warn': return 'secondary'
      case 'info': return 'default'
      case 'debug': return 'outline'
      default: return 'default'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'collaboration': return 'bg-blue-100 text-blue-800'
      case 'database': return 'bg-green-100 text-green-800'
      case 'websocket': return 'bg-purple-100 text-purple-800'
      case 'redis': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">View React Flow actions and system events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isLoading} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Room ID</label>
            <Input
              placeholder="Enter room ID..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="collaboration">Collaboration</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="websocket">WebSocket</SelectItem>
                <SelectItem value="redis">Redis</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="text-sm font-medium mb-2 block">Limit</label>
            <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
                <SelectItem value="500">500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* React Flow Actions */}
      <Card>
        <CardHeader>
          <CardTitle>React Flow Actions</CardTitle>
          <CardDescription>Recent collaborative flow actions</CardDescription>
        </CardHeader>
        <CardContent>
          {flowLogsLoading ? (
            <div className="text-center py-8">Loading flow actions...</div>
          ) : flowLogs && flowLogs.length > 0 ? (
            <div className="space-y-3">
              {flowLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelColor(log.level) as any}>{log.level}</Badge>
                      <Badge className={getCategoryColor(log.category)}>{log.category}</Badge>
                      {log.roomId && <Badge variant="outline">Room: {log.roomId.slice(-8)}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.metadata && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View details
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No React Flow actions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>All Audit Logs</CardTitle>
          <CardDescription>Complete system audit trail</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelColor(log.level) as any}>{log.level}</Badge>
                      <Badge className={getCategoryColor(log.category)}>{log.category}</Badge>
                      {log.roomId && <Badge variant="outline">Room: {log.roomId.slice(-8)}</Badge>}
                      {log.userId && <Badge variant="outline">User: {log.userId.slice(-8)}</Badge>}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.metadata && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View metadata
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                  {log.error && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-red-600 hover:text-red-800">
                        View error details
                      </summary>
                      <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto text-red-800">
                        {JSON.stringify(log.error, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
