import { z } from 'zod'

// Event Type Enum
export const eventTypeSchema = z.enum([
  'APPOINTMENT',
  'MEETING', 
  'TASK',
  'REMINDER',
  'AVAILABILITY',
  'BLOCKED'
])



// Base Event Schema (without refinement)
const baseEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().max(200, 'Location too long').optional(),
  eventType: eventTypeSchema.default('APPOINTMENT'),
  isAllDay: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(), // RRULE format

  isPublic: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  metadata: z.record(z.any()).optional(),
})

// Event Schema with validation
export const eventSchema = baseEventSchema.refine(
  (data) => data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

// Create Event Schema
export const createEventSchema = baseEventSchema.omit({ id: true }).refine(
  (data) => data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

// Update Event Schema
export const updateEventSchema = baseEventSchema.partial().extend({
  id: z.string().min(1, 'Event ID is required')
}).refine(
  (data) => !data.startTime || !data.endTime || data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
)

// Event Query Schema
export const eventQuerySchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  eventType: eventTypeSchema.optional(),
  isBookable: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  ownerId: z.string().optional(),
})



// Calendar View Schema
export const calendarViewSchema = z.object({
  view: z.enum(['dayGridMonth', 'timeGridWeek', 'timeGridDay', 'listWeek']).default('dayGridMonth'),
  date: z.date().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})



// FullCalendar Event Format Schema (for frontend)
export const fullCalendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(), // ISO string
  end: z.string(), // ISO string
  allDay: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  classNames: z.array(z.string()).optional(),
  extendedProps: z.record(z.any()).optional(),
})

// Event ID Schema
export const eventIdSchema = z.object({
  id: z.string().min(1, 'Event ID is required')
})



// Date Range Schema
export const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
)



// Export types
export type Event = z.infer<typeof eventSchema>
export type CreateEvent = z.infer<typeof createEventSchema>
export type UpdateEvent = z.infer<typeof updateEventSchema>
export type EventQuery = z.infer<typeof eventQuerySchema>
export type CalendarView = z.infer<typeof calendarViewSchema>
export type FullCalendarEvent = z.infer<typeof fullCalendarEventSchema>
export type EventType = z.infer<typeof eventTypeSchema>
export type DateRange = z.infer<typeof dateRangeSchema>

