"use client";

import { motion } from "framer-motion";
import { type LucideIcon, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";

export type TimelineType = "create" | "update" | "delete" | "access";

export interface TimelineItem {
  id: string;
  timestamp: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  type: TimelineType;
}

interface TimelineProps {
  items: TimelineItem[];
}

const typeConfig: Record<TimelineType, { color: string; bg: string; defaultIcon: LucideIcon }> = {
  create: { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", defaultIcon: Plus },
  update: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", defaultIcon: Pencil },
  delete: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30", defaultIcon: Trash2 },
  access: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", defaultIcon: Eye },
};

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute start-5 top-0 h-full w-px bg-border" />
      <div className="space-y-1">
        {items.map((item, i) => {
          const config = typeConfig[item.type];
          const Icon = item.icon ?? config.defaultIcon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative flex gap-4 py-3 ps-0"
            >
              <div className={cn("relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <time className="shrink-0 text-xs text-muted-foreground">{item.timestamp}</time>
                </div>
                {item.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
