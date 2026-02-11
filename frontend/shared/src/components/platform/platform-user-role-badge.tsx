"use client";

import { useLocale } from "next-intl";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Shield, ShieldCheck, UserCog, Headset, HeadphonesIcon, Eye } from "lucide-react";
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
  PLATFORM_SUPER_ADMIN: {
    labelEn: "Super Admin",
    labelAr: "مدير أعلى",
    className: "bg-red-100 text-red-700 hover:bg-red-100",
    icon: ShieldCheck,
  },
  PLATFORM_ADMIN: {
    labelEn: "Platform Admin",
    labelAr: "مدير المنصة",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    icon: Shield,
  },
  ACCOUNT_MANAGER: {
    labelEn: "Account Manager",
    labelAr: "مدير حسابات",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: UserCog,
  },
  SUPPORT_LEAD: {
    labelEn: "Support Lead",
    labelAr: "مشرف الدعم",
    className: "bg-teal-100 text-teal-700 hover:bg-teal-100",
    icon: Headset,
  },
  SUPPORT_AGENT: {
    labelEn: "Support Agent",
    labelAr: "وكيل دعم",
    className: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
    icon: HeadphonesIcon,
  },
  PLATFORM_VIEWER: {
    labelEn: "Viewer",
    labelAr: "مشاهد",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    icon: Eye,
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
