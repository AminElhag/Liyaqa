"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Clock, Users, Calendar, MoreVertical, Eye, Edit, Power, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalizedText, useLocalizedText } from "@/components/ui/localized-text";
import type { GymClass, ClassStatus, DayOfWeek } from "@/types/scheduling";

interface ClassCardProps {
  gymClass: GymClass;
  onView: () => void;
  onEdit: () => void;
  onStatusChange: (action: "activate" | "deactivate" | "archive") => void;
  className?: string;
}

const texts = {
  en: {
    view: "View Details",
    edit: "Edit Class",
    activate: "Activate",
    deactivate: "Deactivate",
    archive: "Archive",
    active: "Active",
    inactive: "Inactive",
    cancelled: "Archived",
    min: "min",
    capacity: "capacity",
    schedules: "schedules",
    noSchedules: "No schedules",
    perWeek: "per week",
  },
  ar: {
    view: "عرض التفاصيل",
    edit: "تعديل الفصل",
    activate: "تفعيل",
    deactivate: "إلغاء التفعيل",
    archive: "أرشفة",
    active: "نشط",
    inactive: "غير نشط",
    cancelled: "مؤرشف",
    min: "دقيقة",
    capacity: "السعة",
    schedules: "جداول",
    noSchedules: "لا توجد جداول",
    perWeek: "أسبوعيًا",
  },
};

// Class type icons mapping
const CLASS_TYPE_ICONS: Record<string, string> = {
  YOGA: "🧘",
  GROUP_FITNESS: "💪",
  PERSONAL_TRAINING: "🏋️",
  PILATES: "🤸",
  SPINNING: "🚴",
  CROSSFIT: "🔥",
  SWIMMING: "🏊",
  MARTIAL_ARTS: "🥋",
  DANCE: "💃",
  OTHER: "📋",
};

// Status badge variants
const STATUS_VARIANTS: Record<ClassStatus, "success" | "secondary" | "destructive"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  CANCELLED: "destructive",
};

// Day abbreviations for schedule bar
const DAY_ORDER: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const DAY_ABBREV: Record<DayOfWeek, { en: string; ar: string }> = {
  SUNDAY: { en: "S", ar: "أ" },
  MONDAY: { en: "M", ar: "ا" },
  TUESDAY: { en: "T", ar: "ث" },
  WEDNESDAY: { en: "W", ar: "أ" },
  THURSDAY: { en: "T", ar: "خ" },
  FRIDAY: { en: "F", ar: "ج" },
  SATURDAY: { en: "S", ar: "س" },
};

export function ClassCard({
  gymClass,
  onView,
  onEdit,
  onStatusChange,
  className,
}: ClassCardProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isRTL = locale === "ar";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const className_ = useLocalizedText(gymClass.name, "Untitled Class");

  // Get the class type icon - default to OTHER if not set
  const classIcon = CLASS_TYPE_ICONS.OTHER;

  // Calculate schedule frequency
  const schedules = gymClass.schedules ?? [];
  const scheduleDays = new Set(schedules.map((s) => s.dayOfWeek));
  const scheduleCount = schedules.length;

  // Status text
  const statusText = {
    ACTIVE: t.active,
    INACTIVE: t.inactive,
    CANCELLED: t.cancelled,
  }[gymClass.status];

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1",
        "border-neutral-200/70 dark:border-neutral-700/70",
        className
      )}
    >
      {/* Accent bar at top based on status */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          gymClass.status === "ACTIVE" && "bg-emerald-500",
          gymClass.status === "INACTIVE" && "bg-slate-400",
          gymClass.status === "CANCELLED" && "bg-red-500"
        )}
      />

      {/* Card content */}
      <div className="p-5 pt-6">
        {/* Header row: Icon, Name, Actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Class type icon */}
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                "bg-gradient-to-br from-violet-100 to-sky-100",
                "dark:from-violet-900/30 dark:to-sky-900/30"
              )}
            >
              {classIcon}
            </div>

            {/* Class name and status */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base truncate text-foreground">
                <LocalizedText text={gymClass.name} fallback="Untitled Class" />
              </h3>
              {gymClass.name.ar && locale === "en" && (
                <p className="text-xs text-muted-foreground truncate mt-0.5" dir="rtl">
                  {gymClass.name.ar}
                </p>
              )}
              {gymClass.name.en && locale === "ar" && (
                <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">
                  {gymClass.name.en}
                </p>
              )}
            </div>
          </div>

          {/* Actions dropdown */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  isMenuOpen && "opacity-100"
                )}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-40">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4" />
                {t.view}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4" />
                {t.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {gymClass.status === "ACTIVE" && (
                <DropdownMenuItem onClick={() => onStatusChange("deactivate")}>
                  <Power className="h-4 w-4" />
                  {t.deactivate}
                </DropdownMenuItem>
              )}
              {gymClass.status === "INACTIVE" && (
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge */}
        <div className="mt-3">
          <Badge variant={STATUS_VARIANTS[gymClass.status]} className="text-xs">
            <span
              className={cn(
                "mr-1 h-1.5 w-1.5 rounded-full",
                gymClass.status === "ACTIVE" && "bg-emerald-500",
                gymClass.status === "INACTIVE" && "bg-slate-400",
                gymClass.status === "CANCELLED" && "bg-red-500"
              )}
            />
            {statusText}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-sky-500" />
            <span>
              {gymClass.durationMinutes} {t.min}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-violet-500" />
            <span>
              {gymClass.capacity} {t.capacity}
            </span>
          </div>
        </div>

        {/* Schedule frequency visualization */}
        <div className="mt-4">
          {scheduleCount > 0 ? (
            <div className="space-y-2">
              {/* Week day indicators */}
              <div className="flex items-center gap-1">
                {DAY_ORDER.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors",
                      scheduleDays.has(day)
                        ? "bg-violet-500 text-white"
                        : "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
                    )}
                    title={day}
                  >
                    {DAY_ABBREV[day][locale]}
                  </div>
                ))}
              </div>
              {/* Schedule count */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {scheduleCount} {t.schedules} {t.perWeek}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{t.noSchedules}</span>
            </div>
          )}
        </div>

        {/* Click target for view */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={onView}
            className="w-full justify-center text-sky-600 hover:text-sky-700 hover:bg-sky-50"
          >
            <Eye className="h-4 w-4" />
            {t.view}
          </Button>
        </div>
      </div>
    </Card>
  );
}
