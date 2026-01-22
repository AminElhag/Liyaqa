"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DetailSkeletonProps {
  /** Number of tabs to show */
  tabs?: number;
  /** Number of info rows in overview */
  infoRows?: number;
  /** Show action buttons in header */
  showActions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading state for detail/view pages.
 * Mimics the tabbed detail page layout with header and content.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <DetailSkeleton tabs={5} showActions />;
 * }
 * ```
 */
export function DetailSkeleton({
  tabs = 4,
  infoRows = 6,
  showActions = true,
  className,
}: DetailSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {/* Back button */}
          <Skeleton className="h-10 w-10 rounded-md" />

          <div className="space-y-2">
            {/* Title with badge */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {/* Subtitle/ID */}
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {Array.from({ length: tabs }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "h-10 w-24 rounded-none",
                index === 0 && "border-b-2 border-primary"
              )}
            />
          ))}
        </div>
      </div>

      {/* Tab Content - Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: infoRows }).map((_, index) => (
              <div key={index} className="flex justify-between py-2 border-b last:border-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Side Card */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Skeleton for a detail info card
 */
export function InfoCardSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex justify-between py-2 border-b last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for page header with back button
 */
export function PageHeaderSkeleton({
  showActions = true,
  className,
}: {
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {showActions && (
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}
