"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardSkeletonProps {
  /** Number of skeleton cards to render */
  count?: number;
  /** Number of columns on larger screens */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading state for stat/metric cards.
 * Mimics the layout of the SummaryCards component.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <StatCardSkeleton count={4} columns={4} />;
 * }
 * ```
 */
export function StatCardSkeleton({
  count = 4,
  columns = 4,
  className,
}: StatCardSkeletonProps) {
  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-2 lg:grid-cols-5",
    6: "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  return (
    <div className={cn(`grid gap-4 ${gridCols[columns]}`, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Single stat card skeleton for inline use
 */
export function SingleStatSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-5 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * Hero stat skeleton for larger dashboard stats
 */
export function HeroStatSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </Card>
  );
}
