"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Dumbbell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "./progress";
import { Skeleton } from "../ui/skeleton";
import { cn } from "../../lib/utils";
import type { ClassSession } from "../../types/scheduling";

interface UpcomingSessionsProps {
  sessions: ClassSession[] | undefined;
  isLoading?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const, delay: 0.35 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05 },
  }),
};

export function UpcomingSessions({ sessions, isLoading }: UpcomingSessionsProps) {
  const locale = useLocale();
  const isRtl = locale === "ar";

  const texts = {
    title: locale === "ar" ? "جلسات اليوم" : "Today's Sessions",
    viewAll: locale === "ar" ? "عرض الكل" : "View All",
    noSessions: locale === "ar" ? "لا توجد حصص مجدولة اليوم" : "No classes scheduled today",
    booked: locale === "ar" ? "محجوز" : "booked",
    instructor: locale === "ar" ? "المدرب" : "Instructor",
    starting: locale === "ar" ? "يبدأ" : "Starting",
    inProgress: locale === "ar" ? "جارٍ الآن" : "In Progress",
    completed: locale === "ar" ? "اكتمل" : "Completed",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
  };

  if (isLoading) {
    return <UpcomingSessionsSkeleton />;
  }

  // Sort sessions by start time and take top 5
  const sortedSessions = [...(sessions || [])]
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="h-full">
        <CardHeader className={cn("pb-3", isRtl && "text-right")}>
          <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
            <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold">{texts.title}</CardTitle>
            </div>
            <Link href={`/${locale}/sessions`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                {texts.viewAll}
                <ChevronRight className={cn("h-3 w-3", isRtl && "rotate-180")} />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {sortedSessions.length > 0 ? (
            <div className="space-y-3">
              {sortedSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                >
                  <SessionItem
                    session={session}
                    locale={locale}
                    isRtl={isRtl}
                    texts={texts}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Dumbbell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">{texts.noSessions}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SessionItemProps {
  session: ClassSession;
  locale: string;
  isRtl: boolean;
  texts: Record<string, string>;
}

function SessionItem({ session, locale, isRtl, texts }: SessionItemProps) {
  const className = locale === "ar" && session.className.ar
    ? session.className.ar
    : session.className.en;

  const trainerName = session.trainerName
    ? locale === "ar" && session.trainerName.ar
      ? session.trainerName.ar
      : session.trainerName.en
    : null;

  const capacity = session.capacity || 20;
  const booked = session.bookedCount || 0;
  const capacityPercent = (booked / capacity) * 100;
  const isAlmostFull = capacityPercent >= 80;
  const isFull = capacityPercent >= 100;

  // Determine status
  const now = new Date();
  const sessionDate = session.date;
  const startParts = session.startTime.split(":");
  const endParts = session.endTime.split(":");
  const startTime = new Date(`${sessionDate}T${session.startTime}`);
  const endTime = new Date(`${sessionDate}T${session.endTime}`);

  const isInProgress = now >= startTime && now <= endTime;
  const isCompleted = now > endTime || session.status === "COMPLETED";
  const isCancelled = session.status === "CANCELLED";

  const statusBadge = isCancelled
    ? { label: texts.cancelled, variant: "destructive" as const }
    : isCompleted
    ? { label: texts.completed, variant: "secondary" as const }
    : isInProgress
    ? { label: texts.inProgress, variant: "default" as const }
    : null;

  return (
    <Link href={`/${locale}/sessions/${session.id}`}>
      <div className={cn(
        "p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
        isCancelled && "opacity-60"
      )}>
        {/* Header */}
        <div className={cn("flex items-start justify-between gap-2 mb-2", isRtl && "flex-row-reverse")}>
          <div className={cn(isRtl && "text-right")}>
            <h4 className="font-medium text-sm">{className}</h4>
            {trainerName && (
              <p className="text-xs text-muted-foreground">
                {texts.instructor}: {trainerName}
              </p>
            )}
          </div>
          {statusBadge && (
            <Badge variant={statusBadge.variant} className="text-[10px] px-1.5 py-0">
              {statusBadge.label}
            </Badge>
          )}
        </div>

        {/* Time and Capacity */}
        <div className={cn("flex items-center justify-between text-xs", isRtl && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-1 text-muted-foreground", isRtl && "flex-row-reverse")}>
            <Clock className="h-3 w-3" />
            <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
          </div>
          <div className={cn(
            "flex items-center gap-1",
            isFull ? "text-red-600" : isAlmostFull ? "text-amber-600" : "text-muted-foreground",
            isRtl && "flex-row-reverse"
          )}>
            <Users className="h-3 w-3" />
            <span>{booked}/{capacity}</span>
          </div>
        </div>

        {/* Capacity Progress */}
        {!isCancelled && !isCompleted && (
          <Progress
            value={capacityPercent}
            className={cn(
              "h-1 mt-2",
              isFull && "[&>div]:bg-red-500",
              isAlmostFull && !isFull && "[&>div]:bg-amber-500"
            )}
          />
        )}
      </div>
    </Link>
  );
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function UpcomingSessionsSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border">
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2 mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-1 w-full mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { UpcomingSessionsSkeleton };
