"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Shield, UserCog, Headset } from "lucide-react";
import type { PlatformUserRole } from "@liyaqa/shared/types/platform/platform-user";

interface PlatformUserRoleBadgeProps {
  role: PlatformUserRole;
  showIcon?: boolean;
}

const ROLE_CONFIG: Record<
  PlatformUserRole,
  {
    labelEn: string;
    labelAr: string;
    className: string;
    icon: typeof Shield;
  }
> = {
  PLATFORM_ADMIN: {
    labelEn: "Platform Admin",
    labelAr: "مدير المنصة",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    icon: Shield,
  },
  SALES_REP: {
    labelEn: "Sales Rep",
    labelAr: "مندوب مبيعات",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: UserCog,
  },
  SUPPORT_REP: {
    labelEn: "Support Rep",
    labelAr: "مندوب دعم",
    className: "bg-teal-100 text-teal-700 hover:bg-teal-100",
    icon: Headset,
  },
};

export function PlatformUserRoleBadge({
  role,
  showIcon = false,
}: PlatformUserRoleBadgeProps) {
  const locale = useLocale();
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  return (
    <Badge variant="secondary" className={config.className}>
      {showIcon && <Icon className="me-1 h-3 w-3" />}
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
