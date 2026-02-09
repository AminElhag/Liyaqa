import * as React from "react";
import { useSpring, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  /** The target number to animate to */
  value: number;
  /** CSS class for styling */
  className?: string;
  /** Number of decimal places to show */
  decimals?: number;
  /** Prefix (e.g., currency symbol) */
  prefix?: string;
  /** Suffix (e.g., %, SAR) */
  suffix?: string;
  /** Spring stiffness (higher = faster) */
  stiffness?: number;
  /** Spring damping (higher = less bouncy) */
  damping?: number;
  /** Duration override in seconds (disables spring) */
  duration?: number;
  /** Locale for number formatting */
  locale?: string;
  /** Whether to use compact notation (1K, 1M, etc.) */
  compact?: boolean;
}

/**
 * Animated number counter with spring physics.
 * Numbers smoothly animate from 0 (or previous value) to the target value.
 */
export function AnimatedNumber({
  value,
  className,
  decimals = 0,
  prefix = "",
  suffix = "",
  stiffness = 100,
  damping = 30,
  duration,
  locale = "en-US",
  compact = false,
}: AnimatedNumberProps) {
  const springConfig = duration
    ? { duration: duration * 1000 }
    : { stiffness, damping };

  const spring = useSpring(0, springConfig);

  // Update spring target when value changes
  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const display = useTransform(spring, (current: number) => {
    if (compact) {
      return formatCompact(current, locale);
    }
    return formatNumber(current, decimals, locale);
  });

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <AnimatedSpan value={display} />
      {suffix}
    </span>
  );
}

/**
 * Simple animated span that subscribes to a MotionValue
 */
function AnimatedSpan({ value }: { value: MotionValue<string> }) {
  const [displayValue, setDisplayValue] = React.useState("");

  React.useEffect(() => {
    const unsubscribe = value.on("change", (latest) => {
      setDisplayValue(latest);
    });
    return unsubscribe;
  }, [value]);

  return <>{displayValue}</>;
}

/**
 * Format number with locale-aware formatting
 */
function formatNumber(value: number, decimals: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format number with compact notation (1K, 1M, etc.)
 */
function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
  }).format(value);
}

interface AnimatedPercentageProps {
  /** The percentage value (0-100) */
  value: number;
  /** CSS class for styling */
  className?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Show positive/negative sign */
  showSign?: boolean;
  /** Color based on positive/negative */
  colorCode?: boolean;
}

/**
 * Animated percentage display with optional sign and color coding.
 */
export function AnimatedPercentage({
  value,
  className,
  decimals = 1,
  showSign = false,
  colorCode = false,
}: AnimatedPercentageProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const display = useTransform(spring, (current: number) => {
    const sign = showSign && current > 0 ? "+" : "";
    return `${sign}${current.toFixed(decimals)}%`;
  });

  const colorClass = colorCode
    ? value > 0
      ? "text-green-600"
      : value < 0
      ? "text-red-600"
      : "text-muted-foreground"
    : "";

  return (
    <span className={cn("tabular-nums", colorClass, className)}>
      <AnimatedSpan value={display} />
    </span>
  );
}

interface AnimatedCurrencyProps {
  /** The currency amount */
  value: number;
  /** Currency code (SAR, USD, etc.) */
  currency?: string;
  /** CSS class for styling */
  className?: string;
  /** Locale for formatting */
  locale?: string;
  /** Whether to use compact notation (1K, 1M, etc.) */
  compact?: boolean;
}

/**
 * Animated currency display with locale-aware formatting.
 */
export function AnimatedCurrency({
  value,
  currency = "SAR",
  className,
  locale = "en-SA",
  compact = false,
}: AnimatedCurrencyProps) {
  const spring = useSpring(0, { stiffness: 100, damping: 30 });

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const display = useTransform(spring, (current: number) => {
    if (compact) {
      // Compact notation with currency
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        notation: "compact",
        compactDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(current);
    }
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(current);
  });

  return (
    <span className={cn("tabular-nums", className)}>
      <AnimatedSpan value={display} />
    </span>
  );
}

export { AnimatedSpan };
