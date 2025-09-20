import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/api/trpc'
import {
  createEventSchema,
  updateEventSchema,
  eventIdSchema,
  eventQuerySchema,
} from '@/lib/validations/calendar'

export const calendarRouter = createTRPCRouter({
  // Event CRUD Operations
  
  // Get events with filtering
  getEvents: publicProcedure
    .input(eventQuerySchema)
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.event.findMany({
        where: {
          ...(input.ownerId && { ownerId: input.ownerId }),
          ...(input.eventType && { eventType: input.eventType }),
          ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
          ...(input.startDate && input.endDate && {
            OR: [
              // Event starts within the date range
              {
                startTime: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              // Event ends within the date range
              {
                endTime: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              // Event spans the entire date range
              {
                AND: [
                  { startTime: { lte: input.startDate } },
                  { endTime: { gte: input.endDate } },
                ],
              },
            ],
          }),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      })

      return events
    }),

  // Get user's own events
  getMyEvents: protectedProcedure
    .input(eventQuerySchema.optional())
    .query(async ({ ctx, input = {} }) => {
      const events = await ctx.db.event.findMany({
        where: {
          ownerId: ctx.session.user.id,
          ...(input.eventType && { eventType: input.eventType }),
          ...(input.startDate && input.endDate && {
            OR: [
              // Event starts within the date range
              {
                startTime: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              // Event ends within the date range
              {
                endTime: {
                  gte: input.startDate,
                  lte: input.endDate,
                },
              },
              // Event spans the entire date range
              {
                AND: [
                  { startTime: { lte: input.startDate } },
                  { endTime: { gte: input.endDate } },
                ],
              },
            ],
          }),
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      })

      return events
    }),

  // Get single event by ID
  getEvent: publicProcedure
    .input(eventIdSchema)
    .query(async ({ ctx, input }) => {
      const event = await ctx.db.event.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        })
      }

      return event
    }),

  // Create new event
  createEvent: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for time conflicts with existing events
      const conflictingEvents = await ctx.db.event.findMany({
        where: {
          ownerId: ctx.session.user.id,
          OR: [
            // New event starts during existing event
            {
              AND: [
                { startTime: { lte: input.startTime } },
                { endTime: { gt: input.startTime } },
              ],
            },
            // New event ends during existing event
            {
              AND: [
                { startTime: { lt: input.endTime } },
                { endTime: { gte: input.endTime } },
              ],
            },
            // New event completely contains existing event
            {
              AND: [
                { startTime: { gte: input.startTime } },
                { endTime: { lte: input.endTime } },
              ],
            },
            // Existing event completely contains new event
            {
              AND: [
                { startTime: { lte: input.startTime } },
                { endTime: { gte: input.endTime } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
        },
      })

      if (conflictingEvents.length > 0) {
        const conflictDetails = conflictingEvents
          .map(event => `"${event.title}" (${event.startTime.toLocaleString()} - ${event.endTime.toLocaleString()})`)
          .join(', ')

        throw new TRPCError({
          code: 'CONFLICT',
          message: `Time conflict detected with existing events: ${conflictDetails}`,
        })
      }

      const event = await ctx.db.event.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return event
    }),

  // Update event
  updateEvent: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input

      // Check if user owns the event
      const existingEvent = await ctx.db.event.findUnique({
        where: { id },
        select: { ownerId: true },
      })

      if (!existingEvent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        })
      }

      if (existingEvent.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own events',
        })
      }

      // Check for time conflicts if startTime or endTime is being updated
      if (updateData.startTime || updateData.endTime) {
        // Get current event data to use as fallback for unchanged fields
        const currentEvent = await ctx.db.event.findUnique({
          where: { id },
          select: { startTime: true, endTime: true },
        })

        if (!currentEvent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Event not found',
          })
        }

        const newStartTime = updateData.startTime || currentEvent.startTime
        const newEndTime = updateData.endTime || currentEvent.endTime

        // Check for conflicts with other events (excluding the current event)
        const conflictingEvents = await ctx.db.event.findMany({
          where: {
            ownerId: ctx.session.user.id,
            id: { not: id }, // Exclude the current event being updated
            OR: [
              // New event starts during existing event
              {
                AND: [
                  { startTime: { lte: newStartTime } },
                  { endTime: { gt: newStartTime } },
                ],
              },
              // New event ends during existing event
              {
                AND: [
                  { startTime: { lt: newEndTime } },
                  { endTime: { gte: newEndTime } },
                ],
              },
              // New event completely contains existing event
              {
                AND: [
                  { startTime: { gte: newStartTime } },
                  { endTime: { lte: newEndTime } },
                ],
              },
              // Existing event completely contains new event
              {
                AND: [
                  { startTime: { lte: newStartTime } },
                  { endTime: { gte: newEndTime } },
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        })

        if (conflictingEvents.length > 0) {
          const conflictDetails = conflictingEvents
            .map(event => `"${event.title}" (${event.startTime.toLocaleString()} - ${event.endTime.toLocaleString()})`)
            .join(', ')

          throw new TRPCError({
            code: 'CONFLICT',
            message: `Time conflict detected with existing events: ${conflictDetails}`,
          })
        }
      }

      const event = await ctx.db.event.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return event
    }),

  // Delete event
  deleteEvent: protectedProcedure
    .input(eventIdSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user owns the event
      const existingEvent = await ctx.db.event.findUnique({
        where: { id: input.id },
        select: { ownerId: true },
      })

      if (!existingEvent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Event not found',
        })
      }

      if (existingEvent.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own events',
        })
      }

      await ctx.db.event.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),

})
