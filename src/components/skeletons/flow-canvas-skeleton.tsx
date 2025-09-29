import { Skeleton } from '@/components/ui/skeleton'

export const FlowCanvasLoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <Skeleton className="h-8 w-8 mx-auto animate-spin rounded-full" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
)

export const PostCardSkeleton = () => (
  <div className="h-12 bg-muted rounded animate-pulse" />
)
