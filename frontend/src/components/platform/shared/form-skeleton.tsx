"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FormSkeletonProps {
  /** Number of form sections (cards) */
  sections?: number;
  /** Number of fields per section */
  fieldsPerSection?: number;
  /** Show submit buttons */
  showButtons?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading state for form pages.
 * Mimics the multi-section card-based form layout.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <FormSkeleton sections={4} fieldsPerSection={3} />;
 * }
 * ```
 */
export function FormSkeleton({
  sections = 3,
  fieldsPerSection = 4,
  showButtons = true,
  className,
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Sections */}
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Form Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
                <div key={fieldIndex} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Submit Buttons */}
      {showButtons && (
        <div className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
}

/**
 * Single form field skeleton
 */
export function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/**
 * Form section skeleton (single card)
 */
export function FormSectionSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: fields }).map((_, index) => (
            <FormFieldSkeleton key={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
