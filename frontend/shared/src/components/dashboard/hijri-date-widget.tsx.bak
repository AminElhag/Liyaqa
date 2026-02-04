"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import { Calendar, Moon, Star } from "lucide-react";
import { useTodayHijri, useUpcomingEvents, useRamadanInfo } from "../../queries/use-calendar";
import { getRelativeTimeDescription } from "../../lib/utils/hijri";

const TEXTS = {
  en: {
    title: "Islamic Calendar",
    today: "Today",
    gregorian: "Gregorian",
    hijri: "Hijri",
    upcomingEvents: "Upcoming Events",
    noUpcomingEvents: "No upcoming events",
    publicHoliday: "Public Holiday",
    ramadan: "Ramadan",
    daysUntilRamadan: "Days until Ramadan",
    inRamadan: "Currently in Ramadan",
  },
  ar: {
    title: "التقويم الهجري",
    today: "اليوم",
    gregorian: "ميلادي",
    hijri: "هجري",
    upcomingEvents: "الأحداث القادمة",
    noUpcomingEvents: "لا توجد أحداث قادمة",
    publicHoliday: "إجازة رسمية",
    ramadan: "رمضان",
    daysUntilRamadan: "أيام حتى رمضان",
    inRamadan: "نحن الآن في رمضان",
  },
};

export function HijriDateWidget() {
  const locale = useLocale() as "en" | "ar";
  const texts = TEXTS[locale];

  const { data: todayHijri, isLoading: isLoadingToday } = useTodayHijri();
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useUpcomingEvents(60);
  const { data: ramadanInfo } = useRamadanInfo();

  if (isLoadingToday) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Moon className="h-5 w-5" />
            {texts.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Moon className="h-5 w-5" />
          {texts.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Date */}
        {todayHijri && (
          <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4">
            <div className="text-sm text-muted-foreground mb-1">{texts.today}</div>
            <div className="text-2xl font-bold">
              {locale === "ar"
                ? todayHijri.hijriDateFormattedAr
                : todayHijri.hijriDateFormattedEn}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {todayHijri.gregorianDate}
            </div>
          </div>
        )}

        {/* Ramadan Info */}
        {ramadanInfo && (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Star className="h-5 w-5 text-amber-500" />
            <div className="flex-1">
              {ramadanInfo.isCurrentlyRamadan ? (
                <span className="font-medium text-amber-600">{texts.inRamadan}</span>
              ) : (
                <div>
                  <span className="text-muted-foreground">{texts.daysUntilRamadan}: </span>
                  <span className="font-medium">{ramadanInfo.daysUntilRamadan}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{texts.upcomingEvents}</span>
          </div>
          {isLoadingEvents ? (
            <Skeleton className="h-16 w-full" />
          ) : upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 3).map((event) => (
                <div
                  key={event.code}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {locale === "ar" ? event.nameAr : event.nameEn}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {locale === "ar"
                        ? event.hijriDateFormattedAr
                        : event.hijriDateFormattedEn}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {event.gregorianDate && (
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTimeDescription(event.gregorianDate, locale)}
                      </span>
                    )}
                    {event.isPublicHoliday && (
                      <Badge variant="secondary" className="text-xs">
                        {texts.publicHoliday}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-2">
              {texts.noUpcomingEvents}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
