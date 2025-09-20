import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import type { Event, FullCalendarEvent, EventType } from '@/lib/validations/calendar'

// Color mapping for different event types
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  APPOINTMENT: '#3b82f6', // blue
  MEETING: '#10b981', // emerald
  TASK: '#f59e0b', // amber
  REMINDER: '#8b5cf6', // violet
  AVAILABILITY: '#06b6d4', // cyan
  BLOCKED: '#ef4444', // red
}

// Default colors for events
export const DEFAULT_EVENT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444',
  '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#f43f5e'
]

/**
 * Convert database event to FullCalendar event format
 */
export function convertToFullCalendarEvent(event: Event & {
  ownerId?: string
}): FullCalendarEvent {
  const color = event.color || EVENT_TYPE_COLORS[event.eventType] || DEFAULT_EVENT_COLORS[0]
  
  return {
    id: event.id!,
    title: event.title,
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
    allDay: event.isAllDay,
    backgroundColor: color,
    borderColor: color,
    textColor: getContrastColor(color),
    classNames: [
      `event-type-${event.eventType.toLowerCase()}`,
      event.isPublic ? 'public-event' : 'private-event',
    ].filter(Boolean),
    extendedProps: {
      description: event.description,
      location: event.location,
      eventType: event.eventType,
      isPublic: event.isPublic,
      isRecurring: event.isRecurring,
      metadata: event.metadata,
      ownerId: event.ownerId,
    },
  }
}

/**
 * Get contrast color (black or white) for a given background color
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const color = hexColor.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.5 ? '#000000' : '#ffffff'
}





/**
 * Format event duration
 */
export function formatEventDuration(startTime: Date, endTime: Date): string {
  const diffMs = endTime.getTime() - startTime.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const remainingMinutes = diffMinutes % 60
  
  if (diffHours === 0) {
    return `${diffMinutes}m`
  } else if (remainingMinutes === 0) {
    return `${diffHours}h`
  } else {
    return `${diffHours}h ${remainingMinutes}m`
  }
}

/**
 * Get calendar view date range
 */
export function getCalendarViewRange(date: Date, view: string): { start: Date; end: Date } {
  switch (view) {
    case 'dayGridMonth':
      return {
        start: startOfWeek(startOfMonth(date)),
        end: endOfWeek(endOfMonth(date)),
      }
    case 'timeGridWeek':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      }
    case 'timeGridDay':
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
      }
    case 'listWeek':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      }
    case 'listMonth':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      }
  }
}



/**
 * Generate a random color from the default palette
 */
export function getRandomEventColor(): string {
  return DEFAULT_EVENT_COLORS[Math.floor(Math.random() * DEFAULT_EVENT_COLORS.length)]
}



/**
 * Check if user can edit event
 */
export function canEditEvent(event: Event & { ownerId?: string }, userId?: string): boolean {
  return event.ownerId === userId
}


