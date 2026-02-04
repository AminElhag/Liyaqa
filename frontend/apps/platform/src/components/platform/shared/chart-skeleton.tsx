"use client";

import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@liyaqa/shared/components/ui/card";
import { cn } from "@liyaqa/shared/utils";

interface ChartSkeletonProps {
  /** Type of chart to mimic */
  type?: "line" | "bar" | "pie" | "area";
  /** Height of the chart area */
  height?: number;
  /** Show legend below chart */
  showLegend?: boolean;
  /** Show title and description */
  showHeader?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading state for chart components.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <ChartSkeleton type="line" height={300} showLegend />;
 * }
 * ```
 */
export function ChartSkeleton({
  type = "line",
  height = 300,
  showLegend = true,
  showHeader = true,
  className,
}: ChartSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60 mt-1" />
        </CardHeader>
      )}
      <CardContent>
        {/* Chart Area */}
        <div
          className="relative w-full flex items-end justify-around gap-2"
          style={{ height }}
        >
          {type === "bar" || type === "area" ? (
            // Bar/Area chart skeleton
            <>
              {Array.from({ length: 7 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${Math.random() * 60 + 30}%`,
                  }}
                />
              ))}
            </>
          ) : type === "pie" ? (
            // Pie chart skeleton
            <div className="flex items-center justify-center w-full">
              <Skeleton className="h-48 w-48 rounded-full" />
            </div>
          ) : (
            // Line chart skeleton
            <div className="absolute inset-0 flex flex-col justify-between py-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-px w-full opacity-30" />
              ))}
              {/* Simulated line path */}
              <div className="absolute bottom-8 left-0 right-0 flex items-end justify-around">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="w-2 rounded-full"
                    style={{
                      height: `${Math.random() * 150 + 50}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Mini chart skeleton for inline stats
 */
export function MiniChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("h-16 flex items-end gap-1", className)}>
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-t"
          style={{ height: `${Math.random() * 60 + 20}%` }}
        />
      ))}
    </div>
  );
}
