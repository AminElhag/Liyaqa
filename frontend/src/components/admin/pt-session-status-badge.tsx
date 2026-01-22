"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import type { PTSessionStatus } from "@/types/pt-session";

interface PTSessionStatusBadgeProps {
  status: PTSessionStatus;
}

const STATUS_CONFIG: Record<PTSessionStatus, { en: string; ar: string; variant: string }> = {
  REQUESTED: { en: "Requested", ar: "مطلوب", variant: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكد", variant: "bg-green-100 text-green-700 hover:bg-green-100" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ", variant: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  COMPLETED: { en: "Completed", ar: "مكتمل", variant: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
  CANCELLED: { en: "Cancelled", ar: "ملغي", variant: "bg-red-100 text-red-700 hover:bg-red-100" },
  NO_SHOW: { en: "No Show", ar: "لم يحضر", variant: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
};

export function PTSessionStatusBadge({ status }: PTSessionStatusBadgeProps) {
  const locale = useLocale();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;

  return (
    <Badge variant="outline" className={config.variant}>
      {locale === "ar" ? config.ar : config.en}
    </Badge>
  );
}
