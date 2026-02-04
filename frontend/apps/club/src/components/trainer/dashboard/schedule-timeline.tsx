"use client";

import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Calendar, Clock, User, MapPin, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@liyaqa/shared/utils";
import type { ScheduleSummaryResponse } from "@liyaqa/shared/types/trainer-portal";

interface ScheduleTimelineProps {
  schedule: ScheduleSummaryResponse | undefined;
  isLoading?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ScheduleTimeline({ schedule, isLoading }: ScheduleTimelineProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const dateLocale = locale === "ar" ? ar : enUS;

  if (isLoading || !schedule) {
    return <ScheduleTimelineSkeleton />;
  }

  const nextSession = schedule.nextSession;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="rounded-lg border bg-card p-6 shadow-sm"
    >
      <h3 className="text-lg font-semibold mb-4">
        {locale === "ar" ? "الجدول الزمني" : "Schedule"}
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-blue-500/10">
          <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold">{schedule.todaysSessions}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "جلسات اليوم" : "Today"}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-amber-500/10">
          <Clock className="h-5 w-5 mx-auto mb-1 text-amber-600" />
          <p className="text-2xl font-bold">{schedule.upcomingSessions}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "قادمة" : "Upcoming"}
          </p>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold">{schedule.completedThisMonth}</p>
          <p className="text-xs text-muted-foreground">
            {locale === "ar" ? "مكتملة" : "Completed"}
          </p>
        </div>
      </div>

      {/* Next Session Card */}
      {nextSession ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-primary mb-3">
            {locale === "ar" ? "الجلسة القادمة" : "Next Session"}
          </h4>
          <div className="space-y-2">
            <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {format(parseISO(nextSession.sessionDate), "PPP", { locale: dateLocale })}
              </span>
            </div>
            <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {nextSession.startTime} - {nextSession.endTime}
              </span>
            </div>
            {nextSession.clientName && (
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{nextSession.clientName}</span>
              </div>
            )}
            {nextSession.className && (
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{nextSession.className}</span>
              </div>
            )}
            {nextSession.location && (
              <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{nextSession.location}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? "لا توجد جلسات قادمة" : "No upcoming sessions"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function ScheduleTimelineSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
      <div className="h-6 w-32 bg-muted rounded mb-4" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center p-3 rounded-lg bg-muted">
            <div className="h-5 w-5 mx-auto mb-1 bg-muted-foreground/20 rounded" />
            <div className="h-6 w-12 mx-auto mb-1 bg-muted-foreground/20 rounded" />
            <div className="h-3 w-16 mx-auto bg-muted-foreground/20 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-muted p-4">
        <div className="h-4 w-24 bg-muted-foreground/20 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted-foreground/20 rounded" />
          <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-2/3 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  );
}

export { ScheduleTimelineSkeleton };
