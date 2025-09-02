'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Plus, Users, Calendar, Settings, Trash2, ExternalLink, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { trpc } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'
import { RoomDiscovery } from '@/components/flow/room-discovery'
import { InviteUsersDialog } from '@/components/flow/invite-users-dialog'
import { UserInvitations } from '@/components/flow/user-invitations'
import { RoomSettingsDialog } from '@/components/flow/room-settings-dialog'

export default function FlowRoomsPage() {
  const { data: session } = useSession()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    isPublic: false,
  })

  // Fetch user's rooms
  const { data: rooms, isLoading, refetch } = trpc.flowRoom.getUserRooms.useQuery(
    undefined,
    { enabled: !!session?.user }
  )

  // Create room mutation
  const createRoomMutation = trpc.flowRoom.create.useMutation({
    onSuccess: (room) => {
      toast({
        title: 'Room created',
        description: `Flow room "${room.name}" has been created successfully.`,
      })
      setIsCreateDialogOpen(false)
      setNewRoomData({ name: '', description: '', isPublic: false })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Delete room mutation
  const deleteRoomMutation = trpc.flowRoom.delete.useMutation({
    onSuccess: () => {
      toast({
        title: 'Room deleted',
        description: 'Flow room has been deleted successfully.',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleCreateRoom = () => {
    if (!newRoomData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Room name is required.',
        variant: 'destructive',
      })
      return
    }

    createRoomMutation.mutate(newRoomData)
  }

  const handleDeleteRoom = (roomId: string, roomName: string) => {
    if (confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      deleteRoomMutation.mutate({ id: roomId })
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please sign in to access your flow rooms.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Flow Rooms</h1>
            <p className="text-muted-foreground mt-2">
              Collaborate on React Flow diagrams in real-time
            </p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Flow Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Room Name</Label>
                  <Input
                    id="name"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newRoomData.description}
                    onChange={(e) => setNewRoomData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this flow is for"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={newRoomData.isPublic}
                    onCheckedChange={(checked) => setNewRoomData(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label htmlFor="isPublic">Make room public</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRoom}
                    disabled={createRoomMutation.isPending}
                  >
                    {createRoomMutation.isPending ? 'Creating...' : 'Create Room'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for My Rooms and Discover */}
        <Tabs defaultValue="my-rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="my-rooms" className="space-y-6">
            {/* User Invitations */}
            <UserInvitations />

            {/* My Rooms Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rooms && rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{room.name}</CardTitle>
                        {room.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {room.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Owner Info */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={room.owner.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {room.owner.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {room.owner.name}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.participants.length + 1} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/flow/${room.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open
                        </Link>
                      </Button>
                      
                      {room.ownerId === session.user.id && (
                        <>
                          <InviteUsersDialog
                            roomId={room.id}
                            roomName={room.name}
                            onInviteSent={() => refetch()}
                          >
                            <Button variant="outline" size="icon" title="Invite users">
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </InviteUsersDialog>
                          <RoomSettingsDialog
                            room={room}
                            onRoomUpdated={() => refetch()}
                          >
                            <Button variant="outline" size="icon" title="Room settings">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </RoomSettingsDialog>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDeleteRoom(room.id, room.name)
                            }}
                            disabled={deleteRoomMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No flow rooms yet</h3>
                  <p className="text-muted-foreground">
                    Create your first collaborative flow room to get started.
                  </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Room
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            <RoomDiscovery onRoomJoined={() => refetch()} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
