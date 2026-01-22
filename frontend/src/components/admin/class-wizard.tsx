"use client";

import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Users,
  MapPin,
  UserCheck,
  Calendar,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLocations, useUsers } from "@/queries";
import type { DayOfWeek } from "@/types/scheduling";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Zod schema for class form
const classFormSchema = z.object({
  name: z.object({
    en: z.string().min(1, "Class name is required"),
    ar: z.string().optional(),
  }),
  description: z
    .object({
      en: z.string().optional(),
      ar: z.string().optional(),
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
          "SUNDAY",
          "MONDAY",
          "TUESDAY",
          "WEDNESDAY",
          "THURSDAY",
          "FRIDAY",
          "SATURDAY",
        ]),
        startTime: z.string().min(1, "Start time is required"),
        endTime: z.string().min(1, "End time is required"),
      })
    )
    .optional(),
});

export type ClassWizardData = z.infer<typeof classFormSchema>;

interface ClassWizardProps {
  onSubmit: (data: ClassWizardData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const texts = {
  en: {
    step1: "Basic Info",
    step2: "Settings",
    step3: "Schedule",
    step4: "Review",
    next: "Next",
    back: "Back",
    skip: "Skip",
    create: "Create Class",
    creating: "Creating...",
    cancel: "Cancel",
    // Step 1
    classNameEn: "Class Name (English)",
    classNameAr: "Class Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    capacity: "Capacity",
    capacityHint: "Maximum number of members per session",
    duration: "Duration",
    durationHint: "Class duration in minutes",
    minutes: "min",
    // Step 2
    trainer: "Trainer",
    trainerHint: "Assign a trainer to this class",
    selectTrainer: "Select trainer",
    noTrainer: "No trainer assigned",
    location: "Location",
    locationHint: "Where will this class be held",
    selectLocation: "Select location",
    noLocation: "No location assigned",
    // Step 3
    scheduleTitle: "Weekly Schedule",
    scheduleHint: "Add recurring time slots for this class",
    addSchedule: "Add Time Slot",
    dayOfWeek: "Day",
    startTime: "Start",
    endTime: "End",
    noSchedules: "No schedules added yet",
    noSchedulesHint: "You can add schedules later from the class details page",
    // Step 4
    reviewTitle: "Review & Create",
    reviewHint: "Review the class details before creating",
    basicInfo: "Basic Information",
    settings: "Settings",
    schedules: "Schedules",
    notSet: "Not set",
    // Days
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunShort: "Sun",
    monShort: "Mon",
    tueShort: "Tue",
    wedShort: "Wed",
    thuShort: "Thu",
    friShort: "Fri",
    satShort: "Sat",
  },
  ar: {
    step1: "المعلومات الأساسية",
    step2: "الإعدادات",
    step3: "الجدول",
    step4: "المراجعة",
    next: "التالي",
    back: "السابق",
    skip: "تخطي",
    create: "إنشاء الفصل",
    creating: "جاري الإنشاء...",
    cancel: "إلغاء",
    // Step 1
    classNameEn: "اسم الفصل (إنجليزي)",
    classNameAr: "اسم الفصل (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    capacity: "السعة",
    capacityHint: "الحد الأقصى لعدد الأعضاء في كل جلسة",
    duration: "المدة",
    durationHint: "مدة الفصل بالدقائق",
    minutes: "دقيقة",
    // Step 2
    trainer: "المدرب",
    trainerHint: "تعيين مدرب لهذا الفصل",
    selectTrainer: "اختر المدرب",
    noTrainer: "لم يتم تعيين مدرب",
    location: "الموقع",
    locationHint: "أين سيعقد هذا الفصل",
    selectLocation: "اختر الموقع",
    noLocation: "لم يتم تحديد الموقع",
    // Step 3
    scheduleTitle: "الجدول الأسبوعي",
    scheduleHint: "أضف أوقات متكررة لهذا الفصل",
    addSchedule: "إضافة وقت",
    dayOfWeek: "اليوم",
    startTime: "البداية",
    endTime: "النهاية",
    noSchedules: "لم تتم إضافة جداول بعد",
    noSchedulesHint: "يمكنك إضافة الجداول لاحقًا من صفحة تفاصيل الفصل",
    // Step 4
    reviewTitle: "المراجعة والإنشاء",
    reviewHint: "راجع تفاصيل الفصل قبل الإنشاء",
    basicInfo: "المعلومات الأساسية",
    settings: "الإعدادات",
    schedules: "الجداول",
    notSet: "غير محدد",
    // Days
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

const STEPS = [
  { id: 1, icon: Clock },
  { id: 2, icon: UserCheck },
  { id: 3, icon: Calendar },
  { id: 4, icon: Check },
];

export function ClassWizard({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClassWizardProps) {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const isRTL = locale === "ar";

  const [currentStep, setCurrentStep] = useState(1);

  // Fetch data for dropdowns
  const { data: locationsData } = useLocations({ size: 100 });
  const { data: usersData } = useUsers({ size: 100 });

  // Filter users to get trainers (STAFF role or any user for now)
  const trainers = useMemo(() => {
    return usersData?.content?.filter((u) => u.role === "STAFF") ?? [];
  }, [usersData]);

  const locations = locationsData?.content ?? [];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ClassWizardData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: { en: "", ar: "" },
      description: { en: "", ar: "" },
      capacity: 20,
      durationMinutes: 60,
      trainerId: undefined,
      locationId: undefined,
      schedules: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "schedules",
  });

  const formValues = watch();

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

  const stepTitles = [t.step1, t.step2, t.step3, t.step4];

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(["name.en", "capacity", "durationMinutes"]);
      if (!isValid) return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit);

  // Get selected trainer and location names for review
  const selectedTrainer = trainers.find((t) => t.id === formValues.trainerId);
  const selectedLocation = locations.find((l) => l.id === formValues.locationId);

  return (
    <div className="space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    isCompleted &&
                      "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent &&
                      "bg-primary border-primary text-primary-foreground",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "w-12 h-0.5 mx-2",
                      currentStep > step.id
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/30"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {locale === "ar" ? "الخطوة" : "Step"} {currentStep}: {stepTitles[currentStep - 1]}
        </h2>
      </div>

      {/* Step Content */}
      <form onSubmit={handleFormSubmit}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t.step1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name.en">{t.classNameEn} *</Label>
                  <Input
                    id="name.en"
                    {...register("name.en")}
                    placeholder="Yoga Class"
                    className={cn(errors.name?.en && "border-destructive")}
                  />
                  {errors.name?.en && (
                    <p className="text-sm text-destructive">
                      {errors.name.en.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name.ar">{t.classNameAr}</Label>
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
                  <Label htmlFor="description.en">{t.descriptionEn}</Label>
                  <Textarea
                    id="description.en"
                    {...register("description.en")}
                    rows={3}
                    placeholder="A relaxing yoga class for all levels..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description.ar">{t.descriptionAr}</Label>
                  <Textarea
                    id="description.ar"
                    {...register("description.ar")}
                    rows={3}
                    dir="rtl"
                    placeholder="فصل يوغا مريح لجميع المستويات..."
                  />
                </div>
              </div>

              {/* Capacity and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capacity">{t.capacity} *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      {...register("capacity")}
                      className={cn(
                        "ps-10",
                        errors.capacity && "border-destructive"
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.capacityHint}</p>
                  {errors.capacity && (
                    <p className="text-sm text-destructive">
                      {errors.capacity.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">{t.duration} *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="durationMinutes"
                      type="number"
                      min={15}
                      step={15}
                      {...register("durationMinutes")}
                      className={cn(
                        "ps-10",
                        errors.durationMinutes && "border-destructive"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {t.minutes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.durationHint}</p>
                  {errors.durationMinutes && (
                    <p className="text-sm text-destructive">
                      {errors.durationMinutes.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Settings */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                {t.step2}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Trainer */}
              <div className="space-y-2">
                <Label>{t.trainer}</Label>
                <Select
                  value={formValues.trainerId || ""}
                  onValueChange={(value) =>
                    setValue("trainerId", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t.selectTrainer} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {trainer.displayName?.en || trainer.displayName?.ar || trainer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t.trainerHint}</p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>{t.location}</Label>
                <Select
                  value={formValues.locationId || ""}
                  onValueChange={(value) =>
                    setValue("locationId", value || undefined)
                  }
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={t.selectLocation} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name?.en || location.name?.ar || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t.locationHint}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Schedule */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t.scheduleTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t.scheduleHint}</p>

              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">{t.noSchedules}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t.noSchedulesHint}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex flex-col sm:flex-row gap-3 p-4 border rounded-lg bg-muted/30"
                    >
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.dayOfWeek}
                        </Label>
                        <Select
                          value={watch(`schedules.${index}.dayOfWeek`)}
                          onValueChange={(value) =>
                            setValue(
                              `schedules.${index}.dayOfWeek`,
                              value as DayOfWeek
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
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
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.startTime}
                        </Label>
                        <Input
                          type="time"
                          {...register(`schedules.${index}.startTime`)}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">
                          {t.endTime}
                        </Label>
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
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                className="w-full"
              >
                <Plus className="h-4 w-4 me-2" />
                {t.addSchedule}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-primary" />
                  {t.reviewTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{t.reviewHint}</p>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t.basicInfo}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t.classNameEn}
                      </p>
                      <p className="font-medium">
                        {formValues.name?.en || t.notSet}
                      </p>
                    </div>
                    {formValues.name?.ar && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.classNameAr}
                        </p>
                        <p className="font-medium" dir="rtl">
                          {formValues.name.ar}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">{t.capacity}</p>
                      <p className="font-medium">{formValues.capacity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.duration}</p>
                      <p className="font-medium">
                        {formValues.durationMinutes} {t.minutes}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Settings */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    {t.settings}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 ps-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.trainer}</p>
                      <p className="font-medium">
                        {selectedTrainer
                          ? selectedTrainer.displayName?.en || selectedTrainer.displayName?.ar || selectedTrainer.email
                          : t.noTrainer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.location}</p>
                      <p className="font-medium">
                        {selectedLocation
                          ? selectedLocation.name?.en ||
                            selectedLocation.name?.ar ||
                            "Unnamed"
                          : t.noLocation}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t my-4" />

                {/* Schedules */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t.schedules}
                  </h3>
                  <div className="ps-6">
                    {formValues.schedules && formValues.schedules.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formValues.schedules.map((schedule, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {dayShortLabels[schedule.dayOfWeek]}:{" "}
                            {schedule.startTime} - {schedule.endTime}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t.noSchedules}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <div>
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                {isRTL ? (
                  <ArrowRight className="h-4 w-4 me-2" />
                ) : (
                  <ArrowLeft className="h-4 w-4 me-2" />
                )}
                {t.back}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t.cancel}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === 3 && (
              <Button type="button" variant="ghost" onClick={handleNext}>
                {t.skip}
              </Button>
            )}
            {currentStep < 4 ? (
              <Button type="button" onClick={handleNext}>
                {t.next}
                {isRTL ? (
                  <ArrowLeft className="h-4 w-4 ms-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 ms-2" />
                )}
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 me-2" />
                    {t.create}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
