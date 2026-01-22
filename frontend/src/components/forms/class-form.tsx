"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GymClass, DayOfWeek } from "@/types/scheduling";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// Zod schema for class form
const classFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "Class name (English) is required"),
    ar: z.string().nullish(),
  }),
  description: z
    .object({
      en: z.string(),
      ar: z.string().nullish(),
    })
    .optional(),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  durationMinutes: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  trainerId: z.string().optional(),
  locationId: z.string().optional(),
  schedules: z
    .array(
      z.object({
        dayOfWeek: z.enum([
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
          "SUNDAY",
        ]),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
      })
    )
    .optional(),
});

export type ClassFormData = z.infer<typeof classFormSchema>;

interface ClassFormProps {
  gymClass?: GymClass;
  onSubmit: (data: ClassFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Hide schedule section (for edit mode where schedules are managed separately) */
  hideSchedules?: boolean;
}

export function ClassForm({
  gymClass,
  onSubmit,
  onCancel,
  isSubmitting = false,
  hideSchedules = false,
}: ClassFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: {
        en: gymClass?.name?.en || "",
        ar: gymClass?.name?.ar || "",
      },
      description: gymClass?.description
        ? {
            en: gymClass.description.en || "",
            ar: gymClass.description.ar || "",
          }
        : { en: "", ar: "" },
      capacity: gymClass?.capacity || 20,
      durationMinutes: gymClass?.durationMinutes || 60,
      trainerId: gymClass?.trainerId || undefined,
      locationId: gymClass?.locationId || undefined,
      schedules: gymClass?.schedules?.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const texts = {
    title: locale === "ar" ? "معلومات الفصل" : "Class Information",
    description:
      locale === "ar"
        ? "أدخل تفاصيل الفصل الدراسي"
        : "Enter the class details",
    nameEn: locale === "ar" ? "اسم الفصل (إنجليزي)" : "Class Name (EN)",
    nameAr: locale === "ar" ? "اسم الفصل (عربي)" : "Class Name (AR)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (EN)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (AR)",
    capacity: locale === "ar" ? "السعة" : "Capacity",
    duration: locale === "ar" ? "المدة (دقيقة)" : "Duration (minutes)",
    scheduleTitle: locale === "ar" ? "الجدول" : "Schedule",
    scheduleDescription:
      locale === "ar"
        ? "أضف أوقات الفصل الأسبوعية"
        : "Add weekly class times",
    addSchedule: locale === "ar" ? "إضافة وقت" : "Add Time Slot",
    dayOfWeek: locale === "ar" ? "اليوم" : "Day",
    startTime: locale === "ar" ? "وقت البدء" : "Start Time",
    endTime: locale === "ar" ? "وقت الانتهاء" : "End Time",
    cancel: locale === "ar" ? "إلغاء" : "Cancel",
    save: locale === "ar" ? "حفظ" : "Save",
    saving: locale === "ar" ? "جاري الحفظ..." : "Saving...",
    monday: locale === "ar" ? "الإثنين" : "Monday",
    tuesday: locale === "ar" ? "الثلاثاء" : "Tuesday",
    wednesday: locale === "ar" ? "الأربعاء" : "Wednesday",
    thursday: locale === "ar" ? "الخميس" : "Thursday",
    friday: locale === "ar" ? "الجمعة" : "Friday",
    saturday: locale === "ar" ? "السبت" : "Saturday",
    sunday: locale === "ar" ? "الأحد" : "Sunday",
    selectDay: locale === "ar" ? "اختر اليوم" : "Select day",
  };

  const dayLabels: Record<DayOfWeek, string> = {
    MONDAY: texts.monday,
    TUESDAY: texts.tuesday,
    WEDNESDAY: texts.wednesday,
    THURSDAY: texts.thursday,
    FRIDAY: texts.friday,
    SATURDAY: texts.saturday,
    SUNDAY: texts.sunday,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name.en">{texts.nameEn} *</Label>
              <Input
                id="name.en"
                {...register("name.en")}
                placeholder="Yoga Class"
              />
              {errors.name?.en && (
                <p className="text-sm text-destructive">
                  {errors.name.en.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name.ar">{texts.nameAr}</Label>
              <Input
                id="name.ar"
                {...register("name.ar")}
                placeholder="فصل اليوغا"
                dir="rtl"
              />
            </div>
          </div>

          {/* Description fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description.en">{texts.descriptionEn}</Label>
              <Textarea
                id="description.en"
                {...register("description.en")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description.ar">{texts.descriptionAr}</Label>
              <Textarea
                id="description.ar"
                {...register("description.ar")}
                rows={3}
                dir="rtl"
              />
            </div>
          </div>

          {/* Capacity and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="capacity">{texts.capacity} *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                {...register("capacity")}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">
                  {errors.capacity.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">{texts.duration} *</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={15}
                step={15}
                {...register("durationMinutes")}
              />
              {errors.durationMinutes && (
                <p className="text-sm text-destructive">
                  {errors.durationMinutes.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule - Only show when not in edit mode */}
      {!hideSchedules && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.scheduleTitle}</CardTitle>
            <CardDescription>{texts.scheduleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <Label>{texts.dayOfWeek}</Label>
                  <Select
                    value={watch(`schedules.${index}.dayOfWeek`)}
                    onValueChange={(value) =>
                      setValue(`schedules.${index}.dayOfWeek`, value as DayOfWeek)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={texts.selectDay} />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>
                          {dayLabels[day]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{texts.startTime}</Label>
                  <Input
                    type="time"
                    {...register(`schedules.${index}.startTime`)}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>{texts.endTime}</Label>
                  <Input
                    type="time"
                    {...register(`schedules.${index}.endTime`)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  dayOfWeek: "MONDAY",
                  startTime: "09:00",
                  endTime: "10:00",
                })
              }
            >
              <Plus className="me-2 h-4 w-4" />
              {texts.addSchedule}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {texts.cancel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? texts.saving : texts.save}
        </Button>
      </div>
    </form>
  );
}
