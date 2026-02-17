"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@liyaqa/shared/components/ui/card";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@liyaqa/shared/components/ui/select";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";

import {
  useGxSettings,
  useUpdateGxSettings,
} from "@liyaqa/shared/queries/use-gx";
import type { UpdateGxSettingsRequest } from "@liyaqa/shared/types/scheduling";

// ==================== ZOD SCHEMA ====================

const gxSettingsSchema = z.object({
  defaultBookingWindowDays: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, "Minimum 1 day")
    .max(90, "Maximum 90 days"),
  defaultCancellationDeadlineHours: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0, "Cannot be negative")
    .max(168, "Maximum 168 hours"),
  walkinReserveSpots: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0, "Cannot be negative")
    .max(100, "Maximum 100 spots"),
  defaultLateCancellationFeeAmount: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(10000, "Maximum 10,000 SAR"),
  defaultNoShowFeeAmount: z
    .number({ invalid_type_error: "Must be a number" })
    .min(0, "Cannot be negative")
    .max(10000, "Maximum 10,000 SAR"),
  autoMarkNoShows: z.boolean(),
  preClassReminderMinutes: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(0, "Cannot be negative")
    .max(1440, "Maximum 1440 minutes"),
  waitlistAutoPromote: z.boolean(),
  waitlistNotificationChannel: z.enum(
    ["SMS_PUSH", "SMS_ONLY", "PUSH_ONLY", "EMAIL"],
    { required_error: "Select a channel" }
  ),
  prayerTimeBlockingEnabled: z.boolean(),
});

type GxSettingsFormValues = z.infer<typeof gxSettingsSchema>;

// ==================== NOTIFICATION CHANNEL OPTIONS ====================

const NOTIFICATION_CHANNELS = [
  { value: "SMS_PUSH", labelEn: "SMS + Push", labelAr: "رسائل نصية + إشعارات" },
  { value: "SMS_ONLY", labelEn: "SMS Only", labelAr: "رسائل نصية فقط" },
  { value: "PUSH_ONLY", labelEn: "Push Only", labelAr: "إشعارات فقط" },
  { value: "EMAIL", labelEn: "Email", labelAr: "بريد إلكتروني" },
] as const;

// ==================== LOADING SKELETON ====================

function GxSettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[280px]" />
        <Skeleton className="h-[220px]" />
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[180px]" />
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================

