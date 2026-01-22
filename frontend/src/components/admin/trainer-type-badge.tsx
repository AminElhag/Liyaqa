"use client";

import { useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dumbbell, Users, Star, Layers } from "lucide-react";
import type { TrainerType } from "@/types/trainer";

/**
 * Type configuration for trainer types.
 */
export const TRAINER_TYPE_CONFIG: Record<
  TrainerType,
  {
    labelEn: string;
    labelAr: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PERSONAL_TRAINER: {
    labelEn: "Personal Trainer",
    labelAr: "مدرب شخصي",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Dumbbell,
  },
  GROUP_FITNESS: {
    labelEn: "Group Fitness",
    labelAr: "لياقة جماعية",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Users,
  },
  SPECIALIST: {
    labelEn: "Specialist",
    labelAr: "متخصص",
    className: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Star,
  },
  HYBRID: {
    labelEn: "Hybrid",
    labelAr: "متعدد",
    className: "bg-teal-100 text-teal-700 border-teal-200",
    icon: Layers,
  },
};

interface TrainerTypeBadgeProps {
  type: TrainerType;
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge component displaying trainer type.
 */
export function TrainerTypeBadge({ type, showIcon = false, className }: TrainerTypeBadgeProps) {
  const locale = useLocale();
  const config = TRAINER_TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, "gap-1", className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {locale === "ar" ? config.labelAr : config.labelEn}
    </Badge>
  );
}
