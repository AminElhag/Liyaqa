"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RadialGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
  className?: string;
  animated?: boolean;
}

export function RadialGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = "hsl(var(--primary))",
  trackColor = "hsl(var(--muted))",
  label,
  sublabel,
  showValue = true,
  valueFormatter = (v) => `${Math.round(v)}%`,
  className,
  animated = true,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  // Determine color based on value thresholds
  const getStatusColor = () => {
    if (color !== "hsl(var(--primary))") return color;
    if (percentage >= 0.8) return "#22c55e"; // green
    if (percentage >= 0.6) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const statusColor = getStatusColor();

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            className="font-display text-2xl font-bold"
            style={{ color: statusColor }}
            initial={animated ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {valueFormatter(value)}
          </motion.span>
        )}
        {label && (
          <span className="text-xs font-medium text-muted-foreground mt-1">
            {label}
          </span>
        )}
      </div>

      {/* Sublabel below gauge */}
      {sublabel && (
        <span className="text-sm font-medium mt-2" style={{ color: statusColor }}>
          {sublabel}
        </span>
      )}
    </div>
  );
}

// Mini version for inline use
interface MiniGaugeProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  className?: string;
}

export function MiniGauge({
  value,
  max = 100,
  size = 32,
  color,
  className,
}: MiniGaugeProps) {
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - percentage * circumference;

  const getColor = () => {
    if (color) return color;
    if (percentage >= 0.8) return "#22c55e";
    if (percentage >= 0.6) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("transform -rotate-90", className)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
        className="opacity-20"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={getColor()}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
}
