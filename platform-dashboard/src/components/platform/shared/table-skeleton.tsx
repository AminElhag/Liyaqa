import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of rows to render */
  rows?: number;
  /** Number of columns to render */
  columns?: number;
  /** Show filter card above table */
  showFilters?: boolean;
  /** Number of filter inputs to show */
  filterCount?: number;
  /** Show header row */
  showHeader?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading state for data tables.
 * Includes optional filter card and pagination.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <TableSkeleton rows={5} columns={5} showFilters />;
 * }
 * ```
 */
export function TableSkeleton({
  rows = 5,
  columns = 5,
  showFilters = true,
  filterCount = 3,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter Card */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search input - takes more space */}
              <Skeleton className="h-10 flex-1" />

              {/* Additional filters */}
              {Array.from({ length: filterCount - 1 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-10 w-full sm:w-[180px]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Table Header */}
            {showHeader && (
              <div className="flex gap-4 border-b pb-4">
                {Array.from({ length: columns }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className={cn(
                      "h-4",
                      index === 0 ? "flex-[2]" : "flex-1"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex gap-4 py-3 border-b border-border/50 last:border-0"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className={cn(
                      "h-4",
                      colIndex === 0 ? "flex-[2]" : "flex-1",
                      colIndex === columns - 1 && "w-20 flex-none"
                    )}
                  />
                ))}
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact table skeleton without card wrapper
 */
export function InlineTableSkeleton({
  rows = 3,
  columns = 4,
  className,
}: Pick<TableSkeletonProps, "rows" | "columns" | "className">) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn("h-4", colIndex === 0 ? "flex-[2]" : "flex-1")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
