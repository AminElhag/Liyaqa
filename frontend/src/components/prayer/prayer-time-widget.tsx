"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Moon, Sun, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayPrayerTimes, useNextPrayer, useCheckInStatus } from "@/queries/use-prayer-times";
import { PRAYER_NAMES, type PrayerName, type PrayerTimeResponse } from "@/types/prayer-time";
import { cn } from "@/lib/utils";

interface PrayerTimeWidgetProps {
  clubId: string;
  showCheckInStatus?: boolean;
  className?: string;
}

const PRAYER_ORDER: PrayerName[] = ["FAJR", "SUNRISE", "DHUHR", "ASR", "MAGHRIB", "ISHA"];

export function PrayerTimeWidget({
  clubId,
  showCheckInStatus = true,
  className,
}: PrayerTimeWidgetProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: prayerTimes, isLoading: loadingTimes } = useTodayPrayerTimes(clubId);
  const { data: nextPrayer, isLoading: loadingNext } = useNextPrayer(clubId);
  const { data: checkInStatus } = useCheckInStatus(clubId);

  const texts = {
    title: isArabic ? "مواقيت الصلاة" : "Prayer Times",
    next: isArabic ? "الصلاة القادمة" : "Next Prayer",
    checkInBlocked: isArabic ? "تسجيل الدخول متوقف" : "Check-in Paused",
    notConfigured: isArabic ? "لم يتم تكوين مواقيت الصلاة" : "Prayer times not configured",
  };

  const prayerTimesList = useMemo(() => {
    if (!prayerTimes) return [];

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return PRAYER_ORDER.map((name) => {
      const timeKey = name.toLowerCase() as keyof PrayerTimeResponse;
      const time = prayerTimes[timeKey] as string;
      const isPast = time < currentTime;
      const isNext = nextPrayer?.name === name;

      return {
        name,
        nameEn: PRAYER_NAMES[name].en,
        nameAr: PRAYER_NAMES[name].ar,
        time,
        isPast,
        isNext,
      };
    });
  }, [prayerTimes, nextPrayer]);

  if (loadingTimes || loadingNext) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prayerTimes) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{texts.notConfigured}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5 text-primary" />
            {texts.title}
          </CardTitle>
          {showCheckInStatus && checkInStatus?.blocked && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {texts.checkInBlocked}
            </Badge>
          )}
        </div>
        {nextPrayer && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {texts.next}: {isArabic ? PRAYER_NAMES[nextPrayer.name].ar : PRAYER_NAMES[nextPrayer.name].en}{" "}
            ({nextPrayer.time})
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {prayerTimesList.map((prayer) => (
            <div
              key={prayer.name}
              className={cn(
                "flex items-center justify-between py-2 px-3 rounded-md transition-colors",
                prayer.isNext && "bg-primary/10 border border-primary/20",
                prayer.isPast && !prayer.isNext && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                {prayer.name === "SUNRISE" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-primary" />
                )}
                <span className={cn("font-medium", prayer.isNext && "text-primary")}>
                  {isArabic ? prayer.nameAr : prayer.nameEn}
                </span>
                {prayer.isNext && (
                  <Badge variant="secondary" className="text-xs">
                    {texts.next}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "font-mono text-sm",
                  prayer.isNext ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {prayer.time}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
