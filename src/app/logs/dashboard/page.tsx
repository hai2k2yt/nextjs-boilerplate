'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  Server,
  Users,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc'
import { RealTimeLogs, WebSocketLogs, DatabaseLogs, RedisLogs, ErrorLogs, CollaborationLogs } from '@/components/logs/real-time-logs'


export default function LogDashboardPage() {
  // Fetch statistics for overview cards
  const { data: stats } = trpc.logs.getStatistics.useQuery(undefined, {
    refetchInterval: 5000,
  })

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Activity className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  const errorRate = stats.totalLogs > 0 ? (stats.logsByLevel.error / stats.totalLogs) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Log Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring and system insights
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {errorRate < 1 ? (
                <Activity className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {errorRate < 1 ? 'Healthy' : 'Issues'}
              </div>
              <p className="text-xs text-muted-foreground">
                {errorRate.toFixed(2)}% error rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cache Performance</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.redisMetrics.hitRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.redisMetrics.cacheHits} hits today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.collaborationMetrics.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                in {stats.collaborationMetrics.activeRooms} rooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.performanceMetrics.averageResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                average response time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Log Streams */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="websocket">WebSocket</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="redis">Redis</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealTimeLogs maxLogs={30} />
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Key metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Events</span>
                      <span className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Events</span>
                      <span className="text-lg font-semibold text-red-600">{stats.logsByLevel.error}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Warning Events</span>
                      <span className="text-lg font-semibold text-yellow-600">{stats.logsByLevel.warn}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Info Events</span>
                      <span className="text-lg font-semibold text-blue-600">{stats.logsByLevel.info}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Debug Events</span>
                      <span className="text-lg font-semibold text-gray-600">{stats.logsByLevel.debug}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorLogs />
              <Card>
                <CardHeader>
                  <CardTitle>Error Analysis</CardTitle>
                  <CardDescription>Recent error patterns and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Error Rate</span>
                        <span className={`font-bold ${errorRate < 1 ? 'text-green-600' : errorRate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {errorRate.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {errorRate < 1 ? 'System is healthy' : errorRate < 5 ? 'Minor issues detected' : 'Critical issues require attention'}
                      </div>
                    </div>
                    {stats.recentErrors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Recent Error Categories</h4>
                        <div className="space-y-2">
                          {stats.recentErrors.slice(0, 3).map((error, index) => (
                            <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                              <div className="font-medium text-red-800">{error.category}</div>
                              <div className="text-red-600 truncate">{error.message}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="websocket">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WebSocketLogs />
              <Card>
                <CardHeader>
                  <CardTitle>WebSocket Activity</CardTitle>
                  <CardDescription>Real-time connection monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">WebSocket Events</span>
                      <span className="text-2xl font-bold">{stats.logsByCategory.websocket || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Connections</span>
                      <span className="text-lg font-semibold text-green-600">{stats.collaborationMetrics.totalParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Rooms</span>
                      <span className="text-lg font-semibold text-blue-600">{stats.collaborationMetrics.activeRooms}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DatabaseLogs />
              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                  <CardDescription>Query performance and operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Database Operations</span>
                      <span className="text-2xl font-bold">{stats.logsByCategory.database || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Avg Query Time</span>
                      <span className="text-lg font-semibold">{stats.performanceMetrics.averageResponseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Conflicts Resolved</span>
                      <span className="text-lg font-semibold text-orange-600">{stats.collaborationMetrics.conflictsResolved}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="redis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RedisLogs />
              <Card>
                <CardHeader>
                  <CardTitle>Redis Cache Metrics</CardTitle>
                  <CardDescription>Cache performance and hit rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cache Hit Rate</span>
                      <span className="text-2xl font-bold text-green-600">{stats.redisMetrics.hitRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cache Hits</span>
                      <span className="text-lg font-semibold text-green-600">{stats.redisMetrics.cacheHits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cache Misses</span>
                      <span className="text-lg font-semibold text-red-600">{stats.redisMetrics.cacheMisses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Redis Operations</span>
                      <span className="text-lg font-semibold">{stats.logsByCategory.redis || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="collaboration">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollaborationLogs />
              <Card>
                <CardHeader>
                  <CardTitle>Collaboration Metrics</CardTitle>
                  <CardDescription>User activity and collaboration stats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Collaboration Events</span>
                      <span className="text-2xl font-bold">{stats.logsByCategory.collaboration || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Participants</span>
                      <span className="text-lg font-semibold text-blue-600">{stats.collaborationMetrics.totalParticipants}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Rooms</span>
                      <span className="text-lg font-semibold text-purple-600">{stats.collaborationMetrics.activeRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Conflicts Resolved</span>
                      <span className="text-lg font-semibold text-orange-600">{stats.collaborationMetrics.conflictsResolved}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>System performance metrics and slow operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Response Time</span>
                      <span className="text-2xl font-bold">{stats.performanceMetrics.averageResponseTime}ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Performance Events</span>
                      <span className="text-lg font-semibold">{stats.logsByCategory.performance || 0}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Slowest Operations</h4>
                    <div className="space-y-2">
                      {stats.performanceMetrics.slowestOperations.slice(0, 3).map((op, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded">
                          <span className="text-sm font-medium">{op.operation}</span>
                          <span className="text-sm font-bold text-orange-600">{op.duration}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
