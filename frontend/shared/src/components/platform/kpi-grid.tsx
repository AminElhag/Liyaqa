"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

export interface KPIItem {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  loading?: boolean;
  delay?: number;
}

const trendConfig = {
  up: { icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
  down: { icon: TrendingDown, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted" },
};

function StatCard({ label, value, change, trend = "neutral", icon: Icon, loading, delay = 0 }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-7 w-28 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
      </div>
    );
  }

  const trendInfo = trendConfig[trend];
  const TrendIcon = trendInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {Icon && (
          <div className="rounded-lg bg-muted p-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {change !== undefined && (
        <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium", trendInfo.color)}>
          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5", trendInfo.bg)}>
            <TrendIcon className="h-3 w-3" />
          </span>
          <span>{change > 0 ? "+" : ""}{change}%</span>
        </div>
      )}
    </motion.div>
  );
}

interface KPIGridProps {
  items: KPIItem[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function KPIGrid({ items, loading, columns = 4 }: KPIGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.05, delayChildren: 0.1 },
        },
      }}
      className={cn("grid gap-4", columnClasses[columns])}
    >
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <StatCard key={i} label="" value="" loading />
          ))
        : items.map((item, i) => (
            <StatCard key={item.label} {...item} delay={i * 0.05} />
          ))}
    </motion.div>
  );
}
