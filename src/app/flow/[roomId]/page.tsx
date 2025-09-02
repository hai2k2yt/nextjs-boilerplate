'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { CollaborativeFlowCanvas } from '@/components/reactflow/collaborative-flow-canvas'
import { trpc } from '@/lib/trpc'

export default function FlowRoomPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const roomId = params?.roomId as string

  const [isInitialized, setIsInitialized] = useState(false)

  // Fetch room data
  const { data: room, isLoading, error } = trpc.flowRoom.getById.useQuery(
    { id: roomId },
    { enabled: !!roomId && status === 'authenticated' }
  )

  useEffect(() => {
    if (room && session?.user && !isInitialized) {
      setIsInitialized(true)
    }
  }, [room, session, isInitialized])

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading flow room...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to access this flow room.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error?.message || 'The requested flow room could not be found.'}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/flow">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Rooms
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/flow">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{room.name}</h1>
                {room.description && (
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Owner: {room.owner.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="h-[calc(100vh-73px)]">
        {isInitialized && session?.user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CollaborativeFlowCanvas roomId={roomId} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
