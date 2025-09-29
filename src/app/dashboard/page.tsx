'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PostCardSkeleton } from '@/components/skeletons'
import { useToast } from '@/hooks/use-toast'

const createPostSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
})

type CreatePostSchema = z.infer<typeof createPostSchema>

export default function DashboardPage() {
  const { toast } = useToast()

  // Demo posts data (replacing removed example router)
  const posts = [
    { id: '1', name: 'Welcome to the Dashboard', author: { name: 'System', email: 'system@example.com' }, createdAt: new Date() },
    { id: '2', name: 'Getting Started Guide', author: { name: 'Admin', email: 'admin@example.com' }, createdAt: new Date() },
  ]
  const isLoading = false

  const handleCreatePost = (_data: { name: string }) => {
    // Simulate post creation
    toast({
      title: 'Success',
      description: 'Post created successfully!',
    })
    reset()
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostSchema>({
    resolver: zodResolver(createPostSchema),
  })

  const onSubmit = (data: CreatePostSchema) => {
    handleCreatePost(data)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome to your dashboard. Manage your posts and explore tRPC functionality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Post Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Post
              </CardTitle>
              <CardDescription>
                Add a new post using React Hook Form with Zod validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Post Name</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter post name..."
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Creating...' : 'Create Post'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Posts List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Posts</CardTitle>
              <CardDescription>
                Demo posts for dashboard showcase
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <PostCardSkeleton key={i} />
                  ))}
                </div>              ) : posts && posts.length > 0 ? (
                <div className="space-y-2">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{post.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No posts yet. Create your first post!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

      </motion.div>
    </div>
  )
}
