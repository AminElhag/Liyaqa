"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  Filter,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@liyaqa/shared/components/ui/select";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import { useClassSessions, useActiveClasses } from "@liyaqa/shared/queries/use-classes";
import type { ClassSession, GymClass } from "@liyaqa/shared/types/scheduling";
import { cn } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Saudi work week starts on Saturday */
const WEEK_STARTS_ON = 6;

/** Time grid boundaries */
const START_HOUR = 5;
const END_HOUR = 23;

/** 30-minute increment count */
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2;

/** Slot height in pixels */
const SLOT_HEIGHT = 48;

/** Color mapping for class types */
const classTypeColors: Record<string, string> = {
  YOGA: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  PILATES: "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700",
  SPINNING: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700",
  CROSSFIT: "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
  SWIMMING: "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700",
  MARTIAL_ARTS: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700",
  DANCE: "bg-fuchsia-100 dark:bg-fuchsia-900/30 border-fuchsia-300 dark:border-fuchsia-700",
  GROUP_FITNESS: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  PERSONAL_TRAINING: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
  OTHER: "bg-slate-100 dark:bg-slate-900/30 border-slate-300 dark:border-slate-700",
};

const fallbackColor =
  "bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700";

/** Static prayer time blocks (placeholder; will be dynamic later) */
const prayerTimes = [
  { nameEn: "Fajr", nameAr: "الفجر", start: "05:00", end: "05:30" },
  { nameEn: "Dhuhr", nameAr: "الظهر", start: "12:15", end: "12:45" },
  { nameEn: "Asr", nameAr: "العصر", start: "15:30", end: "16:00" },
  { nameEn: "Maghrib", nameAr: "المغرب", start: "18:00", end: "18:30" },
  { nameEn: "Isha", nameAr: "العشاء", start: "19:30", end: "20:00" },
];

/** Status badge variants */
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

// ---------------------------------------------------------------------------
// Bilingual inline texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "Timetable",
    subtitle: "Weekly class schedule overview",
    previousWeek: "Previous Week",
    nextWeek: "Next Week",
    today: "Today",
    week: "Week",
    day: "Day",
    filterByClass: "Filter by class",
    filterByInstructor: "Filter by instructor",
    allClasses: "All Classes",
    allInstructors: "All Instructors",
    noSessions: "No sessions scheduled for this week",
    noSessionsDay: "No sessions scheduled for this day",
    spots: "spots",
    full: "Full",
    waitlist: "waitlist",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    filters: "Filters",
    clearFilters: "Clear Filters",
  },
  ar: {
    title: "الجدول الزمني",
    subtitle: "نظرة عامة على جدول الحصص الأسبوعي",
    previousWeek: "الأسبوع السابق",
    nextWeek: "الأسبوع التالي",
    today: "اليوم",
    week: "أسبوع",
    day: "يوم",
    filterByClass: "تصفية حسب الحصة",
    filterByInstructor: "تصفية حسب المدرب",
    allClasses: "جميع الحصص",
    allInstructors: "جميع المدربين",
    noSessions: "لا توجد حصص مجدولة لهذا الأسبوع",
    noSessionsDay: "لا توجد حصص مجدولة لهذا اليوم",
    spots: "أماكن",
    full: "مكتمل",
    waitlist: "قائمة انتظار",
    scheduled: "مجدول",
    inProgress: "جاري",
    completed: "مكتمل",
    cancelled: "ملغي",
    filters: "تصفية",
    clearFilters: "مسح التصفية",
  },
};

