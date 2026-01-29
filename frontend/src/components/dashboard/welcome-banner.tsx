"use client";

import { useLocale } from "next-intl";
import { CalendarDays, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ClubHealthScore } from "./club-health-score";

interface WelcomeBannerProps {
  healthScore?: number;
  healthTrend?: "up" | "down" | "stable";
  isLoading?: boolean;
}

export function WelcomeBanner({ healthScore, healthTrend, isLoading }: WelcomeBannerProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { user } = useAuthStore();

  // Get display name
  const displayName = user?.displayName
    ? locale === "ar" && user.displayName.ar
      ? user.displayName.ar
      : user.displayName.en
    : "Admin";

  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (locale === "ar") {
      if (hour < 12) return "صباح الخير";
      if (hour < 17) return "مساء الخير";
      return "مساء الخير";
    }
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString(
    locale === "ar" ? "ar-SA" : "en-SA",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  const texts = {
    greeting: getGreeting(),
    subtitle: locale === "ar"
      ? "إليك نظرة عامة على نشاط ناديك اليوم"
      : "Here's an overview of your club's activity today",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md3-lg p-6",
        "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
        "border border-primary/10"
      )}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-primary/5 blur-2xl" />

      <div
        className={cn(
          "relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between",
          isRtl && "lg:flex-row-reverse"
        )}
      >
        {/* Left side - Greeting */}
        <div className={cn("flex-1", isRtl && "text-right")}>
          <div className={cn("flex items-center gap-2 mb-2", isRtl && "flex-row-reverse justify-end")}>
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">{texts.greeting}</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {displayName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            {texts.subtitle}
          </p>

          {/* Date display */}
          <div
            className={cn(
              "flex items-center gap-2 mt-4 text-sm text-muted-foreground",
              isRtl && "flex-row-reverse justify-end"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            <span>{todayFormatted}</span>
          </div>
        </div>

        {/* Right side - Club Health Score */}
        <div className={cn("shrink-0", isRtl && "self-start lg:self-center")}>
          <ClubHealthScore
            score={healthScore}
            trend={healthTrend}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
