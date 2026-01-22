"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Edit, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ClassSchedule, DayOfWeek } from "@/types/scheduling";

interface ScheduleCalendarProps {
  schedules: ClassSchedule[];
  classId: string;
  onAddSchedule: (schedule: {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
  }) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const texts = {
  en: {
    title: "Weekly Schedule",
    addSchedule: "Add Schedule",
    editSchedule: "Edit Schedule",
    deleteSchedule: "Delete Schedule",
    noSchedules: "No schedules yet",
    noSchedulesDesc: "Add a recurring schedule to automatically generate sessions",
    dayOfWeek: "Day of Week",
    startTime: "Start Time",
    endTime: "End Time",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this schedule?",
    scheduleAdded: "Schedule added successfully",
    scheduleDeleted: "Schedule deleted successfully",
    error: "An error occurred",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunShort: "SUN",
    monShort: "MON",
    tueShort: "TUE",
    wedShort: "WED",
    thuShort: "THU",
    friShort: "FRI",
    satShort: "SAT",
  },
  ar: {
    title: "الجدول الأسبوعي",
    addSchedule: "إضافة جدول",
    editSchedule: "تعديل الجدول",
    deleteSchedule: "حذف الجدول",
    noSchedules: "لا توجد جداول بعد",
    noSchedulesDesc: "أضف جدولاً متكررًا لإنشاء الجلسات تلقائيًا",
    dayOfWeek: "يوم الأسبوع",
    startTime: "وقت البدء",
    endTime: "وقت الانتهاء",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    deleteConfirm: "هل أنت متأكد من حذف هذا الجدول؟",
    scheduleAdded: "تم إضافة الجدول بنجاح",
    scheduleDeleted: "تم حذف الجدول بنجاح",
    error: "حدث خطأ",
    sunday: "الأحد",
    monday: "الإثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunShort: "أحد",
    monShort: "اثن",
    tueShort: "ثلا",
    wedShort: "أرب",
    thuShort: "خمي",
    friShort: "جمع",
    satShort: "سبت",
  },
};

const DAYS_ORDER: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Format time from HH:mm:ss to HH:mm
function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function ScheduleCalendar({
  schedules,
  classId,
  onAddSchedule,
  onDeleteSchedule,
  isLoading = false,
  className,
}: ScheduleCalendarProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const dayLabels: Record<DayOfWeek, string> = {
    SUNDAY: t.sunday,
    MONDAY: t.monday,
    TUESDAY: t.tuesday,
    WEDNESDAY: t.wednesday,
    THURSDAY: t.thursday,
    FRIDAY: t.friday,
    SATURDAY: t.saturday,
  };

  const dayShortLabels: Record<DayOfWeek, string> = {
    SUNDAY: t.sunShort,
    MONDAY: t.monShort,
    TUESDAY: t.tueShort,
    WEDNESDAY: t.wedShort,
    THURSDAY: t.thuShort,
    FRIDAY: t.friShort,
    SATURDAY: t.satShort,
  };

  // Group schedules by day
  const schedulesByDay = DAYS_ORDER.reduce(
    (acc, day) => {
      acc[day] = schedules.filter((s) => s.dayOfWeek === day);
      return acc;
    },
    {} as Record<DayOfWeek, ClassSchedule[]>
  );

  const handleAddSchedule = async () => {
    setIsSubmitting(true);
    try {
      await onAddSchedule({
        dayOfWeek: selectedDay,
        startTime: startTime + ":00",
        endTime: endTime + ":00",
      });
      toast({ title: t.scheduleAdded });
      setIsAddDialogOpen(false);
      // Reset form
      setSelectedDay("MONDAY");
      setStartTime("09:00");
      setEndTime("10:00");
    } catch {
      toast({ title: t.error, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm(t.deleteConfirm)) return;

    setIsDeleting(scheduleId);
    try {
      await onDeleteSchedule(scheduleId);
      toast({ title: t.scheduleDeleted });
    } catch {
      toast({ title: t.error, variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">{t.title}</CardTitle>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t.addSchedule}
        </Button>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">{t.noSchedules}</p>
            <p className="text-sm text-muted-foreground mt-1">{t.noSchedulesDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {DAYS_ORDER.map((day) => (
              <div key={day} className="min-h-[120px]">
                {/* Day header */}
                <div
                  className={cn(
                    "text-center py-2 rounded-t-lg text-xs font-semibold",
                    schedulesByDay[day].length > 0
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                      : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  )}
                >
                  {dayShortLabels[day]}
                </div>

                {/* Schedule slots */}
                <div className="border-x border-b rounded-b-lg min-h-[80px] p-1 space-y-1">
                  {schedulesByDay[day].map((schedule) => (
                    <div
                      key={schedule.id}
                      className={cn(
                        "group relative rounded p-1.5 text-xs",
                        "bg-violet-50 dark:bg-violet-900/20",
                        "border border-violet-200 dark:border-violet-800"
                      )}
                    >
                      <div className="font-medium text-violet-700 dark:text-violet-300">
                        {formatTime(schedule.startTime)}
                      </div>
                      <div className="text-violet-600/70 dark:text-violet-400/70">
                        {formatTime(schedule.endTime)}
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute -top-1 -right-1 h-5 w-5 rounded-full",
                          "bg-red-500 text-white hover:bg-red-600",
                          "opacity-0 group-hover:opacity-100 transition-opacity",
                          "shadow-sm"
                        )}
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        disabled={isDeleting === schedule.id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Schedule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addSchedule}</DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? "أضف جدولًا متكررًا جديدًا لهذا الفصل"
                : "Add a new recurring schedule for this class"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Day of Week */}
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">{t.dayOfWeek}</Label>
              <Select
                value={selectedDay}
                onValueChange={(value) => setSelectedDay(value as DayOfWeek)}
              >
                <SelectTrigger id="dayOfWeek">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_ORDER.map((day) => (
                    <SelectItem key={day} value={day}>
                      {dayLabels[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t.startTime}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t.endTime}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t.cancel}
            </Button>
            <Button onClick={handleAddSchedule} disabled={isSubmitting}>
              {isSubmitting ? "..." : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
