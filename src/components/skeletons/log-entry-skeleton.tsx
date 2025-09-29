import { Skeleton } from '@/components/ui/skeleton'

export const LogEntrySkeleton = () => (
  <div className="border rounded-lg p-4 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <div className="flex items-center space-x-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
)



export const SyncLogSkeleton = () => (
  <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
    <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
)
