"use client";

import { Clock, Users, User, Calendar, Tag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocalizedText } from "@/components/ui/localized-text";
import type { GymClass, ClassPricingModel, DayOfWeek } from "@/types/scheduling";
import { cn } from "@/lib/utils";

interface ClassDetailSheetProps {
  gymClass: GymClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewSchedule?: () => void;
  locale: string;
}

const texts = {
  en: {
    classDetails: "Class Details",
    about: "About this class",
    schedule: "Weekly Schedule",
    viewSchedule: "View Available Sessions",
    duration: "Duration",
    capacity: "Capacity",
    trainer: "Trainer",
    difficulty: "Difficulty",
    pricing: "Pricing",
    minutes: "min",
    members: "members",
    noDescription: "No description available",
    noSchedule: "No regular schedule set",
    // Days
    SUNDAY: "Sunday",
    MONDAY: "Monday",
    TUESDAY: "Tuesday",
    WEDNESDAY: "Wednesday",
    THURSDAY: "Thursday",
    FRIDAY: "Friday",
    SATURDAY: "Saturday",
    // Difficulty levels
    BEGINNER: "Beginner",
    INTERMEDIATE: "Intermediate",
    ADVANCED: "Advanced",
    ALL_LEVELS: "All Levels",
    // Pricing models
    INCLUDED_IN_MEMBERSHIP: "Included in Membership",
    PAY_PER_ENTRY: "Pay per Entry",
    CLASS_PACK_ONLY: "Class Pack Only",
    HYBRID: "Multiple Options",
  },
  ar: {
    classDetails: "تفاصيل الحصة",
    about: "عن هذه الحصة",
    schedule: "الجدول الأسبوعي",
    viewSchedule: "عرض الحصص المتاحة",
    duration: "المدة",
    capacity: "السعة",
    trainer: "المدرب",
    difficulty: "المستوى",
    pricing: "التسعير",
    minutes: "دقيقة",
    members: "أعضاء",
    noDescription: "لا يوجد وصف",
    noSchedule: "لم يتم تحديد جدول منتظم",
    // Days
    SUNDAY: "الأحد",
    MONDAY: "الإثنين",
    TUESDAY: "الثلاثاء",
    WEDNESDAY: "الأربعاء",
    THURSDAY: "الخميس",
    FRIDAY: "الجمعة",
    SATURDAY: "السبت",
    // Difficulty levels
    BEGINNER: "مبتدئ",
    INTERMEDIATE: "متوسط",
    ADVANCED: "متقدم",
    ALL_LEVELS: "جميع المستويات",
    // Pricing models
    INCLUDED_IN_MEMBERSHIP: "مضمّن في العضوية",
    PAY_PER_ENTRY: "دفع لكل حصة",
    CLASS_PACK_ONLY: "باقة حصص فقط",
    HYBRID: "خيارات متعددة",
  },
};

function getDifficultyBadgeColor(level: string) {
  switch (level) {
    case "BEGINNER":
      return "bg-green-500/10 text-green-600 border-green-500/20";
    case "INTERMEDIATE":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    case "ADVANCED":
      return "bg-red-500/10 text-red-600 border-red-500/20";
    case "ALL_LEVELS":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "";
  }
}

function getPricingBadgeColor(pricingModel: ClassPricingModel) {
  switch (pricingModel) {
    case "INCLUDED_IN_MEMBERSHIP":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "PAY_PER_ENTRY":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "CLASS_PACK_ONLY":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20";
    case "HYBRID":
      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    default:
      return "";
  }
}

export function ClassDetailSheet({
  gymClass,
  open,
  onOpenChange,
  onViewSchedule,
  locale,
}: ClassDetailSheetProps) {
  const t = texts[locale as "en" | "ar"] || texts.en;

  if (!gymClass) return null;

  const formatTime = (time: string) => time.slice(0, 5);

  // Group schedules by day
  const schedulesByDay = gymClass.schedules?.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<DayOfWeek, typeof gymClass.schedules>);

  // Order days starting from Sunday
  const orderedDays: DayOfWeek[] = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          {/* Color bar */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: gymClass.colorCode || "#6366f1" }}
          />

          <SheetTitle className="mt-4">
            <LocalizedText text={gymClass.name} />
          </SheetTitle>
          {gymClass.trainerName && (
            <SheetDescription>
              <LocalizedText text={gymClass.trainerName} />
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("text-xs", getDifficultyBadgeColor(gymClass.difficultyLevel))}
            >
              {t[gymClass.difficultyLevel as keyof typeof t] || gymClass.difficultyLevel}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-xs", getPricingBadgeColor(gymClass.pricingModel))}
            >
              {t[gymClass.pricingModel as keyof typeof t] || gymClass.pricingModel}
            </Badge>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t.duration}</p>
                <p className="font-medium">
                  {gymClass.durationMinutes} {t.minutes}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t.capacity}</p>
                <p className="font-medium">
                  {gymClass.capacity} {t.members}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{t.about}</h4>
            {gymClass.description ? (
              <p className="text-sm">
                <LocalizedText text={gymClass.description} />
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noDescription}</p>
            )}
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.schedule}
            </h4>
            {schedulesByDay && Object.keys(schedulesByDay).length > 0 ? (
              <div className="space-y-2">
                {orderedDays
                  .filter((day) => schedulesByDay[day])
                  .map((day) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="text-sm font-medium">
                        {t[day as keyof typeof t] || day}
                      </span>
                      <div className="flex gap-2">
                        {schedulesByDay[day]?.map((schedule, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {formatTime(schedule.startTime)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t.noSchedule}</p>
            )}
          </div>

          {/* Pricing info */}
          {gymClass.dropInPrice && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t.pricing}
              </h4>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-lg font-semibold">
                  {new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
                    style: "currency",
                    currency: gymClass.dropInPrice.currency,
                  }).format(gymClass.dropInPrice.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "للحصة الواحدة" : "per session"}
                </p>
              </div>
            </div>
          )}

          {/* View Schedule Button */}
          {onViewSchedule && (
            <Button className="w-full" onClick={onViewSchedule}>
              <Calendar className="h-4 w-4 me-2" />
              {t.viewSchedule}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
