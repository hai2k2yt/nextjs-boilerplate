'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, isToday, isFuture, isPast } from 'date-fns'
import { Calendar, CheckCircle, AlertCircle, TrendingUp, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useMyEvents } from '@/hooks/use-calendar'

export function CalendarStats() {
  const currentDate = new Date()
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const { events, isLoading } = useMyEvents({
    startDate: monthStart,
    endDate: monthEnd,
  })

  const stats = useMemo(() => {
    if (!events) return null

    const totalEvents = events.length
    const todayEvents = events.filter(event => isToday(new Date(event.startTime)))
    const upcomingEvents = events.filter(event => isFuture(new Date(event.startTime)))
    const pastEvents = events.filter(event => isPast(new Date(event.endTime)))


    // Event type distribution
    const eventTypes = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEvents,
      todayEvents: todayEvents.length,
      upcomingEvents: upcomingEvents.length,
      pastEvents: pastEvents.length,
      eventTypes,
    }
  }, [events])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Calendar className="mr-2 h-5 w-5" />
            Calendar Overview
          </CardTitle>
          <CardDescription className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading statistics...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      APPOINTMENT: 'bg-blue-500',
      MEETING: 'bg-green-500',
      TASK: 'bg-yellow-500',
      REMINDER: 'bg-purple-500',
      AVAILABILITY: 'bg-cyan-500',
      BLOCKED: 'bg-red-500',
    }
    return colors[eventType as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Calendar Overview
          </CardTitle>
          <CardDescription>
            {format(currentDate, 'MMMM yyyy')} statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalEvents}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.todayEvents}</div>
              <div className="text-sm text-muted-foreground">Today</div>
            </div>
          </div>

          {/* Upcoming vs Past */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Upcoming Events</span>
              <span>{stats.upcomingEvents}</span>
            </div>
            <Progress 
              value={stats.totalEvents > 0 ? (stats.upcomingEvents / stats.totalEvents) * 100 : 0} 
              className="h-2"
            />
          </div>


        </CardContent>
      </Card>

      {/* Event Types Distribution */}
      {Object.keys(stats.eventTypes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Event Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.eventTypes)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full ${getEventTypeColor(type)}`}
                      />
                      <span className="text-sm capitalize">
                        {type.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getEventTypeColor(type)}`}
                          style={{ 
                            width: `${(count / stats.totalEvents) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.todayEvents > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>You have {stats.todayEvents} event{stats.todayEvents > 1 ? 's' : ''} today</span>
            </div>
          )}
          
          {stats.upcomingEvents === 0 && stats.totalEvents > 0 && (
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>No upcoming events scheduled</span>
            </div>
          )}



          {stats.totalEvents === 0 && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>No events this month. Create your first event!</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
