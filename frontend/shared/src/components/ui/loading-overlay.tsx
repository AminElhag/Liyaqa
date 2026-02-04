"use client";

import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Locale for RTL support */
  locale?: string;
  /** Additional CSS classes */
  className?: string;
  /** Overlay style: fullscreen or relative to parent */
  variant?: "fullscreen" | "relative";
  /** Spinner size */
  size?: "sm" | "md" | "lg";
}

/**
 * Loading overlay component that covers content during async operations.
 * Shows a spinner with optional message.
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <LoadingOverlay isLoading={isPending} message="Saving..." />
 *   <YourContent />
 * </div>
 * ```
 */
export function LoadingOverlay({
  isLoading,
  message,
  locale = "en",
  className,
  variant = "relative",
  size = "md",
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  const isRtl = locale === "ar";
  const defaultMessage = isRtl ? "جاري التحميل..." : "Loading...";

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 z-50",
        variant === "fullscreen"
          ? "fixed inset-0 bg-background/80 backdrop-blur-sm"
          : "absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg",
        className
      )}
      dir={isRtl ? "rtl" : "ltr"}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {(message || defaultMessage) && (
        <p className={cn("text-muted-foreground", textSizeClasses[size])}>
          {message || defaultMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Inline loading spinner for buttons and small areas
 */
interface InlineSpinnerProps {
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function InlineSpinner({ size = "sm", className }: InlineSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <Loader2
      className={cn("animate-spin", sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

/**
 * Full page loading state for initial page loads
 */
interface PageLoadingProps {
  message?: string;
  locale?: string;
}

export function PageLoading({ message, locale = "en" }: PageLoadingProps) {
  const isRtl = locale === "ar";
  const defaultMessage = isRtl ? "جاري تحميل الصفحة..." : "Loading page...";

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] gap-4"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
        <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-primary" />
      </div>
      <p className="text-muted-foreground text-sm">{message || defaultMessage}</p>
    </div>
  );
}
