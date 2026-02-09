import { cn } from '@/lib/utils'

type SkeletonVariant = 'text' | 'card' | 'table' | 'chart'

interface LoadingSkeletonProps {
  variant?: SkeletonVariant
  rows?: number
  columns?: number
  className?: string
}

function Shimmer({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

function TextSkeleton({ rows = 3 }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} className={cn('h-4', i === rows - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <Shimmer className="h-4 w-24" />
      <Shimmer className="h-7 w-32" />
      <Shimmer className="h-4 w-16" />
    </div>
  )
}

function TableSkeleton({ rows = 5, columns = 4 }: { rows: number; columns: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Shimmer key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="border-b border-border px-4 py-3 last:border-0">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, ci) => (
              <Shimmer key={ci} className="h-4 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-5 w-32" />
        <Shimmer className="h-5 w-20" />
      </div>
      <Shimmer className="h-48 w-full rounded-lg" />
    </div>
  )
}

export function LoadingSkeleton({ variant = 'text', rows = 5, columns = 4, className }: LoadingSkeletonProps) {
  return (
    <div className={className}>
      {variant === 'text' && <TextSkeleton rows={rows} />}
      {variant === 'card' && <CardSkeleton />}
      {variant === 'table' && <TableSkeleton rows={rows} columns={columns} />}
      {variant === 'chart' && <ChartSkeleton />}
    </div>
  )
}
