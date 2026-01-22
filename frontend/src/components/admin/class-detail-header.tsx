"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Users,
  Calendar,
  MapPin,
  UserCheck,
  MoreVertical,
  Edit,
  Power,
  Archive,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalizedText } from "@/components/ui/localized-text";
import type { GymClass, ClassStatus } from "@/types/scheduling";

interface ClassDetailHeaderProps {
  gymClass: GymClass;
  onEdit?: () => void;
  onStatusChange?: (action: "activate" | "deactivate" | "archive") => void;
  onDelete?: () => void;
  bookingsThisWeek?: number;
  className?: string;
}

const texts = {
  en: {
    backToClasses: "Back to Classes",
    edit: "Edit Class",
    activate: "Activate",
    deactivate: "Deactivate",
    archive: "Archive",
    delete: "Delete Class",
    active: "Active",
    inactive: "Inactive",
    cancelled: "Archived",
    min: "min",
    capacity: "capacity",
    schedules: "schedules",
    bookedThisWeek: "booked this week",
    status: "Status",
    duration: "Duration",
    trainer: "Trainer",
    location: "Location",
    noTrainer: "Not assigned",
    noLocation: "Not specified",
  },
  ar: {
    backToClasses: "العودة للفصول",
    edit: "تعديل الفصل",
    activate: "تفعيل",
    deactivate: "إلغاء التفعيل",
    archive: "أرشفة",
    delete: "حذف الفصل",
    active: "نشط",
    inactive: "غير نشط",
    cancelled: "مؤرشف",
    min: "دقيقة",
    capacity: "السعة",
    schedules: "جداول",
    bookedThisWeek: "محجوز هذا الأسبوع",
    status: "الحالة",
    duration: "المدة",
    trainer: "المدرب",
    location: "الموقع",
    noTrainer: "غير معين",
    noLocation: "غير محدد",
  },
};

// Status badge variants
const STATUS_CONFIG: Record<
  ClassStatus,
  {
    variant: "success" | "secondary" | "destructive";
    dotColor: string;
    bgGradient: string;
  }
> = {
  ACTIVE: {
    variant: "success",
    dotColor: "bg-emerald-500",
    bgGradient: "from-emerald-500/10 to-sky-500/10",
  },
  INACTIVE: {
    variant: "secondary",
    dotColor: "bg-slate-400",
    bgGradient: "from-slate-500/10 to-slate-400/10",
  },
  CANCELLED: {
    variant: "destructive",
    dotColor: "bg-red-500",
    bgGradient: "from-red-500/10 to-rose-500/10",
  },
};

export function ClassDetailHeader({
  gymClass,
  onEdit,
  onStatusChange,
  onDelete,
  bookingsThisWeek = 0,
  className,
}: ClassDetailHeaderProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isRTL = locale === "ar";

  const statusConfig = STATUS_CONFIG[gymClass.status] ?? STATUS_CONFIG.INACTIVE;
  const statusText = {
    ACTIVE: t.active,
    INACTIVE: t.inactive,
    CANCELLED: t.cancelled,
  }[gymClass.status] ?? t.inactive;

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Back link */}
      <Link
        href={`/${locale}/classes`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <BackArrow className="h-4 w-4" />
        {t.backToClasses}
      </Link>

      {/* Hero card */}
      <div
        className={cn(
          "relative rounded-2xl border bg-card overflow-hidden",
          "bg-gradient-to-br",
          statusConfig.bgGradient
        )}
      >
        {/* Status bar */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1",
            gymClass.status === "ACTIVE" && "bg-emerald-500",
            gymClass.status === "INACTIVE" && "bg-slate-400",
            gymClass.status === "CANCELLED" && "bg-red-500"
          )}
        />

        <div className="p-6 pt-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* Left side: Class info */}
            <div className="flex items-start gap-4">
              {/* Class icon */}
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl",
                  "bg-gradient-to-br from-violet-100 to-sky-100",
                  "dark:from-violet-900/40 dark:to-sky-900/40",
                  "shadow-sm"
                )}
              >
                🧘
              </div>

              {/* Class name and details */}
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground">
                  <LocalizedText text={gymClass.name} fallback="Untitled Class" />
                </h1>
                {/* Show secondary language */}
                {gymClass.name?.ar && locale === "en" && (
                  <p className="text-base text-muted-foreground mt-0.5" dir="rtl">
                    {gymClass.name.ar}
                  </p>
                )}
                {gymClass.name?.en && locale === "ar" && (
                  <p className="text-base text-muted-foreground mt-0.5" dir="ltr">
                    {gymClass.name.en}
                  </p>
                )}

                {/* Description preview */}
                {gymClass.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-lg">
                    <LocalizedText text={gymClass.description} />
                  </p>
                )}
              </div>
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                  {t.edit}
                </Button>
              )}
              {(onStatusChange || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? "start" : "end"}>
                    {onStatusChange && gymClass.status === "ACTIVE" && (
                      <DropdownMenuItem onClick={() => onStatusChange("deactivate")}>
                        <Power className="h-4 w-4" />
                        {t.deactivate}
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && gymClass.status === "INACTIVE" && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange("activate")}>
                          <Power className="h-4 w-4" />
                          {t.activate}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange("archive")}
                          className="text-destructive focus:text-destructive"
                        >
                          <Archive className="h-4 w-4" />
                          {t.archive}
                        </DropdownMenuItem>
                      </>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={onDelete}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t.delete}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Stats cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {/* Status */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  "bg-white dark:bg-neutral-900"
                )}
              >
                <span
                  className={cn(
                    "h-3 w-3 rounded-full",
                    statusConfig.dotColor,
                    gymClass.status === "ACTIVE" && "animate-pulse"
                  )}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.status}</p>
                <p className="font-semibold">{statusText}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  "bg-white dark:bg-neutral-900"
                )}
              >
                <Clock className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.duration}</p>
                <p className="font-semibold">
                  {gymClass.durationMinutes} {t.min}
                </p>
              </div>
            </div>

            {/* Capacity */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  "bg-white dark:bg-neutral-900"
                )}
              >
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.capacity}</p>
                <p className="font-semibold">{gymClass.capacity}</p>
              </div>
            </div>

            {/* Bookings this week */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm">
              <div
                className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  "bg-white dark:bg-neutral-900"
                )}
              >
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t.bookedThisWeek}</p>
                <p className="font-semibold">{bookingsThisWeek}</p>
              </div>
            </div>
          </div>

          {/* Additional info row */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-neutral-200/50 dark:border-neutral-700/50 text-sm text-muted-foreground">
            {/* Trainer */}
            <div className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" />
              <span>
                {t.trainer}:{" "}
                {gymClass.trainerName ? (
                  <LocalizedText
                    text={gymClass.trainerName}
                    className="text-foreground font-medium"
                  />
                ) : (
                  <span className="italic">{t.noTrainer}</span>
                )}
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>
                {t.location}:{" "}
                {gymClass.locationName ? (
                  <LocalizedText
                    text={gymClass.locationName}
                    className="text-foreground font-medium"
                  />
                ) : (
                  <span className="italic">{t.noLocation}</span>
                )}
              </span>
            </div>

            {/* Schedules count */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                {gymClass.schedules?.length ?? 0} {t.schedules}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
