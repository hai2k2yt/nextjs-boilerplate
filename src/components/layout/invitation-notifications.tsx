'use client'

import { useState } from 'react'
import { Bell, Check, X, Mail, ExternalLink } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { trpc } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

export function InvitationNotifications() {
  const [isOpen, setIsOpen] = useState(false)

  const { data: invitations, refetch } = trpc.flowRoom.getUserInvitations.useQuery()

  const acceptInvitationMutation = trpc.flowRoom.acceptInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation accepted!',
        description: 'You have successfully joined the room.',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to accept invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const declineInvitationMutation = trpc.flowRoom.declineInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined.',
      })
      refetch()
    },
    onError: (error) => {
      toast({
        title: 'Failed to decline invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleAcceptInvitation = (invitationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    acceptInvitationMutation.mutate({ invitationId })
  }

  const handleDeclineInvitation = (invitationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    declineInvitationMutation.mutate({ invitationId })
  }

  const invitationCount = invitations?.length || 0

  if (invitationCount === 0) {
    return null
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {invitationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {invitationCount > 9 ? '9+' : invitationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Room Invitations ({invitationCount})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {invitations?.map((invitation) => (
          <div key={invitation.id} className="p-3 space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {invitation.room.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={invitation.inviter.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {invitation.inviter.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      from {invitation.inviter.name}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {invitation.role.toLowerCase()}
                </Badge>
              </div>
              
              {invitation.message && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{invitation.message}&rdquo;
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="h-7 px-2 text-xs flex-1"
                onClick={(e) => handleAcceptInvitation(invitation.id, e)}
                disabled={acceptInvitationMutation.isPending || declineInvitationMutation.isPending}
              >
                <Check className="h-3 w-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs flex-1"
                onClick={(e) => handleDeclineInvitation(invitation.id, e)}
                disabled={acceptInvitationMutation.isPending || declineInvitationMutation.isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                asChild
              >
                <Link href={`/flow/${invitation.room.id}`}>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
        
        {invitationCount > 3 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/flow" className="text-center justify-center">
                View all invitations
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
