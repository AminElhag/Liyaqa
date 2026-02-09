"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";
import type { ClientSubscriptionStatus } from "@liyaqa/shared/types/platform/client-subscription";

/**
 * Status configuration for client subscriptions.
 * Colors: TRIAL (blue), ACTIVE (green), SUSPENDED (amber), CANCELLED (red), EXPIRED (gray)
 */
export const SUBSCRIPTION_STATUS_CONFIG: Record<
  ClientSubscriptionStatus,
  {
    labelEn: string;
    labelAr: string;
    className: string;
  }
> = {
  TRIAL: {
    labelEn: "Trial",
    labelAr: "تجريبي",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  SUSPENDED: {
    labelEn: "Suspended",
    labelAr: "موقوف",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CANCELLED: {
    labelEn: "Cancelled",
    labelAr: "ملغي",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  EXPIRED: {
    labelEn: "Expired",
    labelAr: "منتهي",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

interface SubscriptionStatusBadgeProps {
  status: ClientSubscriptionStatus;
  className?: string;
}

/**
 * Badge component displaying client subscription status with bilingual labels.
 */
export function SubscriptionStatusBadge({
  status,
  className,
}: SubscriptionStatusBadgeProps) {
  const locale = useLocale();
  const config = SUBSCRIPTION_STATUS_CONFIG[status];

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
