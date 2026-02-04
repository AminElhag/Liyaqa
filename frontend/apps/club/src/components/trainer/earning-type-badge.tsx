"use client";

import { useLocale } from "next-intl";
import { Dumbbell, Users, Gift, TrendingUp, Settings } from "lucide-react";
import type { EarningType } from "@liyaqa/shared/types/trainer-portal";
import { cn } from "@liyaqa/shared/utils";

interface EarningTypeBadgeProps {
  type: EarningType;
}

const typeConfig: Record<
  EarningType,
  {
    labelEn: string;
    labelAr: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  PT_SESSION: {
    labelEn: "PT Session",
    labelAr: "جلسة تدريب شخصي",
    icon: Dumbbell,
    color: "text-blue-600",
  },
  CLASS_SESSION: {
    labelEn: "Class",
    labelAr: "جلسة جماعية",
    icon: Users,
    color: "text-purple-600",
  },
  BONUS: {
    labelEn: "Bonus",
    labelAr: "مكافأة",
    icon: Gift,
    color: "text-green-600",
  },
  COMMISSION: {
    labelEn: "Commission",
    labelAr: "عمولة",
    icon: TrendingUp,
    color: "text-amber-600",
  },
  ADJUSTMENT: {
    labelEn: "Adjustment",
    labelAr: "تعديل",
    icon: Settings,
    color: "text-slate-600",
  },
};

export function EarningTypeBadge({ type }: EarningTypeBadgeProps) {
  const locale = useLocale();
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="text-sm">
        {locale === "ar" ? config.labelAr : config.labelEn}
      </span>
    </div>
  );
}