export default function GxSettingsPage() {
  const locale = useLocale();
  const isRTL = locale === "ar";

  const { data: settings, isLoading } = useGxSettings();
  const updateMutation = useUpdateGxSettings();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<GxSettingsFormValues>({
    resolver: zodResolver(gxSettingsSchema),
    defaultValues: {
      defaultBookingWindowDays: 7,
      defaultCancellationDeadlineHours: 4,
      walkinReserveSpots: 0,
      defaultLateCancellationFeeAmount: 0,
      defaultNoShowFeeAmount: 0,
      autoMarkNoShows: true,
      preClassReminderMinutes: 60,
      waitlistAutoPromote: true,
      waitlistNotificationChannel: "SMS_PUSH",
      prayerTimeBlockingEnabled: true,
    },
  });

  // Populate form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        defaultBookingWindowDays: settings.defaultBookingWindowDays,
        defaultCancellationDeadlineHours:
          settings.defaultCancellationDeadlineHours,
        walkinReserveSpots: settings.walkinReserveSpots,
        defaultLateCancellationFeeAmount:
          settings.defaultLateCancellationFee?.amount ?? 0,
        defaultNoShowFeeAmount: settings.defaultNoShowFee?.amount ?? 0,
        autoMarkNoShows: settings.autoMarkNoShows,
        preClassReminderMinutes: settings.preClassReminderMinutes,
        waitlistAutoPromote: settings.waitlistAutoPromote,
        waitlistNotificationChannel:
          (settings.waitlistNotificationChannel as GxSettingsFormValues["waitlistNotificationChannel"]) ??
          "SMS_PUSH",
        prayerTimeBlockingEnabled: settings.prayerTimeBlockingEnabled,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (values: GxSettingsFormValues) => {
    const payload: UpdateGxSettingsRequest = {
      defaultBookingWindowDays: values.defaultBookingWindowDays,
      defaultCancellationDeadlineHours:
        values.defaultCancellationDeadlineHours,
      walkinReserveSpots: values.walkinReserveSpots,
      defaultLateCancellationFeeAmount:
        values.defaultLateCancellationFeeAmount,
      defaultLateCancellationFeeCurrency: "SAR",
      defaultNoShowFeeAmount: values.defaultNoShowFeeAmount,
      defaultNoShowFeeCurrency: "SAR",
      autoMarkNoShows: values.autoMarkNoShows,
      preClassReminderMinutes: values.preClassReminderMinutes,
      waitlistAutoPromote: values.waitlistAutoPromote,
      waitlistNotificationChannel: values.waitlistNotificationChannel,
      prayerTimeBlockingEnabled: values.prayerTimeBlockingEnabled,
    };

    try {
      await updateMutation.mutateAsync(payload);
      toast.success(
        isRTL
          ? "تم حفظ إعدادات التمارين الجماعية بنجاح"
          : "GX settings saved successfully"
      );
    } catch {
      toast.error(
        isRTL
          ? "فشل في حفظ الإعدادات"
          : "Failed to save settings"
      );
    }
  };

  if (isLoading) {
    return <GxSettingsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isRTL ? "إعدادات التمارين الجماعية" : "Group Exercise Settings"}
        </h1>
        <p className="text-muted-foreground">
          {isRTL
            ? "تكوين الإعدادات الافتراضية للحجوزات والرسوم والأتمتة"
            : "Configure default settings for bookings, fees, and automation"}
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Booking Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isRTL ? "إعدادات الحجز الافتراضية" : "Booking Defaults"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "تحكم في نافذة الحجز وسياسة الإلغاء والأماكن المحجوزة"
                  : "Control the booking window, cancellation policy, and reserved spots"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Booking Window */}
              <div className="space-y-2">
                <Label htmlFor="defaultBookingWindowDays">
                  {isRTL ? "نافذة الحجز الافتراضية (أيام)" : "Default Booking Window (days)"}
                </Label>
                <Input
                  id="defaultBookingWindowDays"
                  type="number"
                  min={1}
                  max={90}
                  {...register("defaultBookingWindowDays", {
                    valueAsNumber: true,
                  })}
                />
                {errors.defaultBookingWindowDays && (
                  <p className="text-sm text-destructive">
                    {errors.defaultBookingWindowDays.message}
                  </p>
                )}
              </div>

              {/* Default Cancellation Deadline */}
              <div className="space-y-2">
                <Label htmlFor="defaultCancellationDeadlineHours">
                  {isRTL
                    ? "الموعد النهائي للإلغاء الافتراضي (ساعات)"
                    : "Default Cancellation Deadline (hours)"}
                </Label>
                <Input
                  id="defaultCancellationDeadlineHours"
                  type="number"
                  min={0}
                  max={168}
                  {...register("defaultCancellationDeadlineHours", {
                    valueAsNumber: true,
                  })}
                />
                {errors.defaultCancellationDeadlineHours && (
                  <p className="text-sm text-destructive">
                    {errors.defaultCancellationDeadlineHours.message}
                  </p>
                )}
              </div>

              {/* Walk-in Reserve Spots */}
              <div className="space-y-2">
                <Label htmlFor="walkinReserveSpots">
                  {isRTL ? "أماكن محجوزة للحضور المباشر" : "Walk-in Reserve Spots"}
                </Label>
                <Input
                  id="walkinReserveSpots"
                  type="number"
                  min={0}
                  max={100}
                  {...register("walkinReserveSpots", {
                    valueAsNumber: true,
                  })}
                />
                {errors.walkinReserveSpots && (
                  <p className="text-sm text-destructive">
                    {errors.walkinReserveSpots.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Fee Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isRTL ? "إعدادات الرسوم الافتراضية" : "Fee Defaults"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "تحديد رسوم الإلغاء المتأخر وعدم الحضور"
                  : "Set late cancellation and no-show fee amounts"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Late Cancellation Fee */}
              <div className="space-y-2">
                <Label htmlFor="defaultLateCancellationFeeAmount">
                  {isRTL
                    ? "رسوم الإلغاء المتأخر (ر.س)"
                    : "Default Late Cancellation Fee (SAR)"}
                </Label>
                <Input
                  id="defaultLateCancellationFeeAmount"
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  {...register("defaultLateCancellationFeeAmount", {
                    valueAsNumber: true,
                  })}
                />
                {errors.defaultLateCancellationFeeAmount && (
                  <p className="text-sm text-destructive">
                    {errors.defaultLateCancellationFeeAmount.message}
                  </p>
                )}
              </div>

              {/* No-Show Fee */}
              <div className="space-y-2">
                <Label htmlFor="defaultNoShowFeeAmount">
                  {isRTL
                    ? "رسوم عدم الحضور (ر.س)"
                    : "Default No-Show Fee (SAR)"}
                </Label>
                <Input
                  id="defaultNoShowFeeAmount"
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  {...register("defaultNoShowFeeAmount", {
                    valueAsNumber: true,
                  })}
                />
                {errors.defaultNoShowFeeAmount && (
                  <p className="text-sm text-destructive">
                    {errors.defaultNoShowFeeAmount.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Automation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isRTL ? "الأتمتة" : "Automation"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "إعدادات عدم الحضور التلقائي والتذكيرات وقائمة الانتظار"
                  : "Configure auto no-show marking, reminders, and waitlist behavior"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Auto-mark No-shows */}
              <Controller
                control={control}
                name="autoMarkNoShows"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoMarkNoShows">
                        {isRTL ? "تسجيل عدم الحضور تلقائيا" : "Auto-mark No-shows"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? "تسجيل عدم الحضور تلقائيا بعد انتهاء الحصة"
                          : "Automatically mark absent members after class ends"}
                      </p>
                    </div>
                    <Switch
                      id="autoMarkNoShows"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Pre-class Reminder */}
              <div className="space-y-2">
                <Label htmlFor="preClassReminderMinutes">
                  {isRTL
                    ? "تذكير قبل الحصة (دقائق)"
                    : "Pre-class Reminder (minutes before)"}
                </Label>
                <Input
                  id="preClassReminderMinutes"
                  type="number"
                  min={0}
                  max={1440}
                  {...register("preClassReminderMinutes", {
                    valueAsNumber: true,
                  })}
                />
                {errors.preClassReminderMinutes && (
                  <p className="text-sm text-destructive">
                    {errors.preClassReminderMinutes.message}
                  </p>
                )}
              </div>

              {/* Waitlist Auto-promote */}
              <Controller
                control={control}
                name="waitlistAutoPromote"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="waitlistAutoPromote">
                        {isRTL ? "ترقية قائمة الانتظار تلقائيا" : "Waitlist Auto-promote"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? "ترقية الأعضاء تلقائيا عند توفر مكان"
                          : "Automatically promote members when a spot opens"}
                      </p>
                    </div>
                    <Switch
                      id="waitlistAutoPromote"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />

              {/* Waitlist Notification Channel */}
              <Controller
                control={control}
                name="waitlistNotificationChannel"
                render={({ field }) => (
                  <div className="space-y-2">
                    <Label htmlFor="waitlistNotificationChannel">
                      {isRTL
                        ? "قناة إشعار قائمة الانتظار"
                        : "Waitlist Notification Channel"}
                    </Label>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="waitlistNotificationChannel">
                        <SelectValue
                          placeholder={
                            isRTL ? "اختر قناة" : "Select channel"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_CHANNELS.map((channel) => (
                          <SelectItem
                            key={channel.value}
                            value={channel.value}
                          >
                            {isRTL ? channel.labelAr : channel.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.waitlistNotificationChannel && (
                      <p className="text-sm text-destructive">
                        {errors.waitlistNotificationChannel.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Card 4: Prayer Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isRTL ? "أوقات الصلاة" : "Prayer Time"}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? "حظر جدولة الحصص أثناء أوقات الصلاة"
                  : "Block class scheduling during prayer times"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                control={control}
                name="prayerTimeBlockingEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="prayerTimeBlockingEnabled">
                        {isRTL
                          ? "تفعيل حظر أوقات الصلاة"
                          : "Prayer Time Blocking Enabled"}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? "يستخدم حساب أوقات الصلاة إعدادات موقع النادي الخاص بك"
                          : "Prayer time calculation uses your club's location settings"}
                      </p>
                    </div>
                    <Switch
                      id="prayerTimeBlockingEnabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
            )}
            {updateMutation.isPending
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "حفظ الإعدادات"
                : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
