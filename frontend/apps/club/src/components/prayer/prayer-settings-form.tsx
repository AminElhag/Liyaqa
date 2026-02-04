"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Settings, MapPin, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  usePrayerSettings,
  useUpdatePrayerSettings,
  useSupportedCities,
  useCalculationMethods,
} from "@liyaqa/shared/queries/use-prayer-times";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import type { PrayerCalculationMethod, UpdatePrayerSettingsRequest } from "@liyaqa/shared/types/prayer-time";

const formSchema = z.object({
  city: z.string().nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  calculationMethod: z.string(),
  bufferMinutes: z.number().min(0).max(60),
  blockCheckinDuringPrayer: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface PrayerSettingsFormProps {
  clubId: string;
}

export function PrayerSettingsForm({ clubId }: PrayerSettingsFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const { toast } = useToast();

  const { data: settings, isLoading: loadingSettings } = usePrayerSettings(clubId);
  const { data: citiesData, isLoading: loadingCities } = useSupportedCities();
  const { data: methods, isLoading: loadingMethods } = useCalculationMethods();
  const updateMutation = useUpdatePrayerSettings();

  const texts = {
    title: isArabic ? "إعدادات مواقيت الصلاة" : "Prayer Time Settings",
    description: isArabic
      ? "تكوين مواقيت الصلاة لهذا النادي"
      : "Configure prayer times for this club",
    cityLabel: isArabic ? "المدينة" : "City",
    cityPlaceholder: isArabic ? "اختر المدينة" : "Select city",
    latitudeLabel: isArabic ? "خط العرض" : "Latitude",
    longitudeLabel: isArabic ? "خط الطول" : "Longitude",
    methodLabel: isArabic ? "طريقة الحساب" : "Calculation Method",
    bufferLabel: isArabic ? "فترة الصلاة (دقائق)" : "Prayer Buffer (minutes)",
    bufferDescription: isArabic
      ? "الوقت قبل وبعد الصلاة للاعتبار"
      : "Time before and after prayer to consider",
    blockCheckInLabel: isArabic ? "حظر تسجيل الدخول أثناء الصلاة" : "Block Check-in During Prayer",
    blockCheckInDescription: isArabic
      ? "منع الأعضاء من تسجيل الدخول أثناء أوقات الصلاة"
      : "Prevent members from checking in during prayer times",
    saveButton: isArabic ? "حفظ الإعدادات" : "Save Settings",
    saving: isArabic ? "جاري الحفظ..." : "Saving...",
    successTitle: isArabic ? "تم الحفظ" : "Settings Saved",
    successDescription: isArabic
      ? "تم حفظ إعدادات مواقيت الصلاة بنجاح"
      : "Prayer time settings saved successfully",
    errorTitle: isArabic ? "خطأ" : "Error",
    customCoordinates: isArabic ? "إحداثيات مخصصة" : "Custom coordinates",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      city: null,
      latitude: null,
      longitude: null,
      calculationMethod: "UMM_AL_QURA",
      bufferMinutes: 30,
      blockCheckinDuringPrayer: false,
    },
  });

  const watchCity = watch("city");

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        city: settings.city,
        latitude: settings.latitude,
        longitude: settings.longitude,
        calculationMethod: settings.calculationMethod,
        bufferMinutes: settings.bufferMinutes,
        blockCheckinDuringPrayer: settings.blockCheckinDuringPrayer,
      });
    }
  }, [settings, reset]);

  // Update coordinates when city changes
  useEffect(() => {
    if (watchCity && citiesData) {
      const selectedCity = citiesData.cities.find((c) => c.name === watchCity);
      if (selectedCity) {
        setValue("latitude", selectedCity.latitude);
        setValue("longitude", selectedCity.longitude);
      }
    }
  }, [watchCity, citiesData, setValue]);

  const onSubmit = async (data: FormData) => {
    const request: UpdatePrayerSettingsRequest = {
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      calculationMethod: data.calculationMethod as PrayerCalculationMethod,
      bufferMinutes: data.bufferMinutes,
      blockCheckinDuringPrayer: data.blockCheckinDuringPrayer,
    };

    try {
      await updateMutation.mutateAsync({ clubId, settings: request });
      toast({
        title: texts.successTitle,
        description: texts.successDescription,
      });
    } catch (error) {
      toast({
        title: texts.errorTitle,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loadingSettings || loadingCities || loadingMethods) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {texts.title}
        </CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* City Selection */}
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {texts.cityLabel}
            </Label>
            <Select
              value={watchCity || ""}
              onValueChange={(value) => setValue("city", value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder={texts.cityPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {citiesData?.cities.map((city) => (
                  <SelectItem key={city.name} value={city.name}>
                    {isArabic ? city.nameAr : city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{texts.latitudeLabel}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register("latitude", { valueAsNumber: true })}
              />
              {errors.latitude && (
                <p className="text-sm text-destructive">{errors.latitude.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">{texts.longitudeLabel}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register("longitude", { valueAsNumber: true })}
              />
              {errors.longitude && (
                <p className="text-sm text-destructive">{errors.longitude.message}</p>
              )}
            </div>
          </div>

          {/* Calculation Method */}
          <div className="space-y-2">
            <Label htmlFor="calculationMethod">{texts.methodLabel}</Label>
            <Select
              value={watch("calculationMethod")}
              onValueChange={(value) =>
                setValue("calculationMethod", value, { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods?.map((method) => (
                  <SelectItem key={method.code} value={method.code}>
                    {isArabic ? method.nameAr : method.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Buffer Minutes */}
          <div className="space-y-2">
            <Label htmlFor="bufferMinutes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {texts.bufferLabel}
            </Label>
            <Input
              id="bufferMinutes"
              type="number"
              min={0}
              max={60}
              {...register("bufferMinutes", { valueAsNumber: true })}
            />
            <p className="text-sm text-muted-foreground">{texts.bufferDescription}</p>
            {errors.bufferMinutes && (
              <p className="text-sm text-destructive">{errors.bufferMinutes.message}</p>
            )}
          </div>

          {/* Block Check-in */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label
                htmlFor="blockCheckinDuringPrayer"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Shield className="h-4 w-4" />
                {texts.blockCheckInLabel}
              </Label>
              <p className="text-sm text-muted-foreground">{texts.blockCheckInDescription}</p>
            </div>
            <Switch
              id="blockCheckinDuringPrayer"
              checked={watch("blockCheckinDuringPrayer")}
              onCheckedChange={(checked) =>
                setValue("blockCheckinDuringPrayer", checked, { shouldDirty: true })
              }
            />
          </div>

          <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending ? texts.saving : texts.saveButton}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
