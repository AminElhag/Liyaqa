"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Palette,
  Image,
  ToggleLeft,
  Smartphone,
  Type,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrandingConfig, useUpdateBrandingConfig } from "@/queries/use-branding";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const brandingSchema = z.object({
  // App Identity
  appName: z.string().min(1, "App name is required").max(100),
  appNameAr: z.string().max(100).nullable().optional(),

  // Colors
  primaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  primaryDarkColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  secondaryColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  secondaryDarkColor: z.string().regex(hexColorRegex, "Invalid hex color"),
  accentColor: z.string().regex(hexColorRegex, "Invalid hex color"),

  // Logos
  logoLightUrl: z.string().max(500).nullable().optional(),
  logoDarkUrl: z.string().max(500).nullable().optional(),

  // Feature Flags
  featureClasses: z.boolean(),
  featureFacilities: z.boolean(),
  featureLoyalty: z.boolean(),
  featureWearables: z.boolean(),
  featurePayments: z.boolean(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

function ColorInput({
  label,
  name,
  register,
  watch,
  setValue,
  error,
  disabled,
}: {
  label: string;
  name: keyof BrandingFormData;
  register: ReturnType<typeof useForm<BrandingFormData>>["register"];
  watch: ReturnType<typeof useForm<BrandingFormData>>["watch"];
  setValue: ReturnType<typeof useForm<BrandingFormData>>["setValue"];
  error?: string;
  disabled?: boolean;
}) {
  const value = watch(name) as string;

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex gap-2">
        <div
          className="h-10 w-10 rounded-md border shrink-0 cursor-pointer"
          style={{ backgroundColor: value || "#000000" }}
          onClick={() => {
            const input = document.getElementById(`${name}-picker`) as HTMLInputElement;
            input?.click();
          }}
        />
        <input
          type="color"
          id={`${name}-picker`}
          className="sr-only"
          value={value || "#000000"}
          onChange={(e) => setValue(name, e.target.value as never, { shouldDirty: true })}
          disabled={disabled}
        />
        <Input
          id={name}
          {...register(name)}
          placeholder="#000000"
          className="font-mono uppercase"
          disabled={disabled}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function PhonePreview({
  appName,
  primaryColor,
  secondaryColor,
  accentColor,
  logoLightUrl,
}: {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoLightUrl?: string | null;
}) {
  return (
    <div className="mx-auto w-[200px] h-[400px] bg-black rounded-[30px] p-2 shadow-xl">
      <div className="w-full h-full rounded-[24px] overflow-hidden bg-white">
        {/* Status bar */}
        <div
          className="h-6 w-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="w-20 h-3 bg-black/20 rounded-full" />
        </div>

        {/* App header */}
        <div
          className="h-14 w-full flex items-center justify-center"
          style={{ backgroundColor: primaryColor }}
        >
          {logoLightUrl ? (
            <img src={logoLightUrl} alt="Logo" className="h-8 object-contain" />
          ) : (
            <span className="text-white font-bold text-sm">{appName}</span>
          )}
        </div>

        {/* Content area */}
        <div className="p-3 space-y-2">
          <div className="h-8 rounded-md" style={{ backgroundColor: `${primaryColor}15` }} />
          <div className="grid grid-cols-2 gap-2">
            <div
              className="h-16 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${secondaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
            <div
              className="h-16 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
          <div className="h-6 rounded-md bg-gray-100" />
          <div className="h-6 rounded-md bg-gray-100 w-3/4" />
        </div>

        {/* Bottom navigation */}
        <div className="absolute bottom-0 left-0 right-0 h-12 border-t flex items-center justify-around px-4">
          <div className="w-6 h-6 rounded-full" style={{ backgroundColor: primaryColor }} />
          <div className="w-6 h-6 rounded-full bg-gray-300" />
          <div className="w-6 h-6 rounded-full bg-gray-300" />
          <div className="w-6 h-6 rounded-full bg-gray-300" />
        </div>
      </div>
    </div>
  );
}

export default function BrandingSettingsPage() {
  const locale = useLocale();
  const { data: config, isLoading } = useBrandingConfig();
  const updateConfigMutation = useUpdateBrandingConfig();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      appName: "Liyaqa",
      appNameAr: "",
      primaryColor: "#1E3A5F",
      primaryDarkColor: "#3D5A80",
      secondaryColor: "#2E7D32",
      secondaryDarkColor: "#4CAF50",
      accentColor: "#FFB300",
      logoLightUrl: "",
      logoDarkUrl: "",
      featureClasses: true,
      featureFacilities: true,
      featureLoyalty: true,
      featureWearables: true,
      featurePayments: true,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        appName: config.appName,
        appNameAr: config.appNameAr || "",
        primaryColor: config.primaryColor,
        primaryDarkColor: config.primaryDarkColor,
        secondaryColor: config.secondaryColor,
        secondaryDarkColor: config.secondaryDarkColor,
        accentColor: config.accentColor,
        logoLightUrl: config.logoLightUrl || "",
        logoDarkUrl: config.logoDarkUrl || "",
        featureClasses: config.featureClasses,
        featureFacilities: config.featureFacilities,
        featureLoyalty: config.featureLoyalty,
        featureWearables: config.featureWearables,
        featurePayments: config.featurePayments,
      });
    }
  }, [config, reset]);

  const onSubmit = (data: BrandingFormData) => {
    updateConfigMutation.mutate(
      {
        appName: data.appName,
        appNameAr: data.appNameAr || null,
        primaryColor: data.primaryColor.toUpperCase(),
        primaryDarkColor: data.primaryDarkColor.toUpperCase(),
        secondaryColor: data.secondaryColor.toUpperCase(),
        secondaryDarkColor: data.secondaryDarkColor.toUpperCase(),
        accentColor: data.accentColor.toUpperCase(),
        logoLightUrl: data.logoLightUrl || null,
        logoDarkUrl: data.logoDarkUrl || null,
        featureClasses: data.featureClasses,
        featureFacilities: data.featureFacilities,
        featureLoyalty: data.featureLoyalty,
        featureWearables: data.featureWearables,
        featurePayments: data.featurePayments,
      },
      {
        onSuccess: () => {
          toast.success(
            locale === "ar"
              ? "تم تحديث إعدادات العلامة التجارية بنجاح"
              : "Branding settings updated successfully"
          );
        },
        onError: () => {
          toast.error(
            locale === "ar"
              ? "فشل في تحديث إعدادات العلامة التجارية"
              : "Failed to update branding settings"
          );
        },
      }
    );
  };

  // Watch values for preview
  const appName = watch("appName");
  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");
  const accentColor = watch("accentColor");
  const logoLightUrl = watch("logoLightUrl");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "إعدادات العلامة التجارية" : "Branding Settings"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "تخصيص تطبيق الهاتف المحمول بعلامتك التجارية"
              : "Customize your mobile app with your brand"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* App Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  {locale === "ar" ? "هوية التطبيق" : "App Identity"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "تحديد اسم التطبيق الذي يظهر للمستخدمين"
                    : "Set the app name displayed to users"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appName">
                    {locale === "ar" ? "اسم التطبيق (الإنجليزية)" : "App Name (English)"}
                  </Label>
                  <Input
                    id="appName"
                    {...register("appName")}
                    placeholder="My Gym"
                  />
                  {errors.appName && (
                    <p className="text-sm text-destructive">{errors.appName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appNameAr">
                    {locale === "ar" ? "اسم التطبيق (العربية)" : "App Name (Arabic)"}
                  </Label>
                  <Input
                    id="appNameAr"
                    {...register("appNameAr")}
                    placeholder="ناديي"
                    dir="rtl"
                  />
                  {errors.appNameAr && (
                    <p className="text-sm text-destructive">{errors.appNameAr.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {locale === "ar" ? "الألوان" : "Colors"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "حدد نظام الألوان لتطبيقك"
                    : "Define the color scheme for your app"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <ColorInput
                    label={locale === "ar" ? "اللون الأساسي" : "Primary Color"}
                    name="primaryColor"
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    error={errors.primaryColor?.message}
                  />
                  <ColorInput
                    label={locale === "ar" ? "اللون الأساسي (داكن)" : "Primary Dark Color"}
                    name="primaryDarkColor"
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    error={errors.primaryDarkColor?.message}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ColorInput
                    label={locale === "ar" ? "اللون الثانوي" : "Secondary Color"}
                    name="secondaryColor"
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    error={errors.secondaryColor?.message}
                  />
                  <ColorInput
                    label={locale === "ar" ? "اللون الثانوي (داكن)" : "Secondary Dark Color"}
                    name="secondaryDarkColor"
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    error={errors.secondaryDarkColor?.message}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <ColorInput
                    label={locale === "ar" ? "لون التمييز" : "Accent Color"}
                    name="accentColor"
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    error={errors.accentColor?.message}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Logos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  {locale === "ar" ? "الشعارات" : "Logos"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "روابط الشعارات للوضع الفاتح والداكن"
                    : "Logo URLs for light and dark mode"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logoLightUrl">
                    {locale === "ar" ? "شعار الوضع الفاتح" : "Light Mode Logo URL"}
                  </Label>
                  <Input
                    id="logoLightUrl"
                    {...register("logoLightUrl")}
                    placeholder="https://..."
                  />
                  {errors.logoLightUrl && (
                    <p className="text-sm text-destructive">{errors.logoLightUrl.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoDarkUrl">
                    {locale === "ar" ? "شعار الوضع الداكن" : "Dark Mode Logo URL"}
                  </Label>
                  <Input
                    id="logoDarkUrl"
                    {...register("logoDarkUrl")}
                    placeholder="https://..."
                  />
                  {errors.logoDarkUrl && (
                    <p className="text-sm text-destructive">{errors.logoDarkUrl.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleLeft className="h-5 w-5" />
                  {locale === "ar" ? "الميزات" : "Features"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "تمكين أو تعطيل ميزات التطبيق"
                    : "Enable or disable app features"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{locale === "ar" ? "الحصص الجماعية" : "Classes"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "عرض وحجز الحصص الجماعية"
                        : "View and book group classes"}
                    </p>
                  </div>
                  <Switch
                    checked={watch("featureClasses")}
                    onCheckedChange={(checked) =>
                      setValue("featureClasses", checked, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{locale === "ar" ? "المرافق" : "Facilities"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "حجز المرافق والمساحات"
                        : "Book facilities and spaces"}
                    </p>
                  </div>
                  <Switch
                    checked={watch("featureFacilities")}
                    onCheckedChange={(checked) =>
                      setValue("featureFacilities", checked, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{locale === "ar" ? "برنامج الولاء" : "Loyalty Program"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "كسب واستبدال النقاط"
                        : "Earn and redeem points"}
                    </p>
                  </div>
                  <Switch
                    checked={watch("featureLoyalty")}
                    onCheckedChange={(checked) =>
                      setValue("featureLoyalty", checked, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{locale === "ar" ? "الأجهزة القابلة للارتداء" : "Wearables"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "تتبع اللياقة البدنية والتكامل"
                        : "Fitness tracking and integration"}
                    </p>
                  </div>
                  <Switch
                    checked={watch("featureWearables")}
                    onCheckedChange={(checked) =>
                      setValue("featureWearables", checked, { shouldDirty: true })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{locale === "ar" ? "المدفوعات" : "Payments"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {locale === "ar"
                        ? "المدفوعات داخل التطبيق"
                        : "In-app payments"}
                    </p>
                  </div>
                  <Switch
                    checked={watch("featurePayments")}
                    onCheckedChange={(checked) =>
                      setValue("featurePayments", checked, { shouldDirty: true })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Preview */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  {locale === "ar" ? "معاينة" : "Preview"}
                </CardTitle>
                <CardDescription>
                  {locale === "ar"
                    ? "معاينة مباشرة لتطبيقك"
                    : "Live preview of your app"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-6">
                <PhonePreview
                  appName={appName || "Liyaqa"}
                  primaryColor={primaryColor || "#1E3A5F"}
                  secondaryColor={secondaryColor || "#2E7D32"}
                  accentColor={accentColor || "#FFB300"}
                  logoLightUrl={logoLightUrl}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={!isDirty || updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending
              ? locale === "ar"
                ? "جارٍ الحفظ..."
                : "Saving..."
              : locale === "ar"
              ? "حفظ التغييرات"
              : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
