'use client'

import { useState, useRef, useEffect } from 'react'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Filter,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCalendar, useMyEvents } from '@/hooks/use-calendar'
import { EventModal } from '@/components/calendar/event-modal'
import { EventDetailsModal } from '@/components/calendar/event-details-modal'
import { CalendarFilters } from '@/components/calendar/calendar-filters'
import { CalendarStats } from '@/components/calendar/calendar-stats'
import { format } from 'date-fns'

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  const {
    currentDate,
    currentView,
    selectedEventData,
    fullCalendarEvents,
    error,
    isLoading,
    isCreating,
    setCurrentView,
    setSelectedEvent,
    navigateToToday,
    navigatePrevious,
    navigateNext,
    navigateToDate,
    isAuthenticated,
  } = useCalendar()

  // Get user's own events for consistency with stats - use the same date range as the main calendar
  const { fullCalendarEvents: userFullCalendarEvents } = useMyEvents()

  // Use user's events if authenticated, otherwise use public events
  const displayEvents = isAuthenticated ? userFullCalendarEvents : fullCalendarEvents

  // Force FullCalendar to update when events change
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi()
      // Remove all events and add them back to force refresh
      calendarApi.removeAllEvents()
      calendarApi.addEventSource(displayEvents)
    }
  }, [displayEvents])



  // Handle date click (for creating new events)
  const handleDateClick = (arg: any) => {
    if (!isAuthenticated) return
    
    setSelectedDate(arg.date)
    setShowEventModal(true)
  }

  // Handle event click (for viewing/editing events)
  const handleEventClick = (arg: any) => {
    setSelectedEvent(arg.event.id)
    setShowEventDetails(true)
  }

  // Handle view change
  const handleViewChange = (view: string) => {
    setCurrentView(view)
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view)
    }
  }

  // Handle navigation
  const handlePrevious = () => {
    navigatePrevious()
    if (calendarRef.current) {
      calendarRef.current.getApi().prev()
    }
  }

  const handleNext = () => {
    navigateNext()
    if (calendarRef.current) {
      calendarRef.current.getApi().next()
    }
  }

  const handleToday = () => {
    navigateToToday()
    if (calendarRef.current) {
      calendarRef.current.getApi().today()
    }
  }

  const handleDateSet = (arg: any) => {
    // Use the view's current date instead of arg.start for better accuracy
    const viewDate = arg.view?.currentStart || arg.start
    navigateToDate(viewDate)
  }

  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your events and appointments
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {isAuthenticated && (
            <Button
              onClick={() => setShowEventModal(true)}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {isCreating ? 'Creating...' : 'New Event'}
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Calendar Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowFilters(!showFilters)}>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Today'
                  )}
                </Button>
              </div>
              
              <div className="text-xl font-semibold">
                {currentView === 'dayGridMonth' && format(currentDate, 'MMMM yyyy')}
                {currentView === 'timeGridWeek' && format(currentDate, "'Week of' MMM d, yyyy")}
                {currentView === 'timeGridDay' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                {currentView === 'listMonth' && format(currentDate, 'MMMM yyyy')}
              </div>
            </div>
            
            <Tabs value={currentView} onValueChange={handleViewChange}>
              <TabsList>
                <TabsTrigger value="dayGridMonth" disabled={isLoading}>
                  Month
                </TabsTrigger>
                <TabsTrigger value="timeGridWeek" disabled={isLoading}>
                  Week
                </TabsTrigger>
                <TabsTrigger value="timeGridDay" disabled={isLoading}>
                  Day
                </TabsTrigger>
                <TabsTrigger value="listMonth" disabled={isLoading}>
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-1 gap-6">
        {/* Sidebar */}
        <div className="w-80 space-y-6">
          {/* Calendar Stats */}
          <CalendarStats />
          
          {/* Filters */}
          {showFilters && <CalendarFilters />}
          
          {/* Mini Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Click on any date in the main calendar to create a new event
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar */}
        <Card className="flex-1">
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Error loading calendar: {error}
              </div>
            )}
            
            <div className="calendar-container relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading calendar...</span>
                  </div>
                </div>
              )}

              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={currentView}
                initialDate={currentDate}
                events={displayEvents}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                datesSet={handleDateSet}
                headerToolbar={false} // We handle navigation ourselves
                height="auto"
                dayMaxEvents={3}
                moreLinkClick="popover"
                eventDisplay="block"
                displayEventTime={true}
                eventTimeFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  omitZeroMinute: false,
                  meridiem: 'short'
                }}
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={true}
                weekends={true}
                selectable={isAuthenticated}
                selectMirror={true}
                dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
                eventClassNames={() => {
                  return ['cursor-pointer', 'transition-all', 'hover:opacity-80']
                }}

              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <EventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        selectedDate={selectedDate}
        onSuccess={() => {
          setShowEventModal(false)
          setSelectedDate(null)
        }}
      />
      
      <EventDetailsModal
        open={showEventDetails}
        onOpenChange={setShowEventDetails}
        event={selectedEventData}
        onEdit={() => {
          setShowEventDetails(false)
          setShowEventModal(true)
        }}
        onClose={() => {
          setShowEventDetails(false)
          setSelectedEvent(null)
        }}
      />
    </div>
  )
}
