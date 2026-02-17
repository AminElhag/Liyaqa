"use client";

import { useState, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  MapPin,
  Home,
  AlertCircle,
  Ban,
  Loader2,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@liyaqa/shared/components/ui/alert-dialog";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { useTrainer } from "@liyaqa/shared/queries/use-trainers";
import {
  useTrainerAvailabilitySlots,
  useSetTrainerAvailability,
  useBlockTrainerSlot,
} from "@liyaqa/shared/queries/use-trainer-availability";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { UUID } from "@liyaqa/shared/types/api";
import type { DayOfWeek, PTLocationType, SetTrainerAvailabilityRequest, BlockSlotRequest } from "@liyaqa/shared/types/scheduling";

interface SlotEntry {
  tempId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  locationType: PTLocationType;
  isRecurring: boolean;
}

const DAYS_ORDER: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<DayOfWeek, { en: string; ar: string; short: string; shortAr: string }> = {
  MONDAY: { en: "Monday", ar: "الاثنين", short: "Mon", shortAr: "اثن" },
  TUESDAY: { en: "Tuesday", ar: "الثلاثاء", short: "Tue", shortAr: "ثلا" },
  WEDNESDAY: { en: "Wednesday", ar: "الأربعاء", short: "Wed", shortAr: "أرب" },
  THURSDAY: { en: "Thursday", ar: "الخميس", short: "Thu", shortAr: "خمي" },
  FRIDAY: { en: "Friday", ar: "الجمعة", short: "Fri", shortAr: "جمع" },
  SATURDAY: { en: "Saturday", ar: "السبت", short: "Sat", shortAr: "سبت" },
  SUNDAY: { en: "Sunday", ar: "الأحد", short: "Sun", shortAr: "أحد" },
};

let idCounter = 0;
function generateTempId() {
  idCounter += 1;
  return `temp-${Date.now()}-${idCounter}`;
}

export default function TrainerAvailabilityPage() {
  const locale = useLocale() as "en" | "ar";
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as UUID;
  const isRTL = locale === "ar";

  const [slots, setSlots] = useState<SlotEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDay, setBlockDay] = useState<DayOfWeek>("MONDAY");
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndTime, setBlockEndTime] = useState("10:00");

  const { data: trainer, isLoading: isLoadingTrainer } = useTrainer(id);
  const { data: existingSlots, isLoading: isLoadingSlots } = useTrainerAvailabilitySlots(id);
  const setAvailability = useSetTrainerAvailability();
  const blockSlot = useBlockTrainerSlot();

  // Initialize slots from existing data
  useEffect(() => {
    if (existingSlots && existingSlots.length > 0) {
      const mapped: SlotEntry[] = existingSlots
        .filter((s) => s.status !== "BLOCKED")
        .map((s) => ({
          tempId: generateTempId(),
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          locationType: s.locationType || "CLUB",
          isRecurring: s.isRecurring,
        }));
      setSlots(mapped);
    }
  }, [existingSlots]);

  const texts = {
    back: locale === "ar" ? "العودة إلى المدرب" : "Back to Trainer",
    title: locale === "ar" ? "إدارة جدول التوفر" : "Manage Availability",
    description: locale === "ar" ? "تعيين أوقات توفر المدرب خلال الأسبوع" : "Set the trainer's weekly availability schedule",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Error loading data",
    notFound: locale === "ar" ? "المدرب غير موجود" : "Trainer not found",

    // Days
    addSlot: locale === "ar" ? "إضافة فترة" : "Add Slot",
    removeSlot: locale === "ar" ? "إزالة" : "Remove",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    locationType: locale === "ar" ? "الموقع" : "Location",
    club: locale === "ar" ? "النادي" : "Club",
    home: locale === "ar" ? "المنزل" : "Home",
    noSlots: locale === "ar" ? "لا توجد فترات لهذا اليوم" : "No slots for this day",

    // Actions
    save: locale === "ar" ? "حفظ التغييرات" : "Save Changes",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    blockSlot: locale === "ar" ? "حظر فترة" : "Block Slot",
    blockSlotTitle: locale === "ar" ? "حظر فترة زمنية" : "Block Time Slot",
    blockSlotDesc: locale === "ar" ? "حظر فترة زمنية محددة من جدول المدرب" : "Block a specific time slot from the trainer's schedule",
    day: locale === "ar" ? "اليوم" : "Day",
    confirm: locale === "ar" ? "تأكيد الحظر" : "Confirm Block",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",

    // Toast
    saveSuccess: locale === "ar" ? "تم حفظ الجدول بنجاح" : "Schedule saved successfully",
    saveError: locale === "ar" ? "فشل في حفظ الجدول" : "Failed to save schedule",
    blockSuccess: locale === "ar" ? "تم حظر الفترة بنجاح" : "Slot blocked successfully",
    blockError: locale === "ar" ? "فشل في حظر الفترة" : "Failed to block slot",
    unsavedChanges: locale === "ar" ? "لديك تغييرات غير محفوظة" : "You have unsaved changes",
  };

  const addSlot = useCallback((dayOfWeek: DayOfWeek) => {
    const newSlot: SlotEntry = {
      tempId: generateTempId(),
      dayOfWeek,
      startTime: "09:00",
      endTime: "10:00",
      locationType: "CLUB",
      isRecurring: true,
    };
    setSlots((prev) => [...prev, newSlot]);
    setHasUnsavedChanges(true);
  }, []);

  const removeSlot = useCallback((tempId: string) => {
    setSlots((prev) => prev.filter((s) => s.tempId !== tempId));
    setHasUnsavedChanges(true);
  }, []);

  const updateSlot = useCallback((tempId: string, field: keyof SlotEntry, value: string) => {
    setSlots((prev) =>
      prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    const request: SetTrainerAvailabilityRequest = {
      slots: slots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        locationType: s.locationType,
        isRecurring: s.isRecurring,
      })),
    };

    setAvailability.mutate(
      { trainerId: id, data: request },
      {
        onSuccess: () => {
          toast({ title: texts.saveSuccess });
          setHasUnsavedChanges(false);
        },
        onError: () => {
          toast({ title: texts.saveError, variant: "destructive" });
        },
      }
    );
  };

  const handleBlockSlot = () => {
    const today = new Date().toISOString().split("T")[0];
    const request: BlockSlotRequest = {
      dayOfWeek: blockDay,
      startTime: blockStartTime,
      endTime: blockEndTime,
      effectiveFrom: today,
    };

    blockSlot.mutate(
      { trainerId: id, data: request },
      {
        onSuccess: () => {
          toast({ title: texts.blockSuccess });
          setBlockDialogOpen(false);
        },
        onError: () => {
          toast({ title: texts.blockError, variant: "destructive" });
        },
      }
    );
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  if (isLoadingTrainer || isLoadingSlots) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-destructive">{texts.notFound}</p>
        <Button asChild variant="outline">
          <Link href={`/${locale}/trainers`}>{texts.back}</Link>
        </Button>
      </div>
    );
  }

  const trainerName = getLocalizedText(trainer.displayName, locale) || "";

  // Group slots by day for the grid display
  const slotsByDay: Record<DayOfWeek, SlotEntry[]> = {
    MONDAY: [],
    TUESDAY: [],
    WEDNESDAY: [],
    THURSDAY: [],
    FRIDAY: [],
    SATURDAY: [],
    SUNDAY: [],
  };
  slots.forEach((slot) => {
    slotsByDay[slot.dayOfWeek].push(slot);
  });

  // Blocked slots from existing data
  const blockedSlots = (existingSlots || []).filter((s) => s.status === "BLOCKED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href={`/${locale}/trainers/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BackArrow className="h-4 w-4" />
            {texts.back}
          </Link>
          <h1 className="text-2xl font-bold">{texts.title}</h1>
          <p className="text-muted-foreground">
            {trainerName} &mdash; {texts.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBlockDialogOpen(true)}
          >
            <Ban className="me-2 h-4 w-4" />
            {texts.blockSlot}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={setAvailability.isPending || !hasUnsavedChanges}
          >
            {setAvailability.isPending ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {texts.saving}
              </>
            ) : (
              <>
                <Save className="me-2 h-4 w-4" />
                {texts.save}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {texts.unsavedChanges}
        </div>
      )}

      {/* Weekly Grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {DAYS_ORDER.map((day) => {
          const daySlots = slotsByDay[day];
          const dayLabel = isRTL ? DAY_LABELS[day].ar : DAY_LABELS[day].en;
          const dayBlockedSlots = blockedSlots.filter((s) => s.dayOfWeek === day);

          return (
            <Card key={day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{dayLabel}</CardTitle>
                  <div className="flex items-center gap-2">
                    {daySlots.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {daySlots.length} {daySlots.length === 1 ? "slot" : "slots"}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => addSlot(day)}
                    >
                      <Plus className="h-3.5 w-3.5 me-1" />
                      {texts.addSlot}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {daySlots.length === 0 && dayBlockedSlots.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {texts.noSlots}
                  </p>
                )}

                {/* Available slots */}
                {daySlots.map((slot) => (
                  <div
                    key={slot.tempId}
                    className="rounded-lg border bg-background p-3 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{texts.startTime}</Label>
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlot(slot.tempId, "startTime", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{texts.endTime}</Label>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlot(slot.tempId, "endTime", e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Select
                        value={slot.locationType}
                        onValueChange={(value) =>
                          updateSlot(slot.tempId, "locationType", value)
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px] text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLUB">
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {texts.club}
                            </span>
                          </SelectItem>
                          <SelectItem value="HOME">
                            <span className="flex items-center gap-1.5">
                              <Home className="h-3 w-3" />
                              {texts.home}
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeSlot(slot.tempId)}
                      >
                        <Trash2 className="h-3.5 w-3.5 me-1" />
                        {texts.removeSlot}
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Blocked slots (read-only) */}
                {dayBlockedSlots.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive font-medium">
                        {blocked.startTime} - {blocked.endTime}
                      </span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {isRTL ? "محظور" : "Blocked"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Block Slot Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.blockSlotTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {texts.blockSlotDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{texts.day}</Label>
              <Select
                value={blockDay}
                onValueChange={(value) => setBlockDay(value as DayOfWeek)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_ORDER.map((day) => (
                    <SelectItem key={day} value={day}>
                      {isRTL ? DAY_LABELS[day].ar : DAY_LABELS[day].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{texts.startTime}</Label>
                <Input
                  type="time"
                  value={blockStartTime}
                  onChange={(e) => setBlockStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.endTime}</Label>
                <Input
                  type="time"
                  value={blockEndTime}
                  onChange={(e) => setBlockEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockSlot}
              disabled={blockSlot.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {blockSlot.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="me-2 h-4 w-4" />
              )}
              {texts.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
