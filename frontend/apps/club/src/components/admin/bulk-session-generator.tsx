"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { Calendar, CalendarDays, Clock, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import type { ClassSchedule, DayOfWeek } from "@liyaqa/shared/types/scheduling";

interface BulkSessionGeneratorProps {
  schedules: ClassSchedule[];
  onGenerate: (startDate: string, endDate: string) => Promise<void>;
  isGenerating?: boolean;
  className?: string;
}

const texts = {
  en: {
    title: "Generate Sessions",
    subtitle: "Create sessions from your weekly schedule",
    noSchedule: "No schedules defined",
    noScheduleDesc: "Add a weekly schedule first to generate sessions.",
    addSchedule: "Add Schedule",
    dateRange: "Date Range",
    selectRange: "Select how far ahead to generate sessions",
    week1: "1 Week",
    week2: "2 Weeks",
    week4: "4 Weeks",
    custom: "Custom",
    startDate: "Start Date",
    endDate: "End Date",
    preview: "Session Preview",
    previewDesc: "Sessions that will be created",
    totalSessions: "Total Sessions",
    perWeek: "per week",
    generate: "Generate Sessions",
    generating: "Generating...",
    days: {
      SUNDAY: "Sun",
      MONDAY: "Mon",
      TUESDAY: "Tue",
      WEDNESDAY: "Wed",
      THURSDAY: "Thu",
      FRIDAY: "Fri",
      SATURDAY: "Sat",
    },
    fullDays: {
      SUNDAY: "Sunday",
      MONDAY: "Monday",
      TUESDAY: "Tuesday",
      WEDNESDAY: "Wednesday",
      THURSDAY: "Thursday",
      FRIDAY: "Friday",
      SATURDAY: "Saturday",
    },
    yourSchedule: "Your Weekly Schedule",
    sessions: "sessions",
  },
  ar: {
    title: "إنشاء الجلسات",
    subtitle: "إنشاء جلسات من جدولك الأسبوعي",
    noSchedule: "لا توجد جداول",
    noScheduleDesc: "أضف جدولا أسبوعيا أولا لإنشاء الجلسات.",
    addSchedule: "إضافة جدول",
    dateRange: "نطاق التاريخ",
    selectRange: "حدد المدة لإنشاء الجلسات",
    week1: "أسبوع",
    week2: "أسبوعين",
    week4: "4 أسابيع",
    custom: "مخصص",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    preview: "معاينة الجلسات",
    previewDesc: "الجلسات التي سيتم إنشاؤها",
    totalSessions: "إجمالي الجلسات",
    perWeek: "أسبوعيا",
    generate: "إنشاء الجلسات",
    generating: "جاري الإنشاء...",
    days: {
      SUNDAY: "أحد",
      MONDAY: "اثن",
      TUESDAY: "ثلا",
      WEDNESDAY: "أربع",
      THURSDAY: "خمس",
      FRIDAY: "جمعة",
      SATURDAY: "سبت",
    },
    fullDays: {
      SUNDAY: "الأحد",
      MONDAY: "الاثنين",
      TUESDAY: "الثلاثاء",
      WEDNESDAY: "الأربعاء",
      THURSDAY: "الخميس",
      FRIDAY: "الجمعة",
      SATURDAY: "السبت",
    },
    yourSchedule: "جدولك الأسبوعي",
    sessions: "جلسات",
  },
};

type RangeOption = "1" | "2" | "4" | "custom";

const dayOrder: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function getDayIndex(day: DayOfWeek): number {
  return dayOrder.indexOf(day);
}

