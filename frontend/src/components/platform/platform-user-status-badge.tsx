"use client";

import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PlatformUserStatus } from "@/types/platform/platform-user";

interface PlatformUserStatusBadgeProps {
  status: PlatformUserStatus;
}

const STATUS_CONFIG: Record<
  PlatformUserStatus,
  {
    labelEn: string;
    labelAr: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    variant: "default",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  INACTIVE: {
    labelEn: "Inactive",
    labelAr: "غير نشط",
    variant: "secondary",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  SUSPENDED: {
    labelEn: "Suspended",
    labelAr: "موقوف",
    variant: "destructive",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
  },
};

export function PlatformUserStatusBadge({
  status,
}: PlatformUserStatusBadgeProps) {
  const locale = useLocale();
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
