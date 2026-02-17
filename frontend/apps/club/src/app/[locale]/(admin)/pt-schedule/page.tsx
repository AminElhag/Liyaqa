"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Users,
  User,
  Home,
  Building2,
  Filter,
  Dumbbell,
  Plus,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@liyaqa/shared/components/ui/dialog";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import {
  useScheduledPTSessions,
  usePTClasses,
  usePTClass,
  useSchedulePTSession,
} from "@liyaqa/shared/queries/use-pt-sessions";
import { useTrainers } from "@liyaqa/shared/queries/use-trainers";
import type { ClassSession } from "@liyaqa/shared/types/scheduling";
import { cn, getLocalizedText } from "@liyaqa/shared/utils";
import { parseApiError, getLocalizedErrorMessage } from "@liyaqa/shared/lib/api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Saudi work week starts on Saturday */
const WEEK_STARTS_ON = 6;

/** Time grid boundaries */
const START_HOUR = 6;
const END_HOUR = 22;

/** 30-minute increment count */
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2;

/** Slot height in pixels */
const SLOT_HEIGHT = 48;

/** Trainer color palette */
const trainerColors = [
  "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200",
  "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200",
  "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-200",
  "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200",
  "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-200",
  "bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-200",
  "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-200",
  "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-200",
];

const fallbackColor =
  "bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200";

// Status badge variants
const statusVariants: Record<string, "default" | "secondary" | "destructive" | "success"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "PT Schedule",
    subtitle: "Weekly personal training session calendar",
    previousWeek: "Previous Week",
    nextWeek: "Next Week",
    today: "Today",
    week: "Week",
    day: "Day",
    filterByTrainer: "Filter by trainer",
    allTrainers: "All Trainers",
    noSessions: "No PT sessions scheduled for this week",
    noSessionsDay: "No PT sessions scheduled for this day",
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    filters: "Filters",
    clearFilters: "Clear Filters",
    spots: "spots",
    full: "Full",
    scheduleSession: "Schedule Session",
    scheduleSessionDesc: "Create a new personal training session",
    selectClass: "PT Class",
    selectClassPlaceholder: "Select a class...",
    date: "Date",
    startTime: "Start Time",
    endTime: "End Time",
    clientAddress: "Client Address",
    notesEn: "Notes (English)",
    notesAr: "Notes (Arabic)",
    schedule: "Schedule",
    scheduling: "Scheduling...",
    cancel: "Cancel",
    skipAvailability: "Schedule even if trainer is not available",
    skipAvailabilityHint: "Override trainer availability check for this session",
    classRequired: "Please select a PT class",
    dateRequired: "Please select a date",
    timeRequired: "Please set a start time",
    sessionCreated: "PT session scheduled successfully",
  },
  ar: {
    title: "جدول التدريب الشخصي",
    subtitle: "التقويم الأسبوعي لجلسات التدريب الشخصي",
    previousWeek: "الأسبوع السابق",
    nextWeek: "الأسبوع التالي",
    today: "اليوم",
    week: "أسبوع",
    day: "يوم",
    filterByTrainer: "تصفية حسب المدرب",
    allTrainers: "جميع المدربين",
    noSessions: "لا توجد جلسات تدريب شخصي مجدولة لهذا الأسبوع",
    noSessionsDay: "لا توجد جلسات تدريب شخصي مجدولة لهذا اليوم",
    scheduled: "مجدول",
    inProgress: "جاري",
    completed: "مكتمل",
    cancelled: "ملغي",
    filters: "تصفية",
    clearFilters: "مسح التصفية",
    spots: "أماكن",
    full: "مكتمل",
    scheduleSession: "جدولة جلسة",
    scheduleSessionDesc: "إنشاء جلسة تدريب شخصي جديدة",
    selectClass: "فئة التدريب",
    selectClassPlaceholder: "اختر فئة...",
    date: "التاريخ",
    startTime: "وقت البدء",
    endTime: "وقت الانتهاء",
    clientAddress: "عنوان العميل",
    notesEn: "ملاحظات (إنجليزي)",
    notesAr: "ملاحظات (عربي)",
    schedule: "جدولة",
    scheduling: "جاري الجدولة...",
    cancel: "إلغاء",
    skipAvailability: "جدولة حتى لو المدرب غير متاح",
    skipAvailabilityHint: "تجاوز فحص توفر المدرب لهذه الجلسة",
    classRequired: "يرجى اختيار فئة التدريب",
    dateRequired: "يرجى تحديد التاريخ",
    timeRequired: "يرجى تحديد وقت البدء",
    sessionCreated: "تم جدولة جلسة التدريب الشخصي بنجاح",
  },
};

