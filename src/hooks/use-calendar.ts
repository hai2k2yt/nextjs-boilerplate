import { useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'
import { getCalendarViewRange, convertToFullCalendarEvent } from '@/lib/utils/calendar'
import type { EventQuery, CreateEvent, UpdateEvent, FullCalendarEvent } from '@/lib/validations/calendar'

export interface CalendarState {
  currentDate: Date
  currentView: string
  selectedEvent: string | null
  isLoading: boolean
  error: string | null
}

export function useCalendar(initialDate: Date = new Date(), initialView: string = 'dayGridMonth') {
  const { data: session } = useSession()
  const { toast } = useToast()
  const utils = trpc.useUtils()
  
  // Calendar state
  const [state, setState] = useState<CalendarState>({
    currentDate: initialDate,
    currentView: initialView,
    selectedEvent: null,
    isLoading: false,
    error: null,
  })

  // Get date range for current view
  const dateRange = useMemo(() => {
    return getCalendarViewRange(state.currentDate, state.currentView)
  }, [state.currentDate, state.currentView])

  // Query for events in current view
  const eventQuery: EventQuery = {
    startDate: dateRange.start,
    endDate: dateRange.end,
  }

  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = trpc.calendar.getEvents.useQuery(eventQuery)

  // Convert events to FullCalendar format
  const fullCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    return events.map((event) => {
      return convertToFullCalendarEvent({
        ...event,
        description: event.description || undefined,
        location: event.location || undefined,
        color: event.color || undefined,
        recurrenceRule: event.recurrenceRule || undefined,
        metadata: event.metadata ? (event.metadata as Record<string, any>) : undefined,
      })
    })
  }, [events])

  // Mutations
  const createEventMutation = trpc.calendar.createEvent.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch calendar queries first
      await Promise.all([
        utils.calendar.getEvents.invalidate(),
        utils.calendar.getMyEvents.invalidate(),
        refetchEvents() // Force immediate refetch
      ])

      // Force a small delay to ensure data is updated
      setTimeout(() => {
        refetchEvents()
      }, 100)

      toast({
        title: 'Success',
        description: 'Event created successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const updateEventMutation = trpc.calendar.updateEvent.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch calendar queries first
      await Promise.all([
        utils.calendar.getEvents.invalidate(),
        utils.calendar.getMyEvents.invalidate(),
        refetchEvents() // Force immediate refetch
      ])

      toast({
        title: 'Success',
        description: 'Event updated successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const deleteEventMutation = trpc.calendar.deleteEvent.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch calendar queries first
      await Promise.all([
        utils.calendar.getEvents.invalidate(),
        utils.calendar.getMyEvents.invalidate(),
        refetchEvents() // Force immediate refetch
      ])

      toast({
        title: 'Success',
        description: 'Event deleted successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Actions
  const setCurrentDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, currentDate: date }))
  }, [])

  const setCurrentView = useCallback((view: string) => {
    setState(prev => ({ ...prev, currentView: view }))
  }, [])

  const setSelectedEvent = useCallback((eventId: string | null) => {
    setState(prev => ({ ...prev, selectedEvent: eventId }))
  }, [])

  const createEvent = useCallback(async (eventData: CreateEvent) => {
    if (!session?.user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create events',
        variant: 'destructive',
      })
      return
    }

    return createEventMutation.mutateAsync(eventData)
  }, [session, createEventMutation, toast])

  const updateEvent = useCallback(async (eventData: UpdateEvent) => {
    if (!session?.user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update events',
        variant: 'destructive',
      })
      return
    }

    return updateEventMutation.mutateAsync(eventData)
  }, [session, updateEventMutation, toast])

  const deleteEvent = useCallback(async (eventId: string) => {
    if (!session?.user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete events',
        variant: 'destructive',
      })
      return
    }

    return deleteEventMutation.mutateAsync({ id: eventId })
  }, [session, deleteEventMutation, toast])

  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [setCurrentDate])

  const navigateToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [setCurrentDate])

  const navigatePrevious = useCallback(() => {
    const newDate = new Date(state.currentDate)
    
    switch (state.currentView) {
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() - 1)
        break
      case 'timeGridWeek':
      case 'listWeek':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() - 1)
        break
    }
    
    setCurrentDate(newDate)
  }, [state.currentDate, state.currentView, setCurrentDate])

  const navigateNext = useCallback(() => {
    const newDate = new Date(state.currentDate)
    
    switch (state.currentView) {
      case 'dayGridMonth':
        newDate.setMonth(newDate.getMonth() + 1)
        break
      case 'timeGridWeek':
      case 'listWeek':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'timeGridDay':
        newDate.setDate(newDate.getDate() + 1)
        break
    }
    
    setCurrentDate(newDate)
  }, [state.currentDate, state.currentView, setCurrentDate])

  // Get selected event data
  const selectedEventData = useMemo(() => {
    if (!state.selectedEvent) return null
    return events.find(event => event.id === state.selectedEvent) || null
  }, [state.selectedEvent, events])

  return {
    // State
    currentDate: state.currentDate,
    currentView: state.currentView,
    selectedEvent: state.selectedEvent,
    selectedEventData,
    dateRange,
    
    // Data
    events,
    fullCalendarEvents,
    
    // Loading states
    isLoading: eventsLoading || createEventMutation.isPending || updateEventMutation.isPending || deleteEventMutation.isPending,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    
    // Error states
    error: eventsError?.message || state.error,
    
    // Actions
    setCurrentDate,
    setCurrentView,
    setSelectedEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchEvents,
    
    // Navigation
    navigateToDate,
    navigateToToday,
    navigatePrevious,
    navigateNext,
    
    // Session
    user: session?.user,
    isAuthenticated: !!session?.user,
  }
}

// Hook for managing user's own events
export function useMyEvents(query?: Partial<EventQuery>) {
  const { data: session } = useSession()

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = trpc.calendar.getMyEvents.useQuery(query, {
    enabled: !!session?.user,
  })

  const fullCalendarEvents: FullCalendarEvent[] = useMemo(() => {
    return events.map((event) => {
      return convertToFullCalendarEvent({
        ...event,
        description: event.description || undefined,
        location: event.location || undefined,
        color: event.color || undefined,
        recurrenceRule: event.recurrenceRule || undefined,
        metadata: event.metadata ? (event.metadata as Record<string, any>) : undefined,
      })
    })
  }, [events])

  return {
    events,
    fullCalendarEvents,
    isLoading,
    error: error?.message,
    refetch,
    user: session?.user,
    isAuthenticated: !!session?.user,
  }
}


