"use client";

import { useLocale } from "next-intl";
import { Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LoyaltyTier } from "@/types/loyalty";

interface LoyaltyTierBadgeProps {
  tier: LoyaltyTier;
  showIcon?: boolean;
  className?: string;
}

const tierConfig: Record<
  LoyaltyTier,
  { labelEn: string; labelAr: string; color: string; bgColor: string }
> = {
  BRONZE: {
    labelEn: "Bronze",
    labelAr: "برونزي",
    color: "text-amber-800",
    bgColor: "bg-amber-100 hover:bg-amber-100",
  },
  SILVER: {
    labelEn: "Silver",
    labelAr: "فضي",
    color: "text-gray-700",
    bgColor: "bg-gray-200 hover:bg-gray-200",
  },
  GOLD: {
    labelEn: "Gold",
    labelAr: "ذهبي",
    color: "text-yellow-800",
    bgColor: "bg-yellow-100 hover:bg-yellow-100",
  },
  PLATINUM: {
    labelEn: "Platinum",
    labelAr: "بلاتيني",
    color: "text-slate-700",
    bgColor: "bg-slate-200 hover:bg-slate-200",
  },
};

export function LoyaltyTierBadge({
  tier,
  showIcon = true,
  className = "",
}: LoyaltyTierBadgeProps) {
  const locale = useLocale();
  const config = tierConfig[tier];

  return (
    <Badge
      variant="secondary"
      className={`${config.bgColor} ${config.color} ${className}`}
    >
      {showIcon && <Award className="mr-1 h-3 w-3" />}
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}

export function getTierLabel(tier: LoyaltyTier, locale: string): string {
  return locale === "ar" ? tierConfig[tier].labelAr : tierConfig[tier].labelEn;
}
