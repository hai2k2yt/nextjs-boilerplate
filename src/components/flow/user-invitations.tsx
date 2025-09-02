'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Mail, Clock, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { trpc } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

export function UserInvitations() {
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)

  const { data: invitations, refetch } = trpc.flowRoom.getUserInvitations.useQuery()

  const acceptInvitationMutation = trpc.flowRoom.acceptInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation accepted!',
        description: 'You have successfully joined the room.',
      })
      refetch()
      setProcessingInvitation(null)
    },
    onError: (error) => {
      toast({
        title: 'Failed to accept invitation',
        description: error.message,
        variant: 'destructive',
      })
      setProcessingInvitation(null)
    },
  })

  const declineInvitationMutation = trpc.flowRoom.declineInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined.',
      })
      refetch()
      setProcessingInvitation(null)
    },
    onError: (error) => {
      toast({
        title: 'Failed to decline invitation',
        description: error.message,
        variant: 'destructive',
      })
      setProcessingInvitation(null)
    },
  })

  const handleAcceptInvitation = (invitationId: string) => {
    setProcessingInvitation(invitationId)
    acceptInvitationMutation.mutate({ invitationId })
  }

  const handleDeclineInvitation = (invitationId: string) => {
    setProcessingInvitation(invitationId)
    declineInvitationMutation.mutate({ invitationId })
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'EDITOR':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'VIEWER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (!invitations || invitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Pending Invitations</h3>
        <Badge variant="secondary">{invitations.length}</Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {invitations.map((invitation) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {invitation.room.name}
                        <Badge className={getRoleColor(invitation.role)}>
                          {invitation.role.toLowerCase()}
                        </Badge>
                      </CardTitle>
                      {invitation.room.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {invitation.room.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Inviter Info */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={invitation.inviter.image || undefined} />
                      <AvatarFallback>
                        {invitation.inviter.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        Invited by {invitation.inviter.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {invitation.inviter.email}
                      </p>
                    </div>
                  </div>

                  {/* Message */}
                  {invitation.message && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm italic">&ldquo;{invitation.message}&rdquo;</p>
                    </div>
                  )}

                  {/* Invitation Details */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Invited {formatDate(invitation.createdAt)}</span>
                    </div>
                    {invitation.expiresAt && (
                      <div className="flex items-center gap-1">
                        <span>Expires {formatDate(invitation.expiresAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      disabled={processingInvitation === invitation.id}
                      size="sm"
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      disabled={processingInvitation === invitation.id}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/flow/${invitation.room.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
