'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Clock, MapPin, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useCalendar } from '@/hooks/use-calendar'
import { createEventSchema, type CreateEvent, type EventType } from '@/lib/validations/calendar'
import { EVENT_TYPE_COLORS, DEFAULT_EVENT_COLORS, getRandomEventColor } from '@/lib/utils/calendar'

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date | null
  editEvent?: any // Event data for editing
  onSuccess?: () => void
}

const eventTypes: { value: EventType; label: string; description: string }[] = [
  { value: 'APPOINTMENT', label: 'Appointment', description: 'One-on-one meetings' },
  { value: 'MEETING', label: 'Meeting', description: 'Group meetings and conferences' },
  { value: 'TASK', label: 'Task', description: 'Personal tasks and reminders' },
  { value: 'REMINDER', label: 'Reminder', description: 'Important reminders' },
  { value: 'AVAILABILITY', label: 'Availability', description: 'Available time slots' },
  { value: 'BLOCKED', label: 'Blocked', description: 'Blocked time slots' },
]

export function EventModal({ open, onOpenChange, selectedDate, editEvent, onSuccess }: EventModalProps) {
  const { createEvent, updateEvent, isCreating, isUpdating } = useCalendar()
  const [selectedColor, setSelectedColor] = useState<string>(getRandomEventColor())

  const form = useForm<CreateEvent>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: selectedDate || new Date(),
      endTime: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
      location: '',
      eventType: 'APPOINTMENT',
      isAllDay: false,
      isRecurring: false,

      isPublic: false,
      color: selectedColor,
    },
  })

  // Update form when editing an event
  useEffect(() => {
    if (editEvent) {
      form.reset({
        title: editEvent.title,
        description: editEvent.description || '',
        startTime: new Date(editEvent.startTime),
        endTime: new Date(editEvent.endTime),
        location: editEvent.location || '',
        eventType: editEvent.eventType,
        isAllDay: editEvent.isAllDay,
        isRecurring: editEvent.isRecurring,
        isPublic: editEvent.isPublic,
        color: editEvent.color || EVENT_TYPE_COLORS[editEvent.eventType as EventType],
      })
      setSelectedColor(editEvent.color || EVENT_TYPE_COLORS[editEvent.eventType as EventType])
    } else if (selectedDate) {
      const endTime = new Date(selectedDate.getTime() + 60 * 60 * 1000)
      form.reset({
        title: '',
        description: '',
        startTime: selectedDate,
        endTime: endTime,
        location: '',
        eventType: 'APPOINTMENT',
        isAllDay: false,
        isRecurring: false,

        isPublic: false,
        color: selectedColor,
      })
    }
  }, [editEvent, selectedDate, form, selectedColor])

  // Update color when event type changes
  const eventType = form.watch('eventType')
  useEffect(() => {
    if (!editEvent && eventType) {
      const typeColor = EVENT_TYPE_COLORS[eventType]
      setSelectedColor(typeColor)
      form.setValue('color', typeColor)
    }
  }, [eventType, editEvent, form])

  const onSubmit = async (data: CreateEvent) => {
    try {
      if (editEvent) {
        await updateEvent({ ...data, id: editEvent.id })
      } else {
        await createEvent(data)
      }
      // Call onSuccess after mutation and cache invalidation complete
      onSuccess?.()
      form.reset()
    } catch {
      // Error handling is done in the hook
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    form.setValue('color', color)
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {editEvent 
              ? 'Update the event details below.'
              : 'Fill in the details to create a new calendar event.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Event description (optional)"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: EVENT_TYPE_COLORS[type.value] }}
                              />
                              <div>
                                <div className="font-medium">{type.label}</div>
                                <div className="text-xs text-muted-foreground">{type.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="isAllDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>All Day Event</FormLabel>
                        <FormDescription>
                          This event lasts the entire day
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="datetime-local"
                            value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="datetime-local"
                            value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Event location (optional)" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Selection */}
            <div className="space-y-2">
              <FormLabel>Color</FormLabel>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_EVENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                  />
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">


              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Event</FormLabel>
                      <FormDescription>
                        Make this event visible to everyone
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editEvent ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
