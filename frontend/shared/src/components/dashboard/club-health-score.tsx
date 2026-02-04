"use client";

import { useLocale } from "next-intl";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface ClubHealthScoreProps {
  score?: number;
  trend?: "up" | "down" | "stable";
  isLoading?: boolean;
}

function getScoreColor(score: number): { text: string; bg: string; ring: string } {
  if (score >= 80) {
    return {
      text: "text-green-600",
      bg: "bg-green-500",
      ring: "ring-green-500/30",
    };
  }
  if (score >= 60) {
    return {
      text: "text-yellow-600",
      bg: "bg-yellow-500",
      ring: "ring-yellow-500/30",
    };
  }
  if (score >= 40) {
    return {
      text: "text-orange-600",
      bg: "bg-orange-500",
      ring: "ring-orange-500/30",
    };
  }
  return {
    text: "text-red-600",
    bg: "bg-red-500",
    ring: "ring-red-500/30",
  };
}

function getScoreLabel(score: number, locale: string): string {
  if (locale === "ar") {
    if (score >= 80) return "ممتاز";
    if (score >= 60) return "جيد";
    if (score >= 40) return "متوسط";
    return "يحتاج تحسين";
  }
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Attention";
}

export function ClubHealthScore({ score = 75, trend = "stable", isLoading }: ClubHealthScoreProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "صحة النادي" : "Club Health",
    tooltip: locale === "ar"
      ? "درجة صحة النادي تعكس أداء النادي بناءً على الحضور والإيرادات والاحتفاظ بالأعضاء"
      : "Club health score reflects overall performance based on attendance, revenue, and member retention",
    up: locale === "ar" ? "مرتفع" : "Trending up",
    down: locale === "ar" ? "منخفض" : "Trending down",
    stable: locale === "ar" ? "مستقر" : "Stable",
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2 p-4 animate-pulse">
        <div className="h-20 w-20 rounded-full bg-muted" />
        <div className="h-4 w-16 rounded bg-muted" />
      </div>
    );
  }

  const colors = getScoreColor(score);
  const label = getScoreLabel(score, locale);
  const trendText = trend === "up" ? texts.up : trend === "down" ? texts.down : texts.stable;

  // Calculate circumference for progress ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col items-center gap-3", isRtl && "items-center")}>
        {/* Title with tooltip */}
        <div className={cn("flex items-center gap-1.5 text-sm text-muted-foreground", isRtl && "flex-row-reverse")}>
          <span className="font-medium">{texts.title}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{texts.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Circular progress indicator */}
        <div className="relative">
          <svg width="96" height="96" className="-rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={cn("transition-all duration-1000 ease-out", colors.text)}
            />
          </svg>
          {/* Score number in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-display text-2xl font-bold", colors.text)}>
              {score}
            </span>
          </div>
        </div>

        {/* Label and trend */}
        <div className="flex flex-col items-center gap-1">
          <span className={cn("text-sm font-medium", colors.text)}>{label}</span>
          <div className={cn("flex items-center gap-1 text-xs text-muted-foreground", isRtl && "flex-row-reverse")}>
            {trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
            {trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
            {trend === "stable" && <Minus className="h-3 w-3" />}
            <span>{trendText}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
