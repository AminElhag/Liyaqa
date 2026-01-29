"use client";

import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useEngagementBadge } from "@/queries/use-engagement";
import type { RiskLevel } from "@/lib/api/engagement";

interface EngagementBadgeProps {
  memberId: string;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

const riskLevelConfig: Record<
  RiskLevel,
  { color: string; bgColor: string; icon: React.ReactNode; labelEn: string; labelAr: string }
> = {
  LOW: {
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    icon: <CheckCircle className="h-3 w-3" />,
    labelEn: "Excellent",
    labelAr: "ممتاز",
  },
  MEDIUM: {
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: <TrendingUp className="h-3 w-3" />,
    labelEn: "Good",
    labelAr: "جيد",
  },
  HIGH: {
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    icon: <TrendingDown className="h-3 w-3" />,
    labelEn: "At Risk",
    labelAr: "معرض للخطر",
  },
  CRITICAL: {
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    icon: <AlertTriangle className="h-3 w-3" />,
    labelEn: "Critical",
    labelAr: "حرج",
  },
};

const sizeConfig = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

export function EngagementBadge({ memberId, showScore = true, size = "md" }: EngagementBadgeProps) {
  const locale = useLocale();
  const { data: badge, isLoading } = useEngagementBadge(memberId);

  const texts = {
    engagement: locale === "ar" ? "المشاركة" : "Engagement",
    score: locale === "ar" ? "النتيجة" : "Score",
    loading: locale === "ar" ? "جاري التحميل..." : "Loading...",
  };

  if (isLoading) {
    return <Skeleton className="h-6 w-20" />;
  }

  if (!badge) {
    return null;
  }

  const config = riskLevelConfig[badge.riskLevel];
  const label = locale === "ar" ? config.labelAr : config.labelEn;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`${config.bgColor} ${config.color} ${sizeConfig[size]} cursor-default`}
          >
            <span className="flex items-center gap-1">
              {config.icon}
              {showScore && <span className="font-semibold">{badge.score}</span>}
              <span>{label}</span>
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {texts.engagement} {texts.score}: {badge.score}/100
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Compact version for use in tables
export function EngagementScoreIndicator({ memberId }: { memberId: string }) {
  const { data: badge, isLoading } = useEngagementBadge(memberId);

  if (isLoading) {
    return <Skeleton className="h-5 w-5 rounded-full" />;
  }

  if (!badge) {
    return null;
  }

  const config = riskLevelConfig[badge.riskLevel];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center justify-center h-6 w-6 rounded-full ${config.bgColor} ${config.color}`}
          >
            <span className="text-xs font-semibold">{badge.score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{badge.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
