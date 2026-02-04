"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { useMemberTimetable } from "@liyaqa/shared/queries";
import type { ClassSession } from "@liyaqa/shared/types/scheduling";
import { cn } from "@liyaqa/shared/utils";

const texts = {
  en: {
    title: "Class Timetable",
    subtitle: "Browse and book available sessions",
    backToClasses: "All Classes",
    today: "Today",
    noSessions: "No sessions scheduled",
    spotsAvailable: "spots",
    full: "Full",
    waitlist: "Waitlist",
    booked: "Booked",
    book: "Book",
  },
  ar: {
    title: "جدول الحصص",
    subtitle: "تصفح واحجز الحصص المتاحة",
    backToClasses: "جميع الحصص",
    today: "اليوم",
    noSessions: "لا توجد حصص مجدولة",
    spotsAvailable: "أماكن",
    full: "مكتمل",
    waitlist: "قائمة انتظار",
    booked: "محجوز",
    book: "احجز",
  },
};

interface SessionCardProps {
  session: ClassSession;
  locale: string;
  onClick: () => void;
}

function SessionCard({ session, locale, onClick }: SessionCardProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;
  const isBooked = session.bookedByCurrentMember;
  const isFull = session.availableSpots <= 0;
  const hasWaitlist = session.waitlistEnabled && isFull;

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all overflow-hidden border-l-4",
        isBooked && "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
        !isBooked && !isFull && "border-l-primary hover:border-l-primary",
        !isBooked && isFull && "border-l-muted-foreground/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Time and class name */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground">
                {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
              </p>
              <p className="font-medium text-sm">
                <LocalizedText text={session.className} />
              </p>
            </div>
            {isBooked && (
              <Badge variant="success" className="shrink-0 text-xs">
                {t.booked}
              </Badge>
            )}
          </div>

          {/* Trainer */}
          {session.trainerName && (
            <p className="text-xs text-muted-foreground">
              <LocalizedText text={session.trainerName} />
            </p>
          )}

          {/* Availability */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isFull ? (
                hasWaitlist ? (
                  <span className="text-amber-600">{t.waitlist}</span>
                ) : (
                  <span className="text-muted-foreground">{t.full}</span>
                )
              ) : (
                <span>
                  {session.availableSpots} {t.spotsAvailable}
                </span>
              )}
            </span>

            {!isBooked && (
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                {t.book}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MemberTimetablePage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const searchParams = useSearchParams();
  const classIdFilter = searchParams.get("classId");
  const dateLocale = locale === "ar" ? ar : enUS;

  // Current week start
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  });

  // Generate week dates
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Format date for API
  const apiDate = format(weekStart, "yyyy-MM-dd");

  // Fetch timetable
  const { data: sessions, isLoading, error } = useMemberTimetable(apiDate);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    if (!sessions) return {};

    let filteredSessions = sessions;
    if (classIdFilter) {
      filteredSessions = sessions.filter((s) => s.classId === classIdFilter);
    }

    return filteredSessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      // Sort by start time
      acc[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as Record<string, ClassSession[]>);
  }, [sessions, classIdFilter]);

  const navigateWeek = (direction: "prev" | "next") => {
    setWeekStart((prev) => addDays(prev, direction === "prev" ? -7 : 7));
  };

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const handleSessionClick = (session: ClassSession) => {
    // Open booking sheet/dialog (to be implemented)
    console.log("Book session:", session);
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {locale === "ar" ? "حدث خطأ" : "Error loading timetable"}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/classes`}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {t.backToClasses}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-center">
                {format(weekStart, "MMMM yyyy", { locale: dateLocale })}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                {t.today}
              </Button>
            </div>

            <Button variant="outline" size="icon" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const daySessions = sessionsByDate[dateKey] || [];
            const today = isToday(date);

            return (
              <div key={dateKey} className="space-y-2">
                {/* Day Header */}
                <div
                  className={cn(
                    "text-center p-2 rounded-lg",
                    today && "bg-primary text-primary-foreground",
                    !today && "bg-muted"
                  )}
                >
                  <p className="text-xs font-medium">
                    {format(date, "EEE", { locale: dateLocale })}
                  </p>
                  <p className={cn("text-lg font-bold", today && "text-primary-foreground")}>
                    {format(date, "d")}
                  </p>
                </div>

                {/* Sessions */}
                <div className="space-y-2 min-h-[200px]">
                  {daySessions.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                      -
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        locale={locale}
                        onClick={() => handleSessionClick(session)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