const statusLabels = {
  en: { SCHEDULED: "Scheduled", IN_PROGRESS: "In Progress", COMPLETED: "Completed", CANCELLED: "Cancelled" },
  ar: { SCHEDULED: "مجدول", IN_PROGRESS: "جاري", COMPLETED: "مكتمل", CANCELLED: "ملغي" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function topOffset(time: string): number {
  const mins = timeToMinutes(time);
  const gridStart = START_HOUR * 60;
  return ((mins - gridStart) / 30) * SLOT_HEIGHT;
}

function blockHeight(startTime: string, endTime: string): number {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const duration = Math.max(endMins - startMins, 30);
  return (duration / 30) * SLOT_HEIGHT;
}

function formatSlotLabel(slotIndex: number, locale: string): string {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (locale === "ar") {
    return `${pad(hours)}:${pad(minutes)}`;
  }
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "AM" : "PM";
  return `${h12}:${pad(minutes)} ${ampm}`;
}

function getSaudiWeekDays(weekStartDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i));
}

// ---------------------------------------------------------------------------
// Session card
// ---------------------------------------------------------------------------

function PTSessionCard({
  session,
  locale,
  colorClass,
  isCompact,
}: {
  session: ClassSession;
  locale: "en" | "ar";
  colorClass: string;
  isCompact: boolean;
}) {
  const sl = statusLabels[locale];
  const displayStart = session.startTime?.slice(0, 5);
  const displayEnd = session.endTime?.slice(0, 5);

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
          <p className="text-[10px] text-current/70 truncate mt-0.5">
            <LocalizedText text={session.trainerName} />
          </p>
        )}

        {/* Time */}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-current/70">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{displayStart} - {displayEnd}</span>
        </div>

        {/* Location icon & status */}
        {!isCompact && (
          <div className="flex items-center justify-between mt-1 gap-1">
            <span className="flex items-center gap-1 text-[10px] text-current/70">
              {session.ptLocationType === "HOME" ? (
                <Home className="h-3 w-3 shrink-0" />
              ) : (
                <Building2 className="h-3 w-3 shrink-0" />
              )}
              <span>
                {session.bookedCount}/{session.capacity}
              </span>
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

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ScheduleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-8 gap-2">
        <div className="w-16" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-md" />
        ))}
      </div>
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

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PTSchedulePage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const dateLocale = locale === "ar" ? arLocale : enUS;
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<"week" | "day">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "day";
    return "week";
  });
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return 0;
    return null;
  });
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Schedule dialog state
  const classIdParam = searchParams.get("classId");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    return format(nextHour, "HH:mm");
  });
  const [endTime, setEndTime] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notesEn, setNotesEn] = useState("");
  const [notesAr, setNotesAr] = useState("");
  const [skipAvailability, setSkipAvailability] = useState(false);
  const [formError, setFormError] = useState("");

  // PT Classes for the dropdown
  const { data: ptClassesData } = usePTClasses({ size: 100 });
  const ptClasses = ptClassesData?.content ?? [];

  // Selected class details (for duration & location type)
  const { data: selectedClassDetail } = usePTClass(selectedClassId, {
    enabled: !!selectedClassId,
  });

  // Schedule mutation
  const scheduleMutation = useSchedulePTSession();

  // Auto-open dialog when classId param is present
  useEffect(() => {
    if (classIdParam) {
      setSelectedClassId(classIdParam);
      setDialogOpen(true);
    }
  }, [classIdParam]);

  // Auto-calculate end time when class or start time changes
  useEffect(() => {
    if (selectedClassDetail?.durationMinutes && startTime) {
      const [h, m] = startTime.split(":").map(Number);
      const totalMins = h * 60 + m + selectedClassDetail.durationMinutes;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      setEndTime(`${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
    }
  }, [selectedClassDetail?.durationMinutes, startTime]);

  function resetDialogForm() {
    setSelectedClassId("");
    setSessionDate(format(new Date(), "yyyy-MM-dd"));
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    setStartTime(format(nextHour, "HH:mm"));
    setEndTime("");
    setClientAddress("");
    setNotesEn("");
    setNotesAr("");
    setSkipAvailability(false);
    setFormError("");
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      // Remove classId from URL to prevent re-opening
      if (classIdParam) {
        router.replace(`/${locale}/pt-schedule`, { scroll: false });
      }
      resetDialogForm();
    }
  }

  function handleScheduleSubmit() {
    setFormError("");

    if (!selectedClassId) {
      setFormError(t.classRequired);
      return;
    }
    if (!sessionDate) {
      setFormError(t.dateRequired);
      return;
    }
    if (!startTime) {
      setFormError(t.timeRequired);
      return;
    }

    scheduleMutation.mutate(
      {
        gymClassId: selectedClassId,
        sessionDate,
        startTime,
        endTime: endTime || startTime,
        clientAddress: clientAddress || undefined,
        notesEn: notesEn || undefined,
        notesAr: notesAr || undefined,
        skipAvailabilityCheck: skipAvailability || undefined,
      },
      {
        onSuccess: () => {
          handleDialogClose(false);
        },
        onError: async (err) => {
          const apiError = await parseApiError(err);
          setFormError(getLocalizedErrorMessage(apiError, locale));
        },
      }
    );
  }

  // Derived dates
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }),
    [currentDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: WEEK_STARTS_ON }),
    [currentDate]
  );
  const weekDays = useMemo(() => getSaudiWeekDays(weekStart), [weekStart]);

  const selectedDay = useMemo(() => {
    if (viewMode === "day" && selectedDayIndex !== null) {
      return weekDays[selectedDayIndex];
    }
    const todayIdx = weekDays.findIndex((d) => isSameDay(d, new Date()));
    return weekDays[todayIdx >= 0 ? todayIdx : 0];
  }, [viewMode, selectedDayIndex, weekDays]);

  // Data fetching
  const { data: sessionsData, isLoading } = useScheduledPTSessions({
    trainerId: trainerFilter !== "all" ? trainerFilter : undefined,
    startDate: format(weekStart, "yyyy-MM-dd"),
    endDate: format(weekEnd, "yyyy-MM-dd"),
    size: 200,
  });

  const { data: trainersData } = useTrainers({ size: 100 });
  const trainers = trainersData?.content ?? [];

  // Sessions
  const allSessions = sessionsData?.content ?? [];

  // Build trainer color map
  const trainerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueTrainerIds = new Set(allSessions.map((s) => s.trainerId).filter(Boolean));
    let idx = 0;
    for (const tid of uniqueTrainerIds) {
      if (tid) {
        map.set(tid, trainerColors[idx % trainerColors.length]);
        idx++;
      }
    }
    return map;
  }, [allSessions]);

  // Sessions grouped by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, ClassSession[]> = {};
    for (const s of allSessions) {
      const dateKey = s.date;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(s);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [allSessions]);

  const hasAnySessions = allSessions.length > 0;
  const hasActiveFilters = trainerFilter !== "all";

  // Navigation
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
    setTrainerFilter("all");
  }, []);

  // Week range text
  const weekRangeText = useMemo(() => {
    const start = format(weekStart, "MMM d", { locale: dateLocale });
    const end = format(weekEnd, "MMM d, yyyy", { locale: dateLocale });
    return `${start} - ${end}`;
  }, [weekStart, weekEnd, dateLocale]);

  const isDayToday = (date: Date) => isSameDay(date, new Date());

  // Render time gutter
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

  // Render day column
  function renderDayColumn(day: Date) {
    const dateKey = format(day, "yyyy-MM-dd");
    const daySessions = sessionsByDate[dateKey] || [];
    const today = isDayToday(day);

    return (
      <div
        className="relative border-s border-border/30"
        style={{ height: `${SLOT_COUNT * SLOT_HEIGHT}px` }}
      >
        {/* Grid lines */}
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

        {/* Session cards */}
        {daySessions.map((session) => {
          const top = topOffset(session.startTime);
          const height = blockHeight(session.startTime, session.endTime);
          const colorClass = session.trainerId
            ? trainerColorMap.get(session.trainerId) || fallbackColor
            : fallbackColor;

          return (
            <div
              key={session.id}
              className="absolute inset-inline-1 z-10"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              <PTSessionCard
                session={session}
                locale={locale}
                colorClass={colorClass}
                isCompact={height < SLOT_HEIGHT * 1.5}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="space-y-4">
      {/* Header */}
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

          {/* Schedule session button */}
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 me-1.5" />
            {t.scheduleSession}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder={t.filterByTrainer} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTrainers}</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.displayName
                        ? getLocalizedText(trainer.displayName, locale)
                        : trainer.userName || trainer.userEmail || trainer.id}
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

      {/* Week navigation */}
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

      {/* Loading */}
      {isLoading && <ScheduleSkeleton />}

      {/* Empty state */}
      {!isLoading && !hasAnySessions && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              {viewMode === "day" ? t.noSessionsDay : t.noSessions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Week view */}
      {!isLoading && hasAnySessions && viewMode === "week" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Day header row */}
              <div className="grid min-w-[900px]" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
                <div className="sticky top-0 z-30 bg-background border-b border-border p-2" />
                {weekDays.map((day, idx) => {
                  const today = isDayToday(day);
                  const dateKey = format(day, "yyyy-MM-dd");
                  const count = sessionsByDate[dateKey]?.length ?? 0;
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
                      {count > 0 && (
                        <Badge variant="secondary" className="text-[10px] mt-0.5 px-1.5 h-4">
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time grid body */}
              <div
                className="grid min-w-[900px]"
                style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}
              >
                <div className="relative bg-muted/20">
                  {renderTimeGutter()}
                </div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className={cn(isDayToday(day) && "bg-primary/[0.02]")}>
                    {renderDayColumn(day)}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day view */}
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
          {hasAnySessions && (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <div
                    className="grid min-w-[400px]"
                    style={{ gridTemplateColumns: "64px 1fr" }}
                  >
                    <div className="relative bg-muted/20">
                      {renderTimeGutter()}
                    </div>
                    <div>{renderDayColumn(selectedDay)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Schedule PT Session Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t.scheduleSession}</DialogTitle>
            <DialogDescription>{t.scheduleSessionDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* PT Class select */}
            <div className="space-y-2">
              <Label>{t.selectClass} *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t.selectClassPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {ptClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {getLocalizedText(cls.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>{t.date} *</Label>
              <Input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
              />
            </div>

            {/* Start / End time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.startTime} *</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.endTime}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Client address (only for HOME sessions) */}
            {selectedClassDetail?.ptLocationType === "HOME" && (
              <div className="space-y-2">
                <Label>{t.clientAddress}</Label>
                <Input
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                />
              </div>
            )}

            {/* Notes EN */}
            <div className="space-y-2">
              <Label>{t.notesEn}</Label>
              <Textarea
                value={notesEn}
                onChange={(e) => setNotesEn(e.target.value)}
                rows={2}
              />
            </div>

            {/* Notes AR */}
            <div className="space-y-2">
              <Label>{t.notesAr}</Label>
              <Textarea
                dir="rtl"
                value={notesAr}
                onChange={(e) => setNotesAr(e.target.value)}
                rows={2}
              />
            </div>

            {/* Skip availability check */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="skip-availability"
                checked={skipAvailability}
                onCheckedChange={(checked) =>
                  setSkipAvailability(checked === true)
                }
              />
              <div className="grid gap-0.5 leading-none">
                <Label
                  htmlFor="skip-availability"
                  className="text-sm font-medium cursor-pointer"
                >
                  {t.skipAvailability}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t.skipAvailabilityHint}
                </p>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={scheduleMutation.isPending}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleScheduleSubmit}
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending && (
                <Loader2 className="h-4 w-4 me-1.5 animate-spin" />
              )}
              {scheduleMutation.isPending ? t.scheduling : t.schedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
