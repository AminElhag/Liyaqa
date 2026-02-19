"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import {
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useUpcomingSessions } from "@liyaqa/shared/queries/use-trainer-portal";
import { cn, formatDate } from "@liyaqa/shared/utils";
import type { UpcomingSessionResponse } from "@liyaqa/shared/types/trainer-portal";
import { CreateSessionDialog } from "../../../../../components/schedule/create-session-dialog";
import { SessionDetailDialog } from "../../../../../components/schedule/session-detail-dialog";

const text = {
  title: { en: "Schedule", ar: "الجدول" },
  subtitle: { en: "Your weekly schedule", ar: "جدولك الأسبوعي" },
  newSession: { en: "New Session", ar: "جلسة جديدة" },
  noSessions: { en: "No sessions this week", ar: "لا توجد جلسات هذا الأسبوع" },
  today: { en: "Today", ar: "اليوم" },
  pt: { en: "PT", ar: "تدريب شخصي" },
  class: { en: "Class", ar: "فصل" },
  loading: { en: "Loading schedule...", ar: "جاري تحميل الجدول..." },
  completed: { en: "Completed", ar: "مكتملة" },
  noShow: { en: "No Show", ar: "لم يحضر" },
};

const dayNames = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

const statusLabels: Record<string, { en: string; ar: string }> = {
  REQUESTED: { en: "Requested", ar: "مطلوبة" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكدة" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  COMPLETED: { en: "Completed", ar: "مكتملة" },
  CANCELLED: { en: "Cancelled", ar: "ملغاة" },
  NO_SHOW: { en: "No Show", ar: "لم يحضر" },
};

function getWeekRange(baseDate: Date): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function formatISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function getStatusStyle(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "SCHEDULED":
      return {
        bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
        text: "text-blue-700 dark:text-blue-300",
      };
    case "COMPLETED":
      return {
        bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
        dot: "bg-green-500",
        text: "text-green-700 dark:text-green-300",
      };
    case "CANCELLED":
      return {
        bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
        dot: "bg-red-500",
        text: "text-red-700 dark:text-red-300",
      };
    case "NO_SHOW":
      return {
        bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
        dot: "bg-orange-500",
        text: "text-orange-700 dark:text-orange-300",
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
        text: "text-amber-700 dark:text-amber-300",
      };
    case "REQUESTED":
      return {
        bg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800",
        dot: "bg-purple-500",
        text: "text-purple-700 dark:text-purple-300",
      };
    default:
      return {
        bg: "bg-muted border-border",
        dot: "bg-muted-foreground",
        text: "text-muted-foreground",
      };
  }
}

export default function TrainerSchedulePage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const [weekOffset, setWeekOffset] = useState(0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const { start: weekStart, end: weekEnd } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekRange(base);
  }, [weekOffset]);

  const { data: sessions, isLoading } = useUpcomingSessions({
    startDate: formatISODate(weekStart),
    endDate: formatISODate(weekEnd),
    limit: 50,
  });

  const todayStr = formatISODate(new Date());

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, UpcomingSessionResponse[]> = {};

    // Initialize all 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      grouped[formatISODate(d)] = [];
    }

    if (sessions) {
      for (const session of sessions) {
        const date = session.sessionDate;
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(session);
      }
    }

    // Sort sessions within each day by start time
    for (const date of Object.keys(grouped)) {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return grouped;
  }, [sessions, weekStart]);

  const weekLabel = useMemo(() => {
    const startLabel = formatDate(weekStart.toISOString(), locale);
    const endLabel = formatDate(weekEnd.toISOString(), locale);
    return `${startLabel} - ${endLabel}`;
  }, [weekStart, weekEnd, locale]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="me-2 h-4 w-4" />
          {t("newSession")}
        </Button>
      </div>

      {/* Week navigation */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((prev) => prev - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium">{weekLabel}</p>
              {weekOffset !== 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => setWeekOffset(0)}
                >
                  {t("today")}
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setWeekOffset((prev) => prev + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Weekly schedule */}
      {!isLoading && (
        <div className="space-y-4">
          {Object.entries(sessionsByDate).map(([date, daySessions]) => {
            const d = new Date(date + "T00:00:00");
            const dayIndex = d.getDay();
            const dayLabel = isAr ? dayNames.ar[dayIndex] : dayNames.en[dayIndex];
            const isToday = date === todayStr;

            return (
              <Card
                key={date}
                className={cn(
                  isToday && "ring-2 ring-primary/30 border-primary/50"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{dayLabel}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(date, locale)}
                    </span>
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        {t("today")}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs ms-auto">
                      {daySessions.length} {isAr ? "جلسات" : "sessions"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {daySessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      {isAr ? "لا توجد جلسات" : "No sessions"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {daySessions.map((session) => {
                        const style = getStatusStyle(session.status);
                        const label = statusLabels[session.status];
                        return (
                          <button
                            key={session.sessionId}
                            type="button"
                            onClick={() => setSelectedSessionId(session.sessionId)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:shadow-sm w-full text-start",
                              style.bg
                            )}
                          >
                            <div
                              className={cn(
                                "h-2 w-2 rounded-full shrink-0",
                                style.dot
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">
                                  {session.clientName || session.className || "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {session.startTime}
                                  {session.endTime
                                    ? ` - ${session.endTime}`
                                    : ""}
                                </span>
                                {session.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {session.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {session.sessionType === "PT"
                                  ? t("pt")
                                  : t("class")}
                              </Badge>
                              <span className={cn("text-xs font-medium", style.text)}>
                                {label ? (isAr ? label.ar : label.en) : session.status}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <SessionDetailDialog
        sessionId={selectedSessionId}
        open={!!selectedSessionId}
        onOpenChange={(open) => {
          if (!open) setSelectedSessionId(null);
        }}
      />
    </div>
  );
}
