'use client'


import { format } from 'date-fns'
import {
  Calendar,
  MapPin,
  User,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useCalendar } from '@/hooks/use-calendar'
import { formatEventDuration, canEditEvent } from '@/lib/utils/calendar'


interface EventDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: any // Event data
  onEdit?: () => void
  onClose?: () => void
}

export function EventDetailsModal({ 
  open, 
  onOpenChange, 
  event, 
  onEdit, 
  onClose 
}: EventDetailsModalProps) {
  const { deleteEvent, isDeleting, user } = useCalendar()


  if (!event) return null

  const canEdit = canEditEvent(event, user?.id)
  const duration = formatEventDuration(new Date(event.startTime), new Date(event.endTime))

  const handleDelete = async () => {
    try {
      await deleteEvent(event.id)
      onClose?.()
    } catch {
      // Error handling is done in the hook
    }
  }

  const getEventTypeColor = (eventType: string) => {
    const colors = {
      APPOINTMENT: 'bg-blue-100 text-blue-800',
      MEETING: 'bg-green-100 text-green-800',
      TASK: 'bg-yellow-100 text-yellow-800',
      REMINDER: 'bg-purple-100 text-purple-800',
      AVAILABILITY: 'bg-cyan-100 text-cyan-800',
      BLOCKED: 'bg-red-100 text-red-800',
    }
    return colors[eventType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getEventTypeColor(event.eventType)}>
                    {event.eventType.toLowerCase().replace('_', ' ')}
                  </Badge>

                  {event.isPublic ? (
                    <Badge variant="outline">
                      <Eye className="mr-1 h-3 w-3" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">

                {canEdit && (
                  <>
                    <Button variant="outline" onClick={onEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this event? This action cannot be undone.

                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              'Delete Event'
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Details */}
            <div className="space-y-4">
              {event.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground">{event.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(new Date(event.startTime), 'PPP')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {event.isAllDay ? 'All day' : (
                        <>
                          {format(new Date(event.startTime), 'p')} - {format(new Date(event.endTime), 'p')}
                          <span className="ml-2">({duration})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">Organizer</div>
                  <div className="text-sm text-muted-foreground">
                    {event.owner?.name || event.owner?.email || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>



            {/* Event Color */}
            {event.color && (
              <>
                <Separator />
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: event.color }}
                  />
                  <span className="text-sm text-muted-foreground">Event Color</span>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}
