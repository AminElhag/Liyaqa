"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Trash2, Loader2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@liyaqa/shared/components/ui/dialog";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useAddSchedule, useDeleteSchedule } from "@liyaqa/shared/queries";
import type { GymClass, DayOfWeek } from "@liyaqa/shared/types/scheduling";

interface ScheduleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gymClass: GymClass;
}

const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function ScheduleManagementDialog({
  open,
  onOpenChange,
  gymClass,
}: ScheduleManagementDialogProps) {
  const locale = useLocale();
  const { toast } = useToast();

  const addSchedule = useAddSchedule();
  const deleteSchedule = useDeleteSchedule();

  // Form state for new schedule
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: "MONDAY" as DayOfWeek,
    startTime: "09:00",
    endTime: "10:00",
  });

  const texts = {
    title: locale === "ar" ? "إدارة الجدول" : "Manage Schedules",
    description:
      locale === "ar"
        ? "إضافة أو إزالة أوقات الجلسات المتكررة"
        : "Add or remove recurring session times",
    currentSchedules:
      locale === "ar" ? "الجدول الحالي" : "Current Schedules",
    noSchedules:
      locale === "ar" ? "لا يوجد جدول محدد" : "No schedules defined",
    addNew: locale === "ar" ? "إضافة جدول جديد" : "Add New Schedule",
    day: locale === "ar" ? "اليوم" : "Day",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    add: locale === "ar" ? "إضافة" : "Add",
    delete: locale === "ar" ? "حذف" : "Delete",
    close: locale === "ar" ? "إغلاق" : "Close",
    adding: locale === "ar" ? "جاري الإضافة..." : "Adding...",
    addSuccess: locale === "ar" ? "تمت إضافة الجدول" : "Schedule added",
    addError:
      locale === "ar" ? "فشل في إضافة الجدول" : "Failed to add schedule",
    deleteSuccess: locale === "ar" ? "تم حذف الجدول" : "Schedule removed",
    deleteError:
      locale === "ar" ? "فشل في حذف الجدول" : "Failed to remove schedule",
    confirmDelete:
      locale === "ar"
        ? "هل أنت متأكد من حذف هذا الجدول؟"
        : "Are you sure you want to delete this schedule?",
    dayLabels: {
      MONDAY: locale === "ar" ? "الإثنين" : "Monday",
      TUESDAY: locale === "ar" ? "الثلاثاء" : "Tuesday",
      WEDNESDAY: locale === "ar" ? "الأربعاء" : "Wednesday",
      THURSDAY: locale === "ar" ? "الخميس" : "Thursday",
      FRIDAY: locale === "ar" ? "الجمعة" : "Friday",
      SATURDAY: locale === "ar" ? "السبت" : "Saturday",
      SUNDAY: locale === "ar" ? "الأحد" : "Sunday",
    } as Record<DayOfWeek, string>,
  };

  const handleAddSchedule = async () => {
    try {
      await addSchedule.mutateAsync({
        classId: gymClass.id,
        schedule: newSchedule,
      });
      toast({
        title: texts.addSuccess,
      });
      // Reset form to defaults
      setNewSchedule({
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "10:00",
      });
    } catch {
      toast({
        title: texts.addError,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm(texts.confirmDelete)) return;

    try {
      await deleteSchedule.mutateAsync({
        classId: gymClass.id,
        scheduleId,
      });
      toast({
        title: texts.deleteSuccess,
      });
    } catch {
      toast({
        title: texts.deleteError,
        variant: "destructive",
      });
    }
  };

  const schedules = gymClass.schedules ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {texts.title}
          </DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Schedules */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {texts.currentSchedules}
            </Label>

            {schedules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg bg-muted/30">
                {texts.noSchedules}
              </p>
            ) : (
              <div className="space-y-2">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">
                        {texts.dayLabels[schedule.dayOfWeek]}
                      </Badge>
                      <span className="font-mono text-sm">
                        {schedule.startTime} - {schedule.endTime}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      disabled={deleteSchedule.isPending}
                    >
                      {deleteSchedule.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Schedule */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base font-semibold">{texts.addNew}</Label>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {texts.day}
                </Label>
                <Select
                  value={newSchedule.dayOfWeek}
                  onValueChange={(value) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      dayOfWeek: value as DayOfWeek,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {texts.dayLabels[day]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {texts.startTime}
                </Label>
                <Input
                  type="time"
                  value={newSchedule.startTime}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {texts.endTime}
                </Label>
                <Input
                  type="time"
                  value={newSchedule.endTime}
                  onChange={(e) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleAddSchedule}
              disabled={addSchedule.isPending}
              className="w-full"
            >
              {addSchedule.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {texts.adding}
                </>
              ) : (
                <>
                  <Plus className="me-2 h-4 w-4" />
                  {texts.add}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {texts.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
