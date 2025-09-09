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
import { Skeleton } from '@/components/ui/skeleton'
import { StatisticsCardSkeleton, AnalysisCardSkeleton, PerformanceCardSkeleton } from '@/components/skeletons'
import { trpc } from '@/lib/trpc'
import { SyncLogs, WebSocketLogs, DatabaseLogs, RedisLogs, ErrorLogs, CollaborationLogs, PerformanceLogs } from '@/components/logs/sync-logs'


export default function LogDashboardPage() {
  // Fetch statistics for overview cards
  const { data: stats, isLoading, isFetching } = trpc.logs.getStatistics.useQuery(undefined, {
    refetchInterval: 5000,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatisticsCardSkeleton key={i} />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="h-64">
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const errorRate = stats && stats.totalLogs > 0 ? (stats.logsByLevel.ERROR / stats.totalLogs) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Log Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Real-time monitoring and system insights
            </p>
          </div>
          {isFetching && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="h-4 w-4 mr-1 animate-spin" />
              Updating...
            </div>
          )}
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
              <div className="text-2xl font-bold">{stats?.redisMetrics.hitRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.redisMetrics.cacheHits || 0} hits today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.collaborationMetrics.totalParticipants || 0}</div>
              <p className="text-xs text-muted-foreground">
                in {stats?.collaborationMetrics.activeRooms || 0} rooms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.performanceMetrics.averageResponseTime || 0}ms</div>
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
              <SyncLogs maxLogs={30} />
              <Card>
                <CardHeader>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>Key metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Events</span>
                      <span className="text-2xl font-bold">{stats?.totalLogs.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Events</span>
                      <span className="text-lg font-semibold text-red-600">{stats?.logsByLevel.ERROR || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Warning Events</span>
                      <span className="text-lg font-semibold text-yellow-600">{stats?.logsByLevel.WARN || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Info Events</span>
                      <span className="text-lg font-semibold text-blue-600">{stats?.logsByLevel.INFO || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Debug Events</span>
                      <span className="text-lg font-semibold text-gray-600">{stats?.logsByLevel.DEBUG || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="errors">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ErrorLogs />
              {isLoading ? (
                <AnalysisCardSkeleton />
              ) : (
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
                      {/* Recent errors feature not yet implemented */}
                      <div className="text-sm text-gray-500 italic">
                        Recent error tracking coming soon...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="websocket">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WebSocketLogs />
              {isLoading ? (
                <PerformanceCardSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>WebSocket Activity</CardTitle>
                    <CardDescription>Real-time connection monitoring</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">WebSocket Events</span>
                        <span className="text-2xl font-bold">{stats?.logsByCategory.websocket || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Connections</span>
                        <span className="text-lg font-semibold text-green-600">{stats?.collaborationMetrics.totalParticipants || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Rooms</span>
                        <span className="text-lg font-semibold text-blue-600">{stats?.collaborationMetrics.activeRooms || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="database">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DatabaseLogs />
              {isLoading ? (
                <PerformanceCardSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Database Performance</CardTitle>
                    <CardDescription>Query performance and operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database Operations</span>
                        <span className="text-2xl font-bold">{stats?.logsByCategory.database || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Avg Query Time</span>
                        <span className="text-lg font-semibold">{stats?.performanceMetrics.averageResponseTime || 0}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conflicts Resolved</span>
                        <span className="text-lg font-semibold text-orange-600">{stats?.collaborationMetrics.conflictsResolved || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="redis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RedisLogs />
              {isLoading ? (
                <PerformanceCardSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Redis Cache Metrics</CardTitle>
                    <CardDescription>Cache performance and hit rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cache Hit Rate</span>
                        <span className="text-2xl font-bold text-green-600">{stats?.redisMetrics.hitRate || 0}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cache Hits</span>
                        <span className="text-lg font-semibold text-green-600">{stats?.redisMetrics.cacheHits || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cache Misses</span>
                        <span className="text-lg font-semibold text-red-600">{stats?.redisMetrics.cacheMisses || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Redis Operations</span>
                        <span className="text-lg font-semibold">{stats?.logsByCategory.redis || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="collaboration">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CollaborationLogs />
              {isLoading ? (
                <PerformanceCardSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Collaboration Metrics</CardTitle>
                    <CardDescription>User activity and collaboration stats</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Collaboration Events</span>
                        <span className="text-2xl font-bold">{stats?.logsByCategory.collaboration || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Participants</span>
                        <span className="text-lg font-semibold text-blue-600">{stats?.collaborationMetrics.totalParticipants || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Rooms</span>
                        <span className="text-lg font-semibold text-purple-600">{stats?.collaborationMetrics.activeRooms || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Conflicts Resolved</span>
                        <span className="text-lg font-semibold text-orange-600">{stats?.collaborationMetrics.conflictsResolved || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceLogs />
              {isLoading ? (
                <PerformanceCardSkeleton />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>System performance overview and slow operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Average Response Time</span>
                        <span className="text-2xl font-bold">{stats?.performanceMetrics.averageResponseTime || 0}ms</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Performance Events</span>
                        <span className="text-lg font-semibold">{stats?.logsByCategory.performance || 0}</span>
                      </div>
                      {/* Performance tracking feature not yet implemented */}
                      <div className="text-sm text-gray-500 italic">
                        Performance operation tracking coming soon...
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
