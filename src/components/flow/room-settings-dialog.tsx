'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Settings, Users, Globe, Lock, UserMinus, Crown, Edit3, Eye } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { trpc } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'

const roomSettingsSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  isPublic: z.boolean(),
})

type RoomSettingsFormData = z.infer<typeof roomSettingsSchema>

interface RoomSettingsDialogProps {
  room: {
    id: string
    name: string
    description: string | null
    isPublic: boolean
    ownerId: string
    participants: Array<{
      id: string
      role: string
      user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
      }
    }>
  }
  children: React.ReactNode
  onRoomUpdated?: () => void
}

export function RoomSettingsDialog({ 
  room, 
  children, 
  onRoomUpdated 
}: RoomSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const form = useForm<RoomSettingsFormData>({
    resolver: zodResolver(roomSettingsSchema),
    defaultValues: {
      name: room.name,
      description: room.description || '',
      isPublic: room.isPublic,
    },
  })

  // Update room mutation
  const updateRoomMutation = trpc.flowRoom.update.useMutation({
    onSuccess: () => {
      toast({
        title: 'Room updated',
        description: 'Room settings have been saved successfully.',
      })
      onRoomUpdated?.()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update room',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Remove participant mutation
  const removeParticipantMutation = trpc.flowRoom.removeParticipant.useMutation({
    onSuccess: () => {
      toast({
        title: 'Participant removed',
        description: 'The participant has been removed from the room.',
      })
      onRoomUpdated?.()
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove participant',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: RoomSettingsFormData) => {
    updateRoomMutation.mutate({
      id: room.id,
      ...data,
    })
  }

  const handleRemoveParticipant = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from this room?`)) {
      removeParticipantMutation.mutate({
        roomId: room.id,
        userId,
      })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'EDITOR':
        return <Edit3 className="h-4 w-4 text-green-500" />
      case 'VIEWER':
        return <Eye className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'EDITOR':
        return 'secondary'
      case 'VIEWER':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="participants">
              Participants ({room.participants.length + 1})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter room name" />
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
                          {...field}
                          placeholder="Describe what this room is for"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base flex items-center gap-2">
                          {field.value ? (
                            <>
                              <Globe className="h-4 w-4" />
                              Public Room
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4" />
                              Private Room
                            </>
                          )}
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {field.value
                            ? 'Anyone can discover and join this room'
                            : 'Only invited users can access this room'
                          }
                        </p>
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

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateRoomMutation.isPending}
                  >
                    {updateRoomMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="participants" className="space-y-4">
            <div className="space-y-3">
              {/* Room Owner */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {room.participants.find(p => p.user.id === room.ownerId)?.user.name?.charAt(0) || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">You (Owner)</p>
                    <p className="text-sm text-muted-foreground">Room creator</p>
                  </div>
                </div>
                <Badge variant="default" className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              </div>

              {/* Participants */}
              {room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.user.image || undefined} />
                      <AvatarFallback>
                        {participant.user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{participant.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {participant.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getRoleBadgeVariant(participant.role)}
                      className="flex items-center gap-1"
                    >
                      {getRoleIcon(participant.role)}
                      {participant.role.toLowerCase()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParticipant(
                        participant.user.id,
                        participant.user.name || 'this user'
                      )}
                      disabled={removeParticipantMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {room.participants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No participants yet</p>
                  <p className="text-sm">Invite users to collaborate on this room</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
