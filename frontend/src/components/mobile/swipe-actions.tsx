"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface SwipeAction {
  label: string;
  icon?: React.ReactNode;
  color: string;
  textColor?: string;
  onAction: () => void;
}

interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  actionWidth?: number;
  disabled?: boolean;
  className?: string;
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  actionWidth = 80,
  disabled = false,
  className,
}: SwipeActionsProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = React.useState(0);
  const [isSwiping, setIsSwiping] = React.useState(false);
  const touchStartX = React.useRef(0);
  const currentTranslateX = React.useRef(0);

  // In RTL mode, swap left and right actions
  const effectiveLeftActions = isRtl ? rightActions : leftActions;
  const effectiveRightActions = isRtl ? leftActions : rightActions;

  const maxLeftSwipe = effectiveLeftActions.length * actionWidth;
  const maxRightSwipe = effectiveRightActions.length * actionWidth;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    currentTranslateX.current = translateX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !isSwiping) return;

    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    let newTranslateX = currentTranslateX.current + diff;

    // Limit swipe distance with resistance
    if (newTranslateX > 0) {
      // Swiping right (revealing left actions)
      if (effectiveLeftActions.length === 0) {
        newTranslateX = Math.min(newTranslateX * 0.3, 30); // Resistance if no left actions
      } else {
        newTranslateX = Math.min(newTranslateX, maxLeftSwipe + 20); // Allow slight overswipe
      }
    } else {
      // Swiping left (revealing right actions)
      if (effectiveRightActions.length === 0) {
        newTranslateX = Math.max(newTranslateX * 0.3, -30); // Resistance if no right actions
      } else {
        newTranslateX = Math.max(newTranslateX, -(maxRightSwipe + 20)); // Allow slight overswipe
      }
    }

    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = () => {
    if (disabled || !isSwiping) return;
    setIsSwiping(false);

    // Snap to open or closed position
    if (translateX > maxLeftSwipe * 0.5 && effectiveLeftActions.length > 0) {
      setTranslateX(maxLeftSwipe);
    } else if (translateX < -(maxRightSwipe * 0.5) && effectiveRightActions.length > 0) {
      setTranslateX(-maxRightSwipe);
    } else {
      setTranslateX(0);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onAction();
    setTranslateX(0);
  };

  const closeActions = () => {
    setTranslateX(0);
  };

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeActions();
      }
    };

    if (translateX !== 0) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [translateX]);

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Left Actions */}
      {effectiveLeftActions.length > 0 && (
        <div
          className="absolute inset-y-0 left-0 flex items-stretch"
          style={{ width: maxLeftSwipe }}
        >
          {effectiveLeftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex flex-col items-center justify-center touch-manipulation",
                action.textColor || "text-white"
              )}
              style={{
                width: actionWidth,
                backgroundColor: action.color,
              }}
            >
              {action.icon}
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right Actions */}
      {effectiveRightActions.length > 0 && (
        <div
          className="absolute inset-y-0 right-0 flex items-stretch"
          style={{ width: maxRightSwipe }}
        >
          {effectiveRightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                "flex flex-col items-center justify-center touch-manipulation",
                action.textColor || "text-white"
              )}
              style={{
                width: actionWidth,
                backgroundColor: action.color,
              }}
            >
              {action.icon}
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="relative bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
