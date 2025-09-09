import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export const FlowCanvasLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-8 mx-auto animate-spin rounded-full" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
)

export const FlowRoomHeaderSkeleton = () => (
  <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-20" />
        <div>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  </div>
)

export const FlowAuthRequiredSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
)

export const PostCardSkeleton = () => (
  <div className="h-12 bg-muted rounded animate-pulse" />
)
