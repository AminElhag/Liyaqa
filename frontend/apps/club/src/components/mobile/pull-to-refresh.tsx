"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { RefreshCw, ArrowDown } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const touchStartY = React.useRef(0);
  const isAtTop = React.useRef(true);

  const texts = {
    pullToRefresh: isRtl ? "اسحب للتحديث" : "Pull to refresh",
    releaseToRefresh: isRtl ? "حرر للتحديث" : "Release to refresh",
    refreshing: isRtl ? "جاري التحديث..." : "Refreshing...",
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      isAtTop.current = true;
      touchStartY.current = e.touches[0].clientY;
    } else {
      isAtTop.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || !isAtTop.current) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - touchStartY.current;

    if (distance > 0) {
      setIsPulling(true);
      // Apply resistance
      const resistance = 0.5;
      const newDistance = Math.min(distance * resistance, threshold * 1.5);
      setPullDistance(newDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing || !isPulling) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setIsPulling(false);
  };

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;
  const canRelease = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex flex-col items-center justify-center transition-opacity duration-200",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -60,
          height: 60,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center h-10 w-10 rounded-full",
            "bg-white shadow-md transition-all",
            isRefreshing && "animate-pulse"
          )}
          style={{
            transform: `rotate(${progress * 180}deg)`,
          }}
        >
          {isRefreshing ? (
            <RefreshCw className="h-5 w-5 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "h-5 w-5 transition-colors",
                canRelease ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {isRefreshing
            ? texts.refreshing
            : canRelease
            ? texts.releaseToRefresh
            : texts.pullToRefresh}
        </span>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
