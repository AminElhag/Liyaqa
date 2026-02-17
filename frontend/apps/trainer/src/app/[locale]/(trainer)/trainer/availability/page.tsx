"use client";

import { useState, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useAuthStore } from "@liyaqa/shared/stores/auth-store";
import {
  useTrainerAvailabilitySlots,
  useSetTrainerAvailability,
} from "@liyaqa/shared/queries/use-trainer-availability";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { cn } from "@liyaqa/shared/utils";
import type { DayOfWeek, PTLocationType } from "@liyaqa/shared/types/scheduling";

const text = {
  title: { en: "Availability", ar: "التوفر" },
  subtitle: {
    en: "Manage your weekly availability for training sessions",
    ar: "إدارة توفرك الأسبوعي لجلسات التدريب",
  },
  save: { en: "Save Changes", ar: "حفظ التغييرات" },
  saving: { en: "Saving...", ar: "جاري الحفظ..." },
  addSlot: { en: "Add Slot", ar: "إضافة فترة" },
  removeSlot: { en: "Remove", ar: "حذف" },
  startTime: { en: "Start", ar: "البداية" },
  endTime: { en: "End", ar: "النهاية" },
  location: { en: "Location", ar: "الموقع" },
  club: { en: "Club", ar: "النادي" },
  home: { en: "Home Visit", ar: "زيارة منزلية" },
  noSlots: { en: "No availability set", ar: "لم يتم تحديد توفر" },
  noSlotsDesc: {
    en: "Click \"Add Slot\" to set your availability for this day.",
    ar: "اضغط \"إضافة فترة\" لتحديد توفرك لهذا اليوم.",
  },
  success: { en: "Availability updated successfully", ar: "تم تحديث التوفر بنجاح" },
  error: { en: "Failed to update availability", ar: "فشل في تحديث التوفر" },
  loading: { en: "Loading availability...", ar: "جاري تحميل التوفر..." },
  reset: { en: "Reset", ar: "إعادة تعيين" },
};

const DAYS: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const dayLabels: Record<DayOfWeek, { en: string; ar: string }> = {
  SUNDAY: { en: "Sunday", ar: "الأحد" },
  MONDAY: { en: "Monday", ar: "الاثنين" },
  TUESDAY: { en: "Tuesday", ar: "الثلاثاء" },
  WEDNESDAY: { en: "Wednesday", ar: "الأربعاء" },
  THURSDAY: { en: "Thursday", ar: "الخميس" },
  FRIDAY: { en: "Friday", ar: "الجمعة" },
  SATURDAY: { en: "Saturday", ar: "السبت" },
};

interface SlotDraft {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationType: PTLocationType;
}

export default function TrainerAvailabilityPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = (key: keyof typeof text) => (isAr ? text[key].ar : text[key].en);

  const { user } = useAuthStore();
  const trainerId = user?.id || "";
  const { toast } = useToast();

  const { data: existingSlots, isLoading } = useTrainerAvailabilitySlots(
    trainerId
  );

  const setAvailabilityMutation = useSetTrainerAvailability();

  // Local state for editing
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize slots from existing data
  useMemo(() => {
    if (existingSlots && !hasInitialized) {
      const drafts: SlotDraft[] = existingSlots
        .filter((s) => s.isRecurring)
        .map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          locationType: s.locationType,
        }));
      setSlots(drafts);
      setHasInitialized(true);
    }
  }, [existingSlots, hasInitialized]);

  const slotsByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, SlotDraft[]> = {
      SUNDAY: [],
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
    };
    for (const slot of slots) {
      grouped[slot.dayOfWeek].push(slot);
    }
    // Sort by start time within each day
    for (const day of DAYS) {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return grouped;
  }, [slots]);

  const addSlot = useCallback(
    (day: DayOfWeek) => {
      setSlots((prev) => [
        ...prev,
        {
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "10:00",
          locationType: "CLUB" as PTLocationType,
        },
      ]);
    },
    []
  );

  const removeSlot = useCallback((day: DayOfWeek, index: number) => {
    setSlots((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === day);
      const otherSlots = prev.filter((s) => s.dayOfWeek !== day);
      daySlots.splice(index, 1);
      return [...otherSlots, ...daySlots];
    });
  }, []);

  const updateSlot = useCallback(
    (day: DayOfWeek, index: number, field: keyof SlotDraft, value: string) => {
      setSlots((prev) => {
        const newSlots = [...prev];
        let dayIndex = 0;
        for (let i = 0; i < newSlots.length; i++) {
          if (newSlots[i].dayOfWeek === day) {
            if (dayIndex === index) {
              newSlots[i] = { ...newSlots[i], [field]: value };
              break;
            }
            dayIndex++;
          }
        }
        return newSlots;
      });
    },
    []
  );

  const handleSave = async () => {
    try {
      await setAvailabilityMutation.mutateAsync({
        trainerId,
        data: {
          slots: slots.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            locationType: s.locationType,
            isRecurring: true,
          })),
        },
      });
      toast({
        description: t("success"),
      });
    } catch {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: t("error"),
        variant: "destructive",
      });
    }
  };

  const handleReset = useCallback(() => {
    if (existingSlots) {
      const drafts: SlotDraft[] = existingSlots
        .filter((s) => s.isRecurring)
        .map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          locationType: s.locationType,
        }));
      setSlots(drafts);
    } else {
      setSlots([]);
    }
  }, [existingSlots]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 me-2" />
            {t("reset")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={setAvailabilityMutation.isPending}
            size="sm"
          >
            {setAvailabilityMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {t("save")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="space-y-4">
        {DAYS.map((day) => {
          const daySlots = slotsByDay[day];
          const dayLabel = isAr ? dayLabels[day].ar : dayLabels[day].en;

          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">{dayLabel}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {daySlots.length}{" "}
                      {daySlots.length === 1
                        ? isAr
                          ? "فترة"
                          : "slot"
                        : isAr
                          ? "فترات"
                          : "slots"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSlot(day)}
                  >
                    <Plus className="h-4 w-4 me-1" />
                    {t("addSlot")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {t("noSlots")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot, index) => (
                      <div
                        key={`${day}-${index}`}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                      >
                        {/* Start time */}
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(day, index, "startTime", e.target.value)
                            }
                            className="w-28 h-9 text-sm"
                          />
                        </div>

                        <span className="text-muted-foreground text-sm">-</span>

                        {/* End time */}
                        <div>
                          <Input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateSlot(day, index, "endTime", e.target.value)
                            }
                            className="w-28 h-9 text-sm"
                          />
                        </div>

                        {/* Location type */}
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <Select
                            value={slot.locationType}
                            onValueChange={(value) =>
                              updateSlot(
                                day,
                                index,
                                "locationType",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-36 h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLUB">
                                {t("club")}
                              </SelectItem>
                              <SelectItem value="HOME">
                                {t("home")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Remove button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive ms-auto shrink-0"
                          onClick={() => removeSlot(day, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom save button (mobile convenience) */}
      <div className="sticky bottom-4 flex justify-end lg:hidden">
        <Button
          onClick={handleSave}
          disabled={setAvailabilityMutation.isPending}
          className="shadow-lg"
        >
          {setAvailabilityMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 me-2" />
              {t("save")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
