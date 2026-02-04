"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";

/**
 * Status configuration for client plan active/inactive states.
 */
export const PLAN_STATUS_CONFIG: Record<
  "ACTIVE" | "INACTIVE",
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
};

interface PlanStatusBadgeProps {
  isActive: boolean;
  className?: string;
}

/**
 * Badge component displaying client plan active/inactive status.
 */
export function PlanStatusBadge({ isActive, className }: PlanStatusBadgeProps) {
  const locale = useLocale();
  const status = isActive ? "ACTIVE" : "INACTIVE";
  const config = PLAN_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
