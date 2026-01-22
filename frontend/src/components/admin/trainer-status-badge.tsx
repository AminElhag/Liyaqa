"use client";

import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TrainerStatus } from "@/types/trainer";

/**
 * Status configuration for trainer statuses.
 */
export const TRAINER_STATUS_CONFIG: Record<
  TrainerStatus,
  {
    labelEn: string;
    labelAr: string;
    className: string;
  }
> = {
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  INACTIVE: {
    labelEn: "Inactive",
    labelAr: "غير نشط",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  ON_LEAVE: {
    labelEn: "On Leave",
    labelAr: "في إجازة",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  TERMINATED: {
    labelEn: "Terminated",
    labelAr: "منهي",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

interface TrainerStatusBadgeProps {
  status: TrainerStatus;
  className?: string;
}

/**
 * Badge component displaying trainer status.
 */
export function TrainerStatusBadge({ status, className }: TrainerStatusBadgeProps) {
  const locale = useLocale();
  const config = TRAINER_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