const statusLabels = {
  en: { SCHEDULED: "Scheduled", IN_PROGRESS: "In Progress", COMPLETED: "Completed", CANCELLED: "Cancelled" },
  ar: { SCHEDULED: "مجدول", IN_PROGRESS: "جاري", COMPLETED: "مكتمل", CANCELLED: "ملغي" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert "HH:mm" (or "HH:mm:ss") string to minutes from midnight. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Calculate top offset (px) relative to the grid start hour. */
function topOffset(time: string): number {
  const mins = timeToMinutes(time);
  const gridStart = START_HOUR * 60;
  return ((mins - gridStart) / 30) * SLOT_HEIGHT;
}

/** Calculate height (px) for a session block. */
function blockHeight(startTime: string, endTime: string): number {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const duration = Math.max(endMins - startMins, 30); // minimum 30 min display
  return (duration / 30) * SLOT_HEIGHT;
}

/** Format a time slot label, e.g. "5:00 AM" or "17:00". */
function formatSlotLabel(slotIndex: number, locale: string): string {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (locale === "ar") {
    // 24-hour format for Arabic
    return `${pad(hours)}:${pad(minutes)}`;
  }
  // 12-hour format for English
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${h12}:${pad(minutes)} ${ampm}`;
}

/** Saudi week day order: Sat, Sun, Mon, Tue, Wed, Thu, Fri */
function getSaudiWeekDays(weekStartDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

/** Build a lookup map of classId -> GymClass for fast access. */
function buildClassMap(classes: GymClass[] | undefined): Map<string, GymClass> {
  const map = new Map<string, GymClass>();
  if (!classes) return map;
  for (const c of classes) {
    map.set(c.id, c);
  }
  return map;
}

/** Get unique trainers from sessions + classes. */
function getUniqueTrainers(
  sessions: ClassSession[] | undefined
): { id: string; name: ClassSession["trainerName"] }[] {
  if (!sessions) return [];
  const seen = new Map<string, ClassSession["trainerName"]>();
  for (const s of sessions) {
    if (s.trainerId && !seen.has(s.trainerId)) {
      seen.set(s.trainerId, s.trainerName);
    }
  }
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single session card in the grid. */
function SessionCard({
  session,
  gymClass,
  locale,
  isCompact,
}: {
  session: ClassSession;
  gymClass: GymClass | undefined;
  locale: "en" | "ar";
  isCompact: boolean;
}) {
  const t = texts[locale];
  const sl = statusLabels[locale];
  const classType = gymClass?.classType;
  const colorClass = classType
    ? classTypeColors[classType] || fallbackColor
    : fallbackColor;

  const isFull = session.availableSpots <= 0;
  const displayStart = session.startTime.slice(0, 5);
  const displayEnd = session.endTime.slice(0, 5);

  return (
    <Link
      href={`/${locale}/sessions/${session.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
    >
      <div
        className={cn(
          "rounded-md border p-2 cursor-pointer transition-shadow hover:shadow-md overflow-hidden",
          colorClass,
          session.status === "CANCELLED" && "opacity-60 line-through"
        )}
      >
        {/* Class name */}
        <p className="font-semibold text-xs leading-tight truncate">
          <LocalizedText text={session.className} />
        </p>

        {/* Trainer */}
        {session.trainerName && !isCompact && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
            <LocalizedText text={session.trainerName} />
          </p>
        )}

        {/* Time */}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{displayStart} - {displayEnd}</span>
        </div>

        {/* Booking count & status */}
        {!isCompact && (
          <div className="flex items-center justify-between mt-1 gap-1">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Users className="h-3 w-3 shrink-0" />
              {isFull ? (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {t.full}
                </span>
              ) : (
                <span>
                  {session.bookedCount}/{session.capacity}
                </span>
              )}
              {session.waitlistCount > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  +{session.waitlistCount} {t.waitlist}
                </span>
              )}
            </span>
            <Badge
              variant={statusVariants[session.status] || "secondary"}
              className="text-[9px] px-1 py-0 leading-tight h-4"
            >
              {sl[session.status as keyof typeof sl] || session.status}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
}

/** Skeleton for the weekly grid during loading. */
function TimetableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Day headers */}
      <div className="grid grid-cols-8 gap-2">
        <div className="w-16" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
      {/* Time rows */}
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid grid-cols-8 gap-2">
          <Skeleton className="h-12 w-16 rounded-md" />
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} className="h-12 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Prayer time overlay bands. */
function PrayerOverlays({ locale }: { locale: "en" | "ar" }) {
  return (
    <>
      {prayerTimes.map((prayer) => {
        const top = topOffset(prayer.start);
        const height = blockHeight(prayer.start, prayer.end);
        // Only render if the prayer falls within the grid range
        const startMins = timeToMinutes(prayer.start);
        const endMins = timeToMinutes(prayer.end);
        if (endMins <= START_HOUR * 60 || startMins >= END_HOUR * 60) return null;

        return (
          <div
            key={prayer.nameEn}
            className="absolute inset-inline-0 z-[1] flex items-center justify-center pointer-events-none bg-neutral-200/50 dark:bg-neutral-800/50 border-y border-neutral-300/50 dark:border-neutral-700/50"
            style={{ top: `${top}px`, height: `${height}px` }}
          >
            <span className="text-[10px] font-medium text-muted-foreground/70 select-none">
              {locale === "ar" ? prayer.nameAr : prayer.nameEn}
            </span>
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function TimetablePage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const dateLocale = locale === "ar" ? arLocale : enUS;

  // ------ State ------
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "day";
    return "week";
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return 0;
    return null;
  });
  const [classFilter, setClassFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // ------ Derived dates ------
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }),
    [currentDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }),
    [currentDate]
  );
  const weekDays = useMemo(() => getSaudiWeekDays(weekStart), [weekStart]);

  // If day view, the selected day
  const selectedDay = useMemo(() => {
    if (viewMode === "day" && selectedDayIndex !== null) {
      return weekDays[selectedDayIndex];
    }
    // Default to today if it falls in the week, otherwise first day
    const todayIdx = weekDays.findIndex((d) => isSameDay(d, new Date()));
    return weekDays[todayIdx >= 0 ? todayIdx : 0];
  }, [viewMode, selectedDayIndex, weekDays]);

  // ------ Data fetching ------
  const { data: sessionsData, isLoading: isLoadingSessions } = useClassSessions({
    dateFrom: format(weekStart, "yyyy-MM-dd"),
    dateTo: format(weekEnd, "yyyy-MM-dd"),
    size: 200,
  });

  const { data: activeClasses, isLoading: isLoadingClasses } = useActiveClasses();

  // Combine loading states — filter depends on both sessions AND classes being loaded
  const isLoading = isLoadingSessions || isLoadingClasses;

  const classMap = useMemo(() => buildClassMap(activeClasses), [activeClasses]);

  // ------ Filtering ------
  const allSessions = sessionsData?.content ?? [];

  const filteredSessions = useMemo(() => {
    let result = allSessions;
    // Exclude PT sessions — they belong on the PT Schedule page
    // Strict filter: only show sessions whose class is loaded AND not PT
    result = result.filter((s) => {
      const gc = classMap.get(s.classId);
      return gc != null && gc.classType !== "PERSONAL_TRAINING";
    });
    if (classFilter !== "all") {
      result = result.filter((s) => s.classId === classFilter);
    }
    if (trainerFilter !== "all") {
      result = result.filter((s) => s.trainerId === trainerFilter);
    }
    return result;
  }, [allSessions, classFilter, trainerFilter, classMap]);

  // Sessions grouped by date string
  const sessionsByDate = useMemo(() => {
    const map: Record<string, ClassSession[]> = {};
    for (const s of filteredSessions) {
      const dateKey = s.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    }
    // Sort each day's sessions by start time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [filteredSessions]);

  const trainers = useMemo(() => getUniqueTrainers(allSessions), [allSessions]);

  // Unique classes present in sessions for the class filter dropdown (exclude PT)
  const classesInSessions = useMemo(() => {
    const ids = new Set(allSessions.map((s) => s.classId));
    return Array.from(ids)
      .map((id) => {
        const gc = classMap.get(id);
        if (!gc || gc.classType === "PERSONAL_TRAINING") return null;
        const session = allSessions.find((s) => s.classId === id);
        return {
          id,
          name: gc?.name ?? session?.className,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c != null && c.name != null);
  }, [allSessions, classMap]);

  // ------ Navigation ------
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
    const todayInWeek = getSaudiWeekDays(
      startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON })
    );
    const todayIdx = todayInWeek.findIndex((d) => isSameDay(d, new Date()));
    if (todayIdx >= 0) setSelectedDayIndex(todayIdx);
  }, []);

  const clearFilters = useCallback(() => {
    setClassFilter("all");
    setTrainerFilter("all");
  }, []);

  const hasActiveFilters = classFilter !== "all" || trainerFilter !== "all";

  // ------ Week header range text ------
  const weekRangeText = useMemo(() => {
    const start = format(weekStart, "MMM d", { locale: dateLocale });
    const end = format(weekEnd, "MMM d, yyyy", { locale: dateLocale });
    return `${start} - ${end}`;
  }, [weekStart, weekEnd, dateLocale]);

  // Is this session's day today?
  const isDayToday = (date: Date) => isSameDay(date, new Date());

  // Check if any sessions exist this week
  const hasAnySessions = filteredSessions.length > 0;

  // ------ Render helpers ------

  /** Time gutter labels (left column in the grid). */
  function renderTimeGutter() {
    return (
      <div className="relative" style={{ height: `${SLOT_COUNT * SLOT_HEIGHT}px` }}>
        {Array.from({ length: SLOT_COUNT }).map((_, i) => (
          <div
            key={i}
            className="absolute end-0 start-0 flex items-start border-t border-border/30"
            style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
          >
            {i % 2 === 0 && (
              <span className="text-[10px] text-muted-foreground pe-2 -mt-[7px] select-none whitespace-nowrap">
                {formatSlotLabel(i, locale)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  /** Render a single day column with positioned session cards. */
  function renderDayColumn(day: Date, isExpanded: boolean) {
    const dateKey = format(day, "yyyy-MM-dd");
    const daySessions = sessionsByDate[dateKey] || [];
    const today = isDayToday(day);

    return (
      <div
        className="relative border-s border-border/30"
        style={{ height: `${SLOT_COUNT * SLOT_HEIGHT}px` }}
      >
        {/* Half-hour grid lines */}
        {Array.from({ length: SLOT_COUNT }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-inline-0 border-t",
              i % 2 === 0 ? "border-border/30" : "border-border/15"
            )}
            style={{ top: `${i * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
          />
        ))}

        {/* Current time indicator */}
        {today && (() => {
          const now = new Date();
          const nowMins = now.getHours() * 60 + now.getMinutes();
          const gridStartMins = START_HOUR * 60;
          const gridEndMins = END_HOUR * 60;
          if (nowMins < gridStartMins || nowMins > gridEndMins) return null;
          const topPx = ((nowMins - gridStartMins) / 30) * SLOT_HEIGHT;
          return (
            <div
              className="absolute inset-inline-0 z-20 border-t-2 border-[#FF6B4A] pointer-events-none"
              style={{ top: `${topPx}px` }}
            >
              <div className="absolute -top-[5px] start-0 h-[10px] w-[10px] rounded-full bg-[#FF6B4A]" />
            </div>
          );
        })()}

        {/* Prayer overlays */}
        <PrayerOverlays locale={locale} />

        {/* Session cards */}
        {daySessions.map((session) => {
          const top = topOffset(session.startTime);
          const height = blockHeight(session.startTime, session.endTime);
          const gc = classMap.get(session.classId);

          return (
            <div
              key={session.id}
              className="absolute inset-inline-1 z-10"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <SessionCard
                session={session}
                gymClass={gc}
                locale={locale}
                isCompact={height < SLOT_HEIGHT * 1.5}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <div className="space-y-4">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-input bg-background">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-e-none"
              onClick={() => {
                setViewMode("week");
                setSelectedDayIndex(null);
              }}
            >
              <Calendar className="h-4 w-4 me-1.5" />
              {t.week}
            </Button>
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-s-none"
              onClick={() => {
                setViewMode("day");
                const todayIdx = weekDays.findIndex((d) => isSameDay(d, new Date()));
                setSelectedDayIndex(todayIdx >= 0 ? todayIdx : 0);
              }}
            >
              <Clock className="h-4 w-4 me-1.5" />
              {t.day}
            </Button>
          </div>

          {/* Filter toggle */}
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 me-1.5" />
            {t.filters}
          </Button>
        </div>
      </div>

      {/* ---- Filter bar ---- */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Class filter */}
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t.filterByClass} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allClasses}</SelectItem>
                  {classesInSessions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <LocalizedText text={c.name ?? ""} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Trainer filter */}
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder={t.filterByInstructor} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allInstructors}</SelectItem>
                  {trainers.map((tr) => (
                    <SelectItem key={tr.id} value={tr.id}>
                      <LocalizedText text={tr.name ?? ""} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t.clearFilters}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Week navigation ---- */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousWeek}
          aria-label={t.previousWeek}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-center select-none">
            {weekRangeText}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            {t.today}
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextWeek}
          aria-label={t.nextWeek}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* ---- Loading state ---- */}
      {isLoading && <TimetableSkeleton />}

      {/* ---- Empty state ---- */}
      {!isLoading && !hasAnySessions && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {viewMode === "day" ? t.noSessionsDay : t.noSessions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---- Week view ---- */}
      {!isLoading && hasAnySessions && viewMode === "week" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Day header row */}
              <div className="grid min-w-[900px]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                {/* Time gutter header */}
                <div className="sticky top-0 z-30 bg-background border-b border-border p-2" />
                {/* Day headers */}
                {weekDays.map((day, idx) => {
                  const today = isDayToday(day);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={cn(
                        "sticky top-0 z-30 bg-background border-b border-border p-2 text-center transition-colors hover:bg-muted/50",
                        today && "bg-primary/5"
                      )}
                      onClick={() => {
                        setViewMode("day");
                        setSelectedDayIndex(idx);
                      }}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {format(day, "EEE", { locale: dateLocale })}
                      </p>
                      <p
                        className={cn(
                          "text-lg font-bold mt-0.5",
                          today && "text-[#FF6B4A]"
                        )}
                      >
                        {format(day, "d")}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Time grid body */}
              <div
                className="grid min-w-[900px]"
                style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}
              >
                {/* Time gutter */}
                <div className="relative bg-muted/20">
                  {renderTimeGutter()}
                </div>

                {/* Day columns */}
                {weekDays.map((day, idx) => (
                  <div key={idx} className={cn(isDayToday(day) && "bg-primary/[0.02]")}>
                    {renderDayColumn(day, false)}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Day view ---- */}
      {!isLoading && viewMode === "day" && (
        <>
          {/* Day selector strip */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {weekDays.map((day, idx) => {
              const today = isDayToday(day);
              const isSelected = selectedDayIndex === idx;
              const dateKey = format(day, "yyyy-MM-dd");
              const count = sessionsByDate[dateKey]?.length ?? 0;

              return (
                <button
                  key={idx}
                  type="button"
                  className={cn(
                    "flex flex-col items-center px-3 py-2 rounded-lg border transition-colors min-w-[60px] shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted/50",
                    today && !isSelected && "border-[#FF6B4A]"
                  )}
                  onClick={() => setSelectedDayIndex(idx)}
                >
                  <span className="text-[10px] font-medium uppercase">
                    {format(day, "EEE", { locale: dateLocale })}
                  </span>
                  <span className="text-lg font-bold">{format(day, "d")}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "text-[9px] mt-0.5",
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day schedule */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div
                  className="grid min-w-[400px]"
                  style={{ gridTemplateColumns: "64px 1fr" }}
                >
                  {/* Time gutter */}
                  <div className="relative bg-muted/20">
                    {renderTimeGutter()}
                  </div>

                  {/* Single day column */}
                  <div>{renderDayColumn(selectedDay, true)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
