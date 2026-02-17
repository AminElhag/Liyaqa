"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Settings,
  Clock,
  DollarSign,
  Calendar,
  Shield,
  Save,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import { cn } from "@liyaqa/shared/utils";

// ---------------------------------------------------------------------------
// Bilingual texts
// ---------------------------------------------------------------------------

const texts = {
  en: {
    title: "PT Settings",
    subtitle: "Configure default settings for personal training sessions",
    // Session defaults
    sessionDefaults: "Session Defaults",
    sessionDefaultsDesc: "Default values applied to new PT sessions",
    defaultDuration: "Default Session Duration",
    defaultDurationHint: "The default duration for new PT sessions",
    // Cancellation policy
    cancellationPolicy: "Cancellation Policy",
    cancellationPolicyDesc: "Rules for session cancellation by members",
    cancellationHours: "Cancellation Window (hours)",
    cancellationHoursHint: "Minimum hours before session start that a member can cancel without penalty",
    // Pricing
    pricingDefaults: "Pricing Defaults",
    pricingDefaultsDesc: "Default pricing values for new PT classes",
    defaultTravelFee: "Default Travel Fee (SAR)",
    defaultTravelFeeHint: "Applied to home sessions by default",
    // Booking
    bookingSettings: "Booking Settings",
    bookingSettingsDesc: "Configure booking constraints",
    maxAdvanceBookingDays: "Max Advance Booking Days",
    maxAdvanceBookingDaysHint: "How many days in advance members can book a PT session",
    // Actions
    save: "Save Settings",
    saving: "Saving...",
    // Toast
    savedTitle: "Settings saved",
    savedDesc: "PT settings have been updated successfully.",
    // Duration options
    min30: "30 minutes",
    min45: "45 minutes",
    min60: "60 minutes",
    min90: "90 minutes",
  },
  ar: {
    title: "إعدادات التدريب الشخصي",
    subtitle: "تهيئة الإعدادات الافتراضية لجلسات التدريب الشخصي",
    // Session defaults
    sessionDefaults: "الإعدادات الافتراضية للجلسة",
    sessionDefaultsDesc: "القيم الافتراضية المطبقة على جلسات التدريب الشخصي الجديدة",
    defaultDuration: "مدة الجلسة الافتراضية",
    defaultDurationHint: "المدة الافتراضية لجلسات التدريب الشخصي الجديدة",
    // Cancellation policy
    cancellationPolicy: "سياسة الإلغاء",
    cancellationPolicyDesc: "قواعد إلغاء الجلسات من قبل الأعضاء",
    cancellationHours: "نافذة الإلغاء (ساعات)",
    cancellationHoursHint: "الحد الأدنى من الساعات قبل بدء الجلسة التي يمكن للعضو الإلغاء بدون غرامة",
    // Pricing
    pricingDefaults: "الإعدادات الافتراضية للتسعير",
    pricingDefaultsDesc: "قيم التسعير الافتراضية لفصول التدريب الشخصي الجديدة",
    defaultTravelFee: "رسوم التنقل الافتراضية (ريال)",
    defaultTravelFeeHint: "تطبق على الجلسات المنزلية افتراضيا",
    // Booking
    bookingSettings: "إعدادات الحجز",
    bookingSettingsDesc: "تهيئة قيود الحجز",
    maxAdvanceBookingDays: "أقصى أيام حجز مسبق",
    maxAdvanceBookingDaysHint: "عدد الأيام التي يمكن للأعضاء حجز جلسة تدريب شخصي مسبقا",
    // Actions
    save: "حفظ الإعدادات",
    saving: "جاري الحفظ...",
    // Toast
    savedTitle: "تم حفظ الإعدادات",
    savedDesc: "تم تحديث إعدادات التدريب الشخصي بنجاح.",
    // Duration options
    min30: "30 دقيقة",
    min45: "45 دقيقة",
    min60: "60 دقيقة",
    min90: "90 دقيقة",
  },
};

// ---------------------------------------------------------------------------
// Setting card component
// ---------------------------------------------------------------------------

function SettingField({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
      <div className="flex items-start gap-3 sm:w-[280px] sm:shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          {hint && (
            <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
          )}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PTSettingsPage() {
  const locale = useLocale() as "en" | "ar";
  const t = texts[locale];
  const { toast } = useToast();

  // Settings state (placeholder values)
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [cancellationHours, setCancellationHours] = useState(24);
  const [defaultTravelFee, setDefaultTravelFee] = useState(50);
  const [maxAdvanceBookingDays, setMaxAdvanceBookingDays] = useState(14);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Placeholder: simulate a save operation
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    toast({
      title: t.savedTitle,
      description: t.savedDesc,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-slate-100 to-gray-100",
              "dark:from-slate-900/40 dark:to-gray-900/40"
            )}
          >
            <Settings className="h-7 w-7 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Session Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            {t.sessionDefaults}
          </CardTitle>
          <CardDescription>{t.sessionDefaultsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingField
            icon={Clock}
            label={t.defaultDuration}
            hint={t.defaultDurationHint}
          >
            <Select value={defaultDuration} onValueChange={setDefaultDuration}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">{t.min30}</SelectItem>
                <SelectItem value="45">{t.min45}</SelectItem>
                <SelectItem value="60">{t.min60}</SelectItem>
                <SelectItem value="90">{t.min90}</SelectItem>
              </SelectContent>
            </Select>
          </SettingField>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            {t.cancellationPolicy}
          </CardTitle>
          <CardDescription>{t.cancellationPolicyDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingField
            icon={Clock}
            label={t.cancellationHours}
            hint={t.cancellationHoursHint}
          >
            <Input
              type="number"
              min={0}
              max={168}
              value={cancellationHours}
              onChange={(e) => setCancellationHours(Number(e.target.value))}
              className="w-full sm:w-[200px]"
            />
          </SettingField>
        </CardContent>
      </Card>

      {/* Pricing Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            {t.pricingDefaults}
          </CardTitle>
          <CardDescription>{t.pricingDefaultsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingField
            icon={DollarSign}
            label={t.defaultTravelFee}
            hint={t.defaultTravelFeeHint}
          >
            <Input
              type="number"
              min={0}
              step={0.01}
              value={defaultTravelFee}
              onChange={(e) => setDefaultTravelFee(Number(e.target.value))}
              className="w-full sm:w-[200px]"
            />
          </SettingField>
        </CardContent>
      </Card>

      {/* Booking Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            {t.bookingSettings}
          </CardTitle>
          <CardDescription>{t.bookingSettingsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingField
            icon={Calendar}
            label={t.maxAdvanceBookingDays}
            hint={t.maxAdvanceBookingDaysHint}
          >
            <Input
              type="number"
              min={1}
              max={90}
              value={maxAdvanceBookingDays}
              onChange={(e) => setMaxAdvanceBookingDays(Number(e.target.value))}
              className="w-full sm:w-[200px]"
            />
          </SettingField>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          <Save className="me-2 h-4 w-4" />
          {isSaving ? t.saving : t.save}
        </Button>
      </div>
    </div>
  );
}
