'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Calendar, ArrowRight } from 'lucide-react'
import { CollaborativeFlowCanvas } from '@/components/reactflow/collaborative-flow-canvas'
import { trpc } from '@/lib/trpc'
import { useToast } from '@/hooks/use-toast'

export default function RemoteCollaborativePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [newRoomName, setNewRoomName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Fetch user's rooms
  const { data: rooms, refetch: refetchRooms } = trpc.flowRoom.getUserRooms.useQuery(
    undefined,
    { enabled: !!session }
  )

  // Create room mutation
  const createRoomMutation = trpc.flowRoom.create.useMutation({
    onSuccess: (room) => {
      toast({
        title: 'Room created',
        description: `Room "${room.name}" has been created successfully.`,
      })
      setSelectedRoomId(room.id)
      setNewRoomName('')
      setIsCreating(false)
      refetchRooms()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create room.',
        variant: 'destructive',
      })
      setIsCreating(false)
    }
  })

  // WebSocket initialization is now handled in the store's connectToRoom method

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return

    setIsCreating(true)
    createRoomMutation.mutate({
      name: newRoomName.trim(),
      description: 'Real-time collaborative React Flow workspace',
      isPublic: false
    })
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to access real-time collaborative React Flow features.
            </p>
            <Button onClick={() => router.push('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show collaborative canvas if room is selected
  if (selectedRoomId) {
    return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoomId(null)}
              >
                ← Back to Rooms
              </Button>
              <div>
                <h1 className="font-semibold">Remote Collaborative React Flow</h1>
                <p className="text-sm text-muted-foreground">
                  Room: {rooms?.find(r => r.id === selectedRoomId)?.name}
                </p>
              </div>
            </div>

            <Badge variant="secondary" className="hidden sm:flex">
              Real-time Collaboration
            </Badge>
          </div>
        </div>

        {/* Collaborative Canvas */}
        <div className="flex-1">
          <CollaborativeFlowCanvas roomId={selectedRoomId} />
        </div>
      </div>
    )
  }

  // Show room selection interface
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Real-time Remote Collaborative React Flow</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create and collaborate on React Flow diagrams in real-time with multiple users.
          Features live cursors, instant synchronization, and role-based permissions.
        </p>
      </div>

      {/* Create New Room */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Room
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter room name..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
              disabled={isCreating}
            />
            <Button
              onClick={handleCreateRoom}
              disabled={!newRoomName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rooms */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Your Rooms</h2>

        {!rooms || rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No rooms yet</p>
                <p>Create your first collaborative workspace above</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card
                key={room.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRoomId(room.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <Badge variant={room.ownerId === session.user.id ? 'default' : 'secondary'}>
                      {room.ownerId === session.user.id ? 'Owner' : 'Participant'}
                    </Badge>
                  </div>
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{room.participants.length + 1} participant(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(room.updatedAt)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    size="sm"
                  >
                    Open Room
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto pt-8">
        <h2 className="text-2xl font-semibold mb-6 text-center">Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Real-time Synchronization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                See changes instantly as other users edit the diagram. All node movements,
                connections, and updates are synchronized in real-time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Live Cursors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track where other users are working with live cursor indicators.
                Each participant gets a unique color for easy identification.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Debounced Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Optimized performance with intelligent debouncing of rapid changes
                like dragging, preventing excessive network requests.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Redis Caching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fast response times with Redis caching for room state and
                participant management, with periodic database synchronization.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Role-based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Owner, Editor, and Viewer roles with appropriate permissions.
                Viewers can observe but cannot edit the diagram.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WebSocket Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Reliable WebSocket connections with automatic reconnection
                and presence management for seamless collaboration.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
