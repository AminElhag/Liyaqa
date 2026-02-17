"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useLocations } from "@liyaqa/shared/queries/use-locations";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { Facility, FacilityType, GenderRestriction } from "@liyaqa/shared/types/facility";

const FACILITY_TYPES: { value: FacilityType; labelEn: string; labelAr: string }[] = [
  { value: "SWIMMING_POOL", labelEn: "Swimming Pool", labelAr: "مسبح" },
  { value: "TENNIS_COURT", labelEn: "Tennis Court", labelAr: "ملعب تنس" },
  { value: "SQUASH_COURT", labelEn: "Squash Court", labelAr: "ملعب سكواش" },
  { value: "SAUNA", labelEn: "Sauna", labelAr: "ساونا" },
  { value: "STEAM_ROOM", labelEn: "Steam Room", labelAr: "غرفة بخار" },
  { value: "JACUZZI", labelEn: "Jacuzzi", labelAr: "جاكوزي" },
  { value: "MASSAGE_ROOM", labelEn: "Massage Room", labelAr: "غرفة مساج" },
  { value: "PRIVATE_STUDIO", labelEn: "Private Studio", labelAr: "استوديو خاص" },
  { value: "BASKETBALL_COURT", labelEn: "Basketball Court", labelAr: "ملعب كرة سلة" },
  { value: "PADEL_COURT", labelEn: "Padel Court", labelAr: "ملعب بادل" },
  { value: "OTHER", labelEn: "Other", labelAr: "أخرى" },
];

const GENDER_RESTRICTIONS: { value: GenderRestriction; labelEn: string; labelAr: string }[] = [
  { value: "NONE", labelEn: "No Restriction", labelAr: "بدون تقييد" },
  { value: "MALE_ONLY", labelEn: "Male Only", labelAr: "رجال فقط" },
  { value: "FEMALE_ONLY", labelEn: "Female Only", labelAr: "نساء فقط" },
];

const DAY_LABELS: { dayOfWeek: number; en: string; ar: string }[] = [
  { dayOfWeek: 7, en: "Sunday", ar: "الأحد" },
  { dayOfWeek: 1, en: "Monday", ar: "الاثنين" },
  { dayOfWeek: 2, en: "Tuesday", ar: "الثلاثاء" },
  { dayOfWeek: 3, en: "Wednesday", ar: "الأربعاء" },
  { dayOfWeek: 4, en: "Thursday", ar: "الخميس" },
  { dayOfWeek: 5, en: "Friday", ar: "الجمعة" },
  { dayOfWeek: 6, en: "Saturday", ar: "السبت" },
];

function buildDefaultHours(facility?: Facility) {
  if (facility?.operatingHours?.length) {
    const byDay = new Map(facility.operatingHours.map((h) => [h.dayOfWeek, h]));
    return DAY_LABELS.map(({ dayOfWeek }) => {
      const existing = byDay.get(dayOfWeek);
      return existing
        ? { dayOfWeek, openTime: existing.openTime, closeTime: existing.closeTime, isClosed: existing.isClosed }
        : { dayOfWeek, openTime: "06:00", closeTime: "22:00", isClosed: true };
    });
  }
  // Defaults: Sun(7)–Thu(4) open 06:00–22:00, Fri(5)–Sat(6) closed
  return DAY_LABELS.map(({ dayOfWeek }) => ({
    dayOfWeek,
    openTime: "06:00",
    closeTime: "22:00",
    isClosed: dayOfWeek === 5 || dayOfWeek === 6,
  }));
}

const operatingHourSchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  openTime: z.string(),
  closeTime: z.string(),
  isClosed: z.boolean(),
});

const facilityFormSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  type: z.string().min(1, "Facility type is required"),
  genderRestriction: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  bookingWindowDays: z.number().min(1, "Booking window must be at least 1 day"),
  minBookingMinutes: z.number().min(15, "Minimum booking must be at least 15 minutes"),
  maxBookingMinutes: z.number().min(15, "Maximum booking must be at least 15 minutes"),
  bufferMinutes: z.number().min(0, "Buffer cannot be negative"),
  hourlyRate: z.number().min(0, "Hourly rate cannot be negative").optional(),
  hourlyRateCurrency: z.string().optional(),
  requiresSubscription: z.boolean(),
  operatingHours: z.array(operatingHourSchema),
});

export type FacilityFormData = z.infer<typeof facilityFormSchema>;

interface FacilityFormProps {
  facility?: Facility;
  onSubmit: (data: FacilityFormData) => void;
  isPending?: boolean;
}

export function FacilityForm({ facility, onSubmit, isPending }: FacilityFormProps) {
  const locale = useLocale();
  const { data: locations, isLoading: locationsLoading } = useLocations({ size: 100 });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FacilityFormData>({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      locationId: facility?.locationId || "",
      nameEn: facility?.name.en || "",
      nameAr: facility?.name.ar || "",
      descriptionEn: facility?.description?.en || "",
      descriptionAr: facility?.description?.ar || "",
      type: facility?.type || "",
      genderRestriction: facility?.genderRestriction || "NONE",
      capacity: facility?.capacity || 1,
      bookingWindowDays: facility?.bookingWindowDays || 7,
      minBookingMinutes: facility?.minBookingMinutes || 30,
      maxBookingMinutes: facility?.maxBookingMinutes || 120,
      bufferMinutes: facility?.bufferMinutes || 15,
      hourlyRate: facility?.hourlyRate ?? undefined,
      hourlyRateCurrency: facility?.hourlyRateCurrency || "SAR",
      requiresSubscription: facility?.requiresSubscription ?? true,
      operatingHours: buildDefaultHours(facility),
    },
  });

  const selectedLocationId = watch("locationId");
  const selectedType = watch("type");
  const selectedGender = watch("genderRestriction");
  const requiresSubscription = watch("requiresSubscription");
  const operatingHours = watch("operatingHours");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "ar" ? "الموقع" : "Location"}</CardTitle>
        </CardHeader>
        <CardContent>
          {locationsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="locationId">
                {locale === "ar" ? "الموقع" : "Location"} *
              </Label>
              <Select
                value={selectedLocationId}
                onValueChange={(value) => setValue("locationId", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={locale === "ar" ? "اختر الموقع" : "Select location"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {locations?.content.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {getLocalizedText(loc.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && (
                <p className="text-sm text-danger">{errors.locationId.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "المعلومات الأساسية" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *
              </Label>
              <Input
                id="nameEn"
                {...register("nameEn")}
                placeholder="Facility name"
              />
              {errors.nameEn && (
                <p className="text-sm text-danger">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}
              </Label>
              <Input
                id="nameAr"
                {...register("nameAr")}
                placeholder="اسم المرفق"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">
                {locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}
              </Label>
              <Input
                id="descriptionEn"
                {...register("descriptionEn")}
                placeholder="Description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">
                {locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}
              </Label>
              <Input
                id="descriptionAr"
                {...register("descriptionAr")}
                placeholder="الوصف"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">
                {locale === "ar" ? "نوع المرفق" : "Facility Type"} *
              </Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={locale === "ar" ? "اختر النوع" : "Select type"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {locale === "ar" ? ft.labelAr : ft.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-danger">{errors.type.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="genderRestriction">
                {locale === "ar" ? "تقييد الجنس" : "Gender Restriction"}
              </Label>
              <Select
                value={selectedGender}
                onValueChange={(value) => setValue("genderRestriction", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={locale === "ar" ? "اختر التقييد" : "Select restriction"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_RESTRICTIONS.map((gr) => (
                    <SelectItem key={gr.value} value={gr.value}>
                      {locale === "ar" ? gr.labelAr : gr.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity & Booking Rules */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "السعة وقواعد الحجز" : "Capacity & Booking Rules"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="capacity">
                {locale === "ar" ? "السعة" : "Capacity"} *
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                {...register("capacity", { valueAsNumber: true })}
              />
              {errors.capacity && (
                <p className="text-sm text-danger">{errors.capacity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookingWindowDays">
                {locale === "ar" ? "أيام نافذة الحجز" : "Booking Window (days)"}
              </Label>
              <Input
                id="bookingWindowDays"
                type="number"
                min="1"
                {...register("bookingWindowDays", { valueAsNumber: true })}
              />
              {errors.bookingWindowDays && (
                <p className="text-sm text-danger">{errors.bookingWindowDays.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bufferMinutes">
                {locale === "ar" ? "دقائق الفاصل" : "Buffer (minutes)"}
              </Label>
              <Input
                id="bufferMinutes"
                type="number"
                min="0"
                {...register("bufferMinutes", { valueAsNumber: true })}
              />
              {errors.bufferMinutes && (
                <p className="text-sm text-danger">{errors.bufferMinutes.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minBookingMinutes">
                {locale === "ar" ? "الحد الأدنى للحجز (دقائق)" : "Min Booking (minutes)"}
              </Label>
              <Input
                id="minBookingMinutes"
                type="number"
                min="15"
                {...register("minBookingMinutes", { valueAsNumber: true })}
              />
              {errors.minBookingMinutes && (
                <p className="text-sm text-danger">{errors.minBookingMinutes.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxBookingMinutes">
                {locale === "ar" ? "الحد الأقصى للحجز (دقائق)" : "Max Booking (minutes)"}
              </Label>
              <Input
                id="maxBookingMinutes"
                type="number"
                min="15"
                {...register("maxBookingMinutes", { valueAsNumber: true })}
              />
              {errors.maxBookingMinutes && (
                <p className="text-sm text-danger">{errors.maxBookingMinutes.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "التسعير" : "Pricing"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">
                {locale === "ar" ? "السعر بالساعة" : "Hourly Rate"}
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                min="0"
                step="0.01"
                {...register("hourlyRate", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.hourlyRate && (
                <p className="text-sm text-danger">{errors.hourlyRate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRateCurrency">
                {locale === "ar" ? "العملة" : "Currency"}
              </Label>
              <Input
                id="hourlyRateCurrency"
                {...register("hourlyRateCurrency")}
                placeholder="SAR"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="requiresSubscription"
              checked={requiresSubscription}
              onCheckedChange={(checked) => setValue("requiresSubscription", checked)}
            />
            <Label htmlFor="requiresSubscription">
              {locale === "ar" ? "يتطلب اشتراك" : "Requires Subscription"}
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === "ar" ? "ساعات العمل" : "Operating Hours"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAY_LABELS.map((day, index) => {
            const hours = operatingHours?.[index];
            const isClosed = hours?.isClosed ?? false;
            return (
              <div
                key={day.dayOfWeek}
                className="flex items-center gap-4 py-2 border-b last:border-b-0"
              >
                <span className="w-28 text-sm font-medium shrink-0">
                  {locale === "ar" ? day.ar : day.en}
                </span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!isClosed}
                    onCheckedChange={(checked) =>
                      setValue(`operatingHours.${index}.isClosed`, !checked)
                    }
                  />
                  <span className="text-xs text-muted-foreground w-12">
                    {isClosed
                      ? locale === "ar"
                        ? "مغلق"
                        : "Closed"
                      : locale === "ar"
                      ? "مفتوح"
                      : "Open"}
                  </span>
                </div>
                {!isClosed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-32"
                      {...register(`operatingHours.${index}.openTime`)}
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      className="w-32"
                      {...register(`operatingHours.${index}.closeTime`)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? locale === "ar"
              ? "جاري الحفظ..."
              : "Saving..."
            : facility
              ? locale === "ar"
                ? "حفظ التغييرات"
                : "Save Changes"
              : locale === "ar"
                ? "إنشاء المرفق"
                : "Create Facility"}
        </Button>
      </div>
    </form>
  );
}
