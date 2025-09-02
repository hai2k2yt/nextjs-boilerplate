'use client'

import { memo } from 'react'
import { Users, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
interface Participant {
  userId: string
  name: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  isActive: boolean
  cursor?: { x: number; y: number }
}

interface CollaborationPanelProps {
  participants: Participant[]
  roomId: string
  className?: string
}

export const CollaborationPanel = memo(({ participants, roomId, className }: CollaborationPanelProps) => {
  const activeParticipants = participants.filter(p => p.isActive)
  const totalParticipants = participants.length

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Collaboration
          <Badge variant="secondary" className="ml-auto">
            {activeParticipants.length} active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Room Info */}
        <div className="text-xs text-muted-foreground">
          Room: <span className="font-mono">{roomId.slice(0, 8)}...</span>
        </div>

        {/* Participants List */}
        <div className="space-y-2">
          {participants.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              No other participants
            </div>
          ) : (
            participants.map(participant => (
              <div
                key={participant.userId}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div className="relative">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://avatar.vercel.sh/${participant.userId}`} />
                    <AvatarFallback className="text-xs">
                      {participant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Online status indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                    participant.isActive ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {participant.name}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={participant.role === 'OWNER' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {participant.role.toLowerCase()}
                    </Badge>
                    {participant.isActive ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Connection Stats */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Total participants:</span>
            <span>{totalParticipants}</span>
          </div>
          <div className="flex justify-between">
            <span>Active now:</span>
            <span className="text-green-600">{activeParticipants.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

CollaborationPanel.displayName = 'CollaborationPanel'