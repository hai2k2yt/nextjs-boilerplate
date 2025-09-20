'use client'

import { useState } from 'react'
import { Filter, X, Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

import { EVENT_TYPE_COLORS } from '@/lib/utils/calendar'
import type { EventType } from '@/lib/validations/calendar'

interface CalendarFiltersProps {
  onFiltersChange?: (filters: CalendarFilterState) => void
}

export interface CalendarFilterState {
  eventTypes: EventType[]
  showMyEvents: boolean
  showOtherEvents: boolean
}

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'APPOINTMENT', label: 'Appointments', color: EVENT_TYPE_COLORS.APPOINTMENT },
  { value: 'MEETING', label: 'Meetings', color: EVENT_TYPE_COLORS.MEETING },
  { value: 'TASK', label: 'Tasks', color: EVENT_TYPE_COLORS.TASK },
  { value: 'REMINDER', label: 'Reminders', color: EVENT_TYPE_COLORS.REMINDER },
  { value: 'AVAILABILITY', label: 'Availability', color: EVENT_TYPE_COLORS.AVAILABILITY },
  { value: 'BLOCKED', label: 'Blocked', color: EVENT_TYPE_COLORS.BLOCKED },
]

export function CalendarFilters({ onFiltersChange }: CalendarFiltersProps) {
  const [filters, setFilters] = useState<CalendarFilterState>({
    eventTypes: [],
    showMyEvents: true,
    showOtherEvents: true,
  })

  const updateFilters = (newFilters: Partial<CalendarFilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange?.(updatedFilters)
  }

  const toggleEventType = (eventType: EventType) => {
    const newEventTypes = filters.eventTypes.includes(eventType)
      ? filters.eventTypes.filter(type => type !== eventType)
      : [...filters.eventTypes, eventType]
    
    updateFilters({ eventTypes: newEventTypes })
  }

  const clearAllFilters = () => {
    const clearedFilters: CalendarFilterState = {
      eventTypes: [],
      showMyEvents: true,
      showOtherEvents: true,
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  const hasActiveFilters =
    filters.eventTypes.length > 0 ||
    !filters.showMyEvents ||
    !filters.showOtherEvents

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <CardDescription>
          Filter events by type, visibility, and ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Event Types</Label>
          <div className="space-y-2">
            {eventTypes.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <button
                  onClick={() => toggleEventType(type.value)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    filters.eventTypes.includes(type.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: type.color }}
                  />
                  <span>{type.label}</span>
                </button>
              </div>
            ))}
          </div>
          {filters.eventTypes.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Showing {filters.eventTypes.length} of {eventTypes.length} event types
            </div>
          )}
        </div>



        <Separator />

        {/* Ownership */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Ownership</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="my-events-filter" className="text-sm">
                  My events
                </Label>
              </div>
              <Switch
                id="my-events-filter"
                checked={filters.showMyEvents}
                onCheckedChange={(checked) => 
                  updateFilters({ showMyEvents: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="other-events-filter" className="text-sm">
                  Other events
                </Label>
              </div>
              <Switch
                id="other-events-filter"
                checked={filters.showOtherEvents}
                onCheckedChange={(checked) => 
                  updateFilters({ showOtherEvents: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-1">
                {filters.eventTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type.toLowerCase()}
                    <button
                      onClick={() => toggleEventType(type)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                

                
                {!filters.showMyEvents && (
                  <Badge variant="secondary" className="text-xs">
                    Hide my events
                    <button
                      onClick={() => updateFilters({ showMyEvents: true })}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {!filters.showOtherEvents && (
                  <Badge variant="secondary" className="text-xs">
                    Hide other events
                    <button
                      onClick={() => updateFilters({ showOtherEvents: true })}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
