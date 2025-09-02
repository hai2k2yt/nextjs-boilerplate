'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Search, Loader2, Mail, User, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { trpc } from '@/lib/trpc'
import { toast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/use-debounce'
import { COLLABORATION_CONSTANTS } from '@/lib/constants/collaboration'

const inviteSchema = z.object({
  searchQuery: z.string().min(1, 'Please search for a user or enter an email'),
  role: z.enum(['EDITOR', 'VIEWER']).default('VIEWER'),
  message: z.string().optional(),
})

type InviteFormData = z.infer<typeof inviteSchema>

interface InviteUsersDialogProps {
  roomId: string
  roomName: string
  children: React.ReactNode
  onInviteSent?: () => void
}

export function InviteUsersDialog({ 
  roomId, 
  roomName, 
  children, 
  onInviteSent 
}: InviteUsersDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null>(null)
  const [emailInvite, setEmailInvite] = useState('')

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      searchQuery: '',
      role: 'VIEWER',
      message: '',
    },
  })

  const searchQuery = form.watch('searchQuery')
  const debouncedSearch = useDebounce(searchQuery, COLLABORATION_CONSTANTS.USER_SEARCH_DEBOUNCE_DELAY)

  // Search users
  const { data: users, isLoading: isSearching } = trpc.flowRoom.searchUsers.useQuery(
    {
      query: debouncedSearch,
      roomId,
      limit: 10,
    },
    {
      enabled: debouncedSearch.length >= 2 && !selectedUser && !emailInvite,
    }
  )

  // Create invitation mutation
  const createInvitationMutation = trpc.flowRoom.createInvitation.useMutation({
    onSuccess: () => {
      toast({
        title: 'Invitation sent!',
        description: 'The user will be notified about your invitation.',
      })
      setIsOpen(false)
      form.reset()
      setSelectedUser(null)
      setEmailInvite('')
      onInviteSent?.()
    },
    onError: (error) => {
      toast({
        title: 'Failed to send invitation',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleUserSelect = (user: NonNullable<typeof users>[0]) => {
    setSelectedUser(user)
    setEmailInvite('')
    form.setValue('searchQuery', user.name || user.email || '')
  }

  const handleEmailInvite = () => {
    const query = form.getValues('searchQuery')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (emailRegex.test(query)) {
      setEmailInvite(query)
      setSelectedUser(null)
    }
  }

  const clearSelection = () => {
    setSelectedUser(null)
    setEmailInvite('')
    form.setValue('searchQuery', '')
  }

  const onSubmit = (data: InviteFormData) => {
    if (selectedUser) {
      createInvitationMutation.mutate({
        roomId,
        userId: selectedUser.id,
        role: data.role,
        message: data.message,
      })
    } else if (emailInvite) {
      createInvitationMutation.mutate({
        roomId,
        email: emailInvite,
        role: data.role,
        message: data.message,
      })
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const showEmailOption = searchQuery.length > 0 && 
    isValidEmail(searchQuery) && 
    !selectedUser && 
    !emailInvite &&
    (!users || users.length === 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Users to {roomName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Search */}
            <FormField
              control={form.control}
              name="searchQuery"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Search Users or Enter Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Search by name or email..."
                        className="pl-10"
                        disabled={!!selectedUser || !!emailInvite}
                      />
                      {(selectedUser || emailInvite) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                          onClick={clearSelection}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected User or Email */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.image || undefined} />
                  <AvatarFallback>
                    {selectedUser.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
                <Badge variant="secondary">
                  <User className="h-3 w-3 mr-1" />
                  User
                </Badge>
              </div>
            )}

            {emailInvite && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{emailInvite}</p>
                  <p className="text-sm text-muted-foreground">Email invitation</p>
                </div>
                <Badge variant="outline">
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Badge>
              </div>
            )}

            {/* Search Results */}
            {!selectedUser && !emailInvite && searchQuery.length >= 2 && (
              <div className="space-y-2">
                {isSearching && (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching users...
                  </div>
                )}

                {!isSearching && users && users.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Users found:</p>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showEmailOption && (
                  <button
                    type="button"
                    onClick={handleEmailInvite}
                    className="w-full flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors border border-dashed"
                  >
                    <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Invite {searchQuery}</p>
                      <p className="text-xs text-muted-foreground">Send email invitation</p>
                    </div>
                  </button>
                )}

                {!isSearching && users && users.length === 0 && !showEmailOption && (
                  <p className="text-sm text-muted-foreground p-3">
                    No users found. Try a different search term.
                  </p>
                )}
              </div>
            )}

            {/* Role Selection */}
            {(selectedUser || emailInvite) && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="VIEWER" id="viewer" />
                          <Label htmlFor="viewer" className="text-sm">
                            Viewer (can view only)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="EDITOR" id="editor" />
                          <Label htmlFor="editor" className="text-sm">
                            Editor (can edit)
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Optional Message */}
            {(selectedUser || emailInvite) && (
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add a personal message to your invitation..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={(!selectedUser && !emailInvite) || createInvitationMutation.isPending}
              >
                {createInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
