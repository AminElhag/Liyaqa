"use client";

import { useLocale } from "next-intl";
import { Clock, Users, UserCheck, UserMinus } from "lucide-react";
import { cn } from "@liyaqa/shared/utils";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { LocalizedText } from "@liyaqa/shared/components/ui/localized-text";
import type { ClassSession, SessionStatus } from "@liyaqa/shared/types/scheduling";

interface SessionCardProps {
  session: ClassSession;
  onClick?: () => void;
  onViewAttendees?: () => void;
  showClassName?: boolean;
  compact?: boolean;
  className?: string;
}

const texts = {
  en: {
    scheduled: "Scheduled",
    inProgress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    booked: "booked",
    available: "available",
    waitlisted: "waitlisted",
    viewAttendees: "View Attendees",
    full: "Full",
    today: "Today",
    tomorrow: "Tomorrow",
  },
  ar: {
    scheduled: "مجدول",
    inProgress: "قيد التنفيذ",
    completed: "مكتمل",
    cancelled: "ملغى",
    booked: "محجوز",
    available: "متاح",
    waitlisted: "قائمة الانتظار",
    viewAttendees: "عرض الحضور",
    full: "ممتلئ",
    today: "اليوم",
    tomorrow: "غدًا",
  },
};

// Status badge variants
const STATUS_CONFIG: Record<
  SessionStatus,
  { variant: "success" | "info" | "secondary" | "destructive"; icon: string }
> = {
  SCHEDULED: { variant: "info", icon: "⚪" },
  IN_PROGRESS: { variant: "success", icon: "🟢" },
  COMPLETED: { variant: "secondary", icon: "✅" },
  CANCELLED: { variant: "destructive", icon: "❌" },
};

// Calculate capacity percentage and color
function getCapacityInfo(booked: number, capacity: number) {
  const percentage = Math.round((booked / capacity) * 100);
  let colorClass = "bg-emerald-500"; // Green: 0-70%
  let textColorClass = "text-emerald-600";

  if (percentage >= 90) {
    colorClass = "bg-red-500"; // Red: 90-100%
    textColorClass = "text-red-600";
  } else if (percentage >= 70) {
    colorClass = "bg-amber-500"; // Amber: 70-90%
    textColorClass = "text-amber-600";
  }

  return { percentage, colorClass, textColorClass };
}

// Format time for display
function formatTime(time: string): string {
  // Handle both HH:mm:ss and HH:mm formats
  const parts = time.split(":");
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

// Check if date is today or tomorrow
function getDateLabel(
  dateStr: string,
  locale: string
): { label: string; isSpecial: boolean } {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const t = texts[locale as "en" | "ar"];

  if (isToday) {
    return { label: t.today, isSpecial: true };
  }
  if (isTomorrow) {
    return { label: t.tomorrow, isSpecial: true };
  }

  // Format as "Mon 20" or "الاثنين 20"
  const formatter = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    weekday: "short",
    day: "numeric",
  });
  return { label: formatter.format(date), isSpecial: false };
}

export function SessionCard({
  session,
  onClick,
  onViewAttendees,
  showClassName = false,
  compact = false,
  className,
}: SessionCardProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];

  const statusConfig = STATUS_CONFIG[session.status];
  const statusText = {
    SCHEDULED: t.scheduled,
    IN_PROGRESS: t.inProgress,
    COMPLETED: t.completed,
    CANCELLED: t.cancelled,
  }[session.status];

  const capacityInfo = getCapacityInfo(session.bookedCount, session.capacity);
  const dateLabel = getDateLabel(session.date, locale);
  const isFull = session.availableSpots === 0;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between gap-4 p-3 rounded-lg border",
          "bg-card hover:bg-accent/50 transition-colors text-left",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm">{statusConfig.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </p>
            {showClassName && (
              <p className="text-xs text-muted-foreground truncate">
                <LocalizedText text={session.className} />
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-xs font-medium", capacityInfo.textColorClass)}>
            {session.bookedCount}/{session.capacity}
          </span>
          {session.waitlistCount > 0 && (
            <Badge variant="warning" className="text-xs px-1.5">
              +{session.waitlistCount}
            </Badge>
          )}
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600",
        session.status === "CANCELLED" && "opacity-60",
        className
      )}
    >
      {/* Status indicator bar */}
      <div
        className={cn(
          "h-1",
          session.status === "SCHEDULED" && "bg-sky-500",
          session.status === "IN_PROGRESS" && "bg-emerald-500",
          session.status === "COMPLETED" && "bg-slate-400",
          session.status === "CANCELLED" && "bg-red-500"
        )}
      />

      <div className="p-4">
        {/* Header: Date/Time and Status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Date label */}
            <p
              className={cn(
                "text-xs font-medium",
                dateLabel.isSpecial ? "text-sky-600" : "text-muted-foreground"
              )}
            >
              {dateLabel.label}
            </p>
            {/* Time */}
            <p className="text-lg font-semibold tracking-tight">
              {formatTime(session.startTime)} - {formatTime(session.endTime)}
            </p>
          </div>

          {/* Status badge */}
          <Badge variant={statusConfig.variant} className="shrink-0">
            <span className="mr-1">{statusConfig.icon}</span>
            {statusText}
          </Badge>
        </div>

        {/* Class name (if showing) */}
        {showClassName && (
          <div className="mt-2">
            <p className="text-sm font-medium text-foreground">
              <LocalizedText text={session.className} />
            </p>
          </div>
        )}

        {/* Capacity bar */}
        <div className="mt-4 space-y-2">
          {/* Capacity text */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                <span className={cn("font-semibold", capacityInfo.textColorClass)}>
                  {session.bookedCount}
                </span>
                /{session.capacity} {t.booked}
              </span>
            </div>
            {isFull ? (
              <Badge variant="destructive" className="text-xs">
                {t.full}
              </Badge>
            ) : (
              <span className="text-sm text-emerald-600 font-medium">
                {session.availableSpots} {t.available}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300", capacityInfo.colorClass)}
              style={{ width: `${Math.min(capacityInfo.percentage, 100)}%` }}
            />
          </div>

          {/* Waitlist info */}
          {session.waitlistCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600">
              <UserMinus className="h-3.5 w-3.5" />
              <span>
                {session.waitlistCount} {t.waitlisted}
              </span>
            </div>
          )}
        </div>

        {/* Trainer info */}
        {session.trainerName && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <UserCheck className="h-4 w-4" />
            <LocalizedText text={session.trainerName} />
          </div>
        )}

        {/* Location info */}
        {session.locationName && (
          <div className="mt-1 text-xs text-muted-foreground">
            <LocalizedText text={session.locationName} />
          </div>
        )}

        {/* Actions */}
        {onViewAttendees && session.status !== "CANCELLED" && (
          <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAttendees}
              className="w-full justify-center text-sky-600 hover:text-sky-700 hover:bg-sky-50"
            >
              <Users className="h-4 w-4" />
              {t.viewAttendees}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export a grouped sessions display component
interface SessionGroupProps {
  title: string;
  sessions: ClassSession[];
  onViewAttendees?: (session: ClassSession) => void;
  showClassName?: boolean;
}

export function SessionGroup({
  title,
  sessions,
  onViewAttendees,
  showClassName = false,
}: SessionGroupProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            showClassName={showClassName}
            onViewAttendees={onViewAttendees ? () => onViewAttendees(session) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
