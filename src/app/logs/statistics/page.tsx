'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Server,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { trpc } from '@/lib/trpc'
import { LogLevel } from '@/lib/logger-init'
import { formatDistanceToNow } from 'date-fns'

export default function LogStatisticsPage() {
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch statistics
  const { data: stats } = trpc.logs.getStatistics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Fetch performance metrics
  const { data: performanceMetrics } = trpc.logs.getPerformanceMetrics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Fetch Redis metrics
  const { data: redisMetrics } = trpc.logs.getRedisMetrics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Fetch collaboration metrics
  const { data: collaborationMetrics } = trpc.logs.getCollaborationMetrics.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  // Fetch recent errors
  const { data: recentErrors = [] } = trpc.logs.getRecentLogs.useQuery({
    level: LogLevel.ERROR,
    limit: 10,
  }, {
    refetchInterval: autoRefresh ? 5000 : false,
  })

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2 text-lg">Loading statistics...</span>
        </div>
      </div>
    )
  }

  const errorRate = stats.totalLogs > 0 ? (stats.logsByLevel.error / stats.totalLogs) * 100 : 0
  const warningRate = stats.totalLogs > 0 ? (stats.logsByLevel.warn / stats.totalLogs) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Log Statistics</h1>
            <p className="text-muted-foreground mt-2">
              System performance metrics and analytics
            </p>
          </div>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="redis">Redis Cache</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="errors">Error Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  {errorRate < 1 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : errorRate < 5 ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {errorRate < 1 ? 'Healthy' : errorRate < 5 ? 'Warning' : 'Critical'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {errorRate.toFixed(2)}% error rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.logsByLevel.info} info, {stats.logsByLevel.debug} debug
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
                  <Progress value={stats.redisMetrics.hitRate} className="mt-2" />
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
            </div>

            {/* Log Categories Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Log Categories</CardTitle>
                <CardDescription>Distribution of logs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.logsByCategory).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {category.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {performanceMetrics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time Metrics</CardTitle>
                    <CardDescription>Average response times across operations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">
                      {performanceMetrics.averageResponseTime}ms
                      <span className="text-sm font-normal text-muted-foreground ml-2">average</span>
                    </div>
                    <div className="space-y-2">
                      {performanceMetrics.averageResponseTime < 100 && (
                        <Badge variant="default" className="bg-green-100 text-green-800">Excellent</Badge>
                      )}
                      {performanceMetrics.averageResponseTime >= 100 && performanceMetrics.averageResponseTime < 500 && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">Good</Badge>
                      )}
                      {performanceMetrics.averageResponseTime >= 500 && (
                        <Badge variant="destructive">Needs Attention</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Slowest Operations</CardTitle>
                    <CardDescription>Operations that took the longest to complete</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {performanceMetrics.slowestOperations.map((op, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{op.operation}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(op.timestamp), { addSuffix: true })}
                              </div>
                            </div>
                            <Badge variant="outline">{op.duration}ms</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="redis" className="space-y-6">
            {redisMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cache Hit Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{redisMetrics.hitRate}%</div>
                    <Progress value={redisMetrics.hitRate} className="mt-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {redisMetrics.hitRate > 80 ? 'Excellent' : redisMetrics.hitRate > 60 ? 'Good' : 'Needs Improvement'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cache Hits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{redisMetrics.cacheHits}</div>
                    <p className="text-sm text-muted-foreground">Successful cache retrievals</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cache Misses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{redisMetrics.cacheMisses}</div>
                    <p className="text-sm text-muted-foreground">Failed cache retrievals</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collaboration" className="space-y-6">
            {collaborationMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Rooms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{collaborationMetrics.activeRooms}</div>
                    <p className="text-sm text-muted-foreground">Currently active collaboration rooms</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Participants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{collaborationMetrics.totalParticipants}</div>
                    <p className="text-sm text-muted-foreground">Users currently collaborating</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conflicts Resolved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{collaborationMetrics.conflictsResolved}</div>
                    <p className="text-sm text-muted-foreground">Collaboration conflicts handled</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Rate Trend</CardTitle>
                  <CardDescription>Current error and warning rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Error Rate</span>
                        <span>{errorRate.toFixed(2)}%</span>
                      </div>
                      <Progress value={errorRate} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Warning Rate</span>
                        <span>{warningRate.toFixed(2)}%</span>
                      </div>
                      <Progress value={warningRate} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Errors</CardTitle>
                  <CardDescription>Latest error events</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {recentErrors.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          No recent errors
                        </div>
                      ) : (
                        recentErrors.map((error) => (
                          <div key={error.id} className="p-2 border border-red-200 rounded bg-red-50">
                            <div className="font-medium text-red-800">{error.message}</div>
                            <div className="text-xs text-red-600 mt-1">
                              {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                              {error.roomId && ` • Room: ${error.roomId}`}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