export function BulkSessionGenerator({
  schedules,
  onGenerate,
  isGenerating = false,
  className,
}: BulkSessionGeneratorProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isRTL = locale === "ar";

  // Date state
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const [rangeOption, setRangeOption] = useState<RangeOption>("2");
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(
    new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [previewMonth, setPreviewMonth] = useState(today);

  // Calculate date range based on option
  const { startDate, endDate } = useMemo(() => {
    if (rangeOption === "custom") {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    const weeks = parseInt(rangeOption);
    const end = new Date(today.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: todayStr,
      endDate: end.toISOString().split("T")[0],
    };
  }, [rangeOption, customStartDate, customEndDate, todayStr]);

  // Calculate session preview
  const sessionPreview = useMemo(() => {
    const sessions: Array<{ date: Date; schedule: ClassSchedule }> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = dayOrder[current.getDay()];
      const matchingSchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const schedule of matchingSchedules) {
        sessions.push({
          date: new Date(current),
          schedule,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return sessions;
  }, [startDate, endDate, schedules]);

  // Group schedules by day for display
  const schedulesByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, ClassSchedule[]> = {
      SUNDAY: [],
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
    };

    for (const schedule of schedules) {
      grouped[schedule.dayOfWeek].push(schedule);
    }

    return grouped;
  }, [schedules]);

  // Get calendar days for preview month
  const calendarDays = useMemo(() => {
    const year = previewMonth.getFullYear();
    const month = previewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfWeek = firstDay.getDay();

    const days: Array<{ date: Date | null; sessions: number }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startOfWeek; i++) {
      days.push({ date: null, sessions: 0 });
    }

    // Add each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const sessionsOnDay = sessionPreview.filter(
        (s) =>
          s.date.getFullYear() === date.getFullYear() &&
          s.date.getMonth() === date.getMonth() &&
          s.date.getDate() === date.getDate()
      ).length;

      days.push({ date, sessions: sessionsOnDay });
    }

    return days;
  }, [previewMonth, sessionPreview]);

  const handleGenerate = () => {
    onGenerate(startDate, endDate);
  };

  const navigateMonth = (direction: number) => {
    const newMonth = new Date(previewMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setPreviewMonth(newMonth);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // No schedules state
  if (schedules.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t.noSchedule}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t.noScheduleDesc}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Weekly Schedule Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-violet-500" />
            {t.yourSchedule}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {dayOrder.map((day) => {
              const daySchedules = schedulesByDay[day];
              if (daySchedules.length === 0) return null;

              return (
                <div
                  key={day}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800"
                >
                  <span className="font-medium text-violet-700 dark:text-violet-300">
                    {t.fullDays[day]}
                  </span>
                  <div className="flex gap-1">
                    {daySchedules.map((s) => (
                      <Badge
                        key={s.id}
                        variant="secondary"
                        className="text-xs bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-300"
                      >
                        {s.startTime.slice(0, 5)}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Date Range Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t.dateRange}</CardTitle>
          <CardDescription>{t.selectRange}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {(["1", "2", "4"] as const).map((weeks) => (
              <Button
                key={weeks}
                variant={rangeOption === weeks ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeOption(weeks)}
                className={cn(
                  rangeOption === weeks &&
                    "bg-gradient-to-r from-violet-500 to-sky-500 border-0"
                )}
              >
                {weeks === "1" ? t.week1 : weeks === "2" ? t.week2 : t.week4}
              </Button>
            ))}
            <Button
              variant={rangeOption === "custom" ? "default" : "outline"}
              size="sm"
              onClick={() => setRangeOption("custom")}
              className={cn(
                rangeOption === "custom" &&
                  "bg-gradient-to-r from-violet-500 to-sky-500 border-0"
              )}
            >
              {t.custom}
            </Button>
          </div>

          {/* Custom date inputs */}
          {rangeOption === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t.startDate}</label>
                <input
                  type="date"
                  value={customStartDate}
                  min={todayStr}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t.endDate}</label>
                <input
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-500" />
                {t.preview}
              </CardTitle>
              <CardDescription>{t.previewDesc}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(-1)}
                className="h-8 w-8"
              >
                {isRTL ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm font-medium min-w-[140px] text-center">
                {formatMonthYear(previewMonth)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateMonth(1)}
                className="h-8 w-8"
              >
                {isRTL ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayOrder.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {t.days[day]}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              if (!cell.date) {
                return <div key={idx} className="aspect-square" />;
              }

              const isToday =
                cell.date.toDateString() === today.toDateString();
              const isInRange =
                cell.date >= new Date(startDate) &&
                cell.date <= new Date(endDate);
              const hasSessions = cell.sessions > 0;

              return (
                <div
                  key={idx}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-colors",
                    isInRange && hasSessions
                      ? "bg-gradient-to-br from-violet-100 to-sky-100 dark:from-violet-900/40 dark:to-sky-900/40"
                      : isInRange
                      ? "bg-muted/50"
                      : "",
                    isToday && "ring-2 ring-violet-500 ring-offset-1",
                    !isInRange && "text-muted-foreground/50"
                  )}
                >
                  <span className={cn(isToday && "font-bold")}>
                    {cell.date.getDate()}
                  </span>
                  {hasSessions && isInRange && (
                    <div className="flex gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(cell.sessions, 3) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="w-1 h-1 rounded-full bg-violet-500"
                          />
                        )
                      )}
                      {cell.sessions > 3 && (
                        <span className="text-[8px] text-violet-600 dark:text-violet-400">
                          +{cell.sessions - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Card className="bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-900/20 dark:to-sky-900/20 border-violet-200 dark:border-violet-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">
                {t.totalSessions}:{" "}
                <span className="text-violet-600 dark:text-violet-400">
                  {sessionPreview.length}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                {schedules.length} {t.sessions} {t.perWeek}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating || sessionPreview.length === 0}
              className="bg-gradient-to-r from-violet-500 to-sky-500 hover:from-violet-600 hover:to-sky-600 text-white border-0"
            >
              <Sparkles className="me-2 h-5 w-5" />
              {isGenerating ? t.generating : t.generate}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
