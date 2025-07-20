'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc'
import { Loader2, User, Mail, Calendar, Shield } from 'lucide-react'

export function UserProfile() {
  const { data: session, status } = useSession()
  const { data: profile, isLoading } = trpc.auth.getProfile.useQuery(
    undefined,
    { enabled: !!session }
  )

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to view your profile.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </CardTitle>
          <CardDescription>
            Your account information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Name:</span>
            <span>{profile?.name || session.user.name || 'Not provided'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Email:</span>
            <span>{profile?.email || session.user.email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Role:</span>
            <Badge variant={profile?.role === 'ADMIN' ? 'default' : 'secondary'}>
              {profile?.role || session.user.role}
            </Badge>
          </div>
          
          {profile?.createdAt && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Member since:</span>
              <span>{new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          
          {profile?._count && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Posts:</span>
              <Badge variant="outline">{profile._count.posts}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => signOut({ callbackUrl: '/' })}
            variant="destructive"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
