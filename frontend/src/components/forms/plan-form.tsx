"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembershipPlan, BillingPeriod } from "@/types/member";
import { Calendar, Users, DollarSign, Sparkles, Settings } from "lucide-react";

const billingPeriodOptions = [
  "DAILY",
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
  "ONE_TIME",
] as const;

// Fee schema for taxable fees
const taxableFeeSchema = z.object({
  amount: z.number().min(0, "Amount must be 0 or greater"),
  currency: z.string().default("SAR"),
  taxRate: z.number().min(0).max(100).default(15),
});

const planFormSchema = z.object({
  // Basic info
  name: z.object({
    en: z.string().min(1, "English name is required"),
    ar: z.string().nullish(),
  }),
  description: z.object({
    en: z.string().nullish(),
    ar: z.string().nullish(),
  }).nullish(),

  // Date restrictions
  availableFrom: z.string().nullish(),
  availableUntil: z.string().nullish(),

  // Age restrictions (preprocess to handle NaN from empty inputs)
  minimumAge: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : val),
    z.number().min(0).nullish()
  ),
  maximumAge: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : val),
    z.number().min(0).nullish()
  ),

  // Fee structure
  membershipFee: taxableFeeSchema,
  administrationFee: taxableFeeSchema,
  joinFee: taxableFeeSchema,

  // Billing & duration
  billingPeriod: z.enum(billingPeriodOptions),
  durationDays: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : val),
    z.number().min(1).nullish()
  ),
  maxClassesPerPeriod: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? undefined : val),
    z.number().min(0).nullish()
  ),

  // Features
  hasGuestPasses: z.boolean().default(false),
  guestPassesCount: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? 0 : val),
    z.number().min(0).default(0)
  ),
  hasLockerAccess: z.boolean().default(false),
  hasSaunaAccess: z.boolean().default(false),
  hasPoolAccess: z.boolean().default(false),
  freezeDaysAllowed: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? 0 : val),
    z.number().min(0).default(0)
  ),

  // Status
  isActive: z.boolean().default(true),
  sortOrder: z.preprocess(
    (val) => (val === "" || Number.isNaN(val) ? 0 : val),
    z.number().default(0)
  ),
}).refine(
  (data) => !data.availableFrom || !data.availableUntil ||
            new Date(data.availableFrom) <= new Date(data.availableUntil),
  { message: "Start date must be before end date", path: ["availableUntil"] }
).refine(
  (data) => !data.minimumAge || !data.maximumAge || data.minimumAge <= data.maximumAge,
  { message: "Minimum age must be less than maximum age", path: ["maximumAge"] }
);

export type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  plan?: MembershipPlan;
  onSubmit: (data: PlanFormData) => void;
  isPending?: boolean;
}

// Helper to calculate gross amount
function calculateGross(amount: number, taxRate: number): number {
  return Number((amount + (amount * taxRate / 100)).toFixed(2));
}

export function PlanForm({ plan, onSubmit, isPending }: PlanFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: {
        en: plan?.name.en || "",
        ar: plan?.name.ar || "",
      },
      description: {
        en: plan?.description?.en || "",
        ar: plan?.description?.ar || "",
      },
      availableFrom: plan?.availableFrom || "",
      availableUntil: plan?.availableUntil || "",
      minimumAge: plan?.minimumAge ?? undefined,
      maximumAge: plan?.maximumAge ?? undefined,
      membershipFee: {
        amount: plan?.membershipFee?.amount ?? plan?.price?.amount ?? 0,
        currency: plan?.membershipFee?.currency ?? "SAR",
        taxRate: plan?.membershipFee?.taxRate ?? 15,
      },
      administrationFee: {
        amount: plan?.administrationFee?.amount ?? 0,
        currency: plan?.administrationFee?.currency ?? "SAR",
        taxRate: plan?.administrationFee?.taxRate ?? 15,
      },
      joinFee: {
        amount: plan?.joinFee?.amount ?? 0,
        currency: plan?.joinFee?.currency ?? "SAR",
        taxRate: plan?.joinFee?.taxRate ?? 0,
      },
      billingPeriod: plan?.billingPeriod || "MONTHLY",
      durationDays: plan?.durationDays ?? plan?.effectiveDurationDays ?? 30,
      maxClassesPerPeriod: plan?.maxClassesPerPeriod ?? plan?.classLimit ?? undefined,
      hasGuestPasses: plan?.hasGuestPasses ?? false,
      guestPassesCount: plan?.guestPassesCount ?? 0,
      hasLockerAccess: plan?.hasLockerAccess ?? false,
      hasSaunaAccess: plan?.hasSaunaAccess ?? false,
      hasPoolAccess: plan?.hasPoolAccess ?? false,
      freezeDaysAllowed: plan?.freezeDaysAllowed ?? 0,
      isActive: plan?.isActive ?? true,
      sortOrder: plan?.sortOrder ?? 0,
    },
  });

  const watchedValues = watch();
  const selectedBillingPeriod = watchedValues.billingPeriod;
  const hasGuestPasses = watchedValues.hasGuestPasses;

  const billingPeriodLabels: Record<BillingPeriod, { en: string; ar: string }> = {
    DAILY: { en: "Daily", ar: "يومي" },
    WEEKLY: { en: "Weekly", ar: "أسبوعي" },
    BIWEEKLY: { en: "Bi-weekly", ar: "كل أسبوعين" },
    MONTHLY: { en: "Monthly", ar: "شهري" },
    QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
    YEARLY: { en: "Yearly", ar: "سنوي" },
    ONE_TIME: { en: "One-time", ar: "مرة واحدة" },
  };

  const texts = {
    basicInfo: isArabic ? "المعلومات الأساسية" : "Basic Information",
    nameEn: isArabic ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: isArabic ? "الاسم (عربي)" : "Name (Arabic)",
    descEn: isArabic ? "الوصف (إنجليزي)" : "Description (English)",
    descAr: isArabic ? "الوصف (عربي)" : "Description (Arabic)",

    billingDuration: isArabic ? "الفوترة والمدة" : "Billing & Duration",
    billingPeriod: isArabic ? "فترة الفوترة" : "Billing Period",
    duration: isArabic ? "المدة (أيام)" : "Duration (Days)",
    classLimit: isArabic ? "حد الحصص" : "Class Limit",
    classLimitDesc: isArabic ? "اتركه فارغاً للحصص غير المحدودة" : "Leave empty for unlimited classes",

    dateRestrictions: isArabic ? "قيود التاريخ" : "Date Restrictions",
    dateRestrictionsDesc: isArabic ? "اتركه فارغاً ليكون متاحاً دائماً" : "Leave empty to make always available",
    availableFrom: isArabic ? "متاح من" : "Available From",
    availableUntil: isArabic ? "متاح حتى" : "Available Until",

    ageRestrictions: isArabic ? "قيود العمر" : "Age Restrictions",
    ageRestrictionsDesc: isArabic ? "اتركه فارغاً ليكون متاحاً لجميع الأعمار" : "Leave empty to make available for all ages",
    minimumAge: isArabic ? "الحد الأدنى للعمر" : "Minimum Age",
    maximumAge: isArabic ? "الحد الأقصى للعمر" : "Maximum Age",

    feeStructure: isArabic ? "هيكل الرسوم" : "Fee Structure",
    feeStructureDesc: isArabic ? "حدد الرسوم المختلفة ومعدلات الضرائب الخاصة بها" : "Define different fees and their tax rates",
    membershipFee: isArabic ? "رسوم العضوية" : "Membership Fee",
    membershipFeeDesc: isArabic ? "الرسوم المتكررة الرئيسية للاشتراك" : "Main recurring fee for subscription",
    adminFee: isArabic ? "الرسوم الإدارية" : "Administration Fee",
    adminFeeDesc: isArabic ? "رسوم إدارية إضافية (اختياري)" : "Additional administrative fee (optional)",
    joinFee: isArabic ? "رسوم الانضمام" : "Joining Fee",
    joinFeeDesc: isArabic ? "رسوم لمرة واحدة للمشتركين الجدد فقط" : "One-time fee for first-time subscribers only",
    amount: isArabic ? "المبلغ" : "Amount",
    taxRate: isArabic ? "معدل الضريبة (%)" : "Tax Rate (%)",
    gross: isArabic ? "الإجمالي" : "Gross",

    features: isArabic ? "المميزات" : "Features",
    featuresDesc: isArabic ? "المميزات الإضافية المضمنة في هذه الباقة" : "Additional features included in this plan",
    guestPasses: isArabic ? "تصاريح الضيوف" : "Guest Passes",
    guestPassesCount: isArabic ? "عدد التصاريح" : "Number of Passes",
    lockerAccess: isArabic ? "الوصول للخزائن" : "Locker Access",
    saunaAccess: isArabic ? "الوصول للساونا" : "Sauna Access",
    poolAccess: isArabic ? "الوصول للمسبح" : "Pool Access",
    freezeDays: isArabic ? "أيام التجميد المسموحة" : "Freeze Days Allowed",

    status: isArabic ? "الحالة" : "Status",
    statusDesc: isArabic ? "تحكم في ظهور الباقة وتوفرها" : "Control plan visibility and availability",
    isActive: isArabic ? "الباقة نشطة" : "Plan is Active",
    isActiveDesc: isArabic ? "الباقات غير النشطة لن تظهر للاشتراكات الجديدة" : "Inactive plans won't be shown for new subscriptions",
    sortOrder: isArabic ? "ترتيب العرض" : "Display Order",

    saving: isArabic ? "جاري الحفظ..." : "Saving...",
    saveChanges: isArabic ? "حفظ التغييرات" : "Save Changes",
    createPlan: isArabic ? "إنشاء الباقة" : "Create Plan",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {texts.basicInfo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name.en">{texts.nameEn} *</Label>
              <Input
                id="name.en"
                {...register("name.en")}
                placeholder="Premium Plan"
              />
              {errors.name?.en && (
                <p className="text-sm text-destructive">{errors.name.en.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name.ar">{texts.nameAr}</Label>
              <Input
                id="name.ar"
                {...register("name.ar")}
                placeholder="الباقة المميزة"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description.en">{texts.descEn}</Label>
              <Textarea
                id="description.en"
                {...register("description.en")}
                placeholder="Full access to all facilities..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description.ar">{texts.descAr}</Label>
              <Textarea
                id="description.ar"
                {...register("description.ar")}
                placeholder="وصول كامل لجميع المرافق..."
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Duration */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.billingDuration}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">{texts.billingPeriod} *</Label>
              <Select
                value={selectedBillingPeriod}
                onValueChange={(value) => setValue("billingPeriod", value as BillingPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingPeriodOptions.map((period) => (
                    <SelectItem key={period} value={period}>
                      {isArabic
                        ? billingPeriodLabels[period].ar
                        : billingPeriodLabels[period].en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="durationDays">{texts.duration}</Label>
              <Input
                id="durationDays"
                type="number"
                {...register("durationDays", { valueAsNumber: true })}
                placeholder="30"
                min={1}
              />
              {errors.durationDays && (
                <p className="text-sm text-destructive">{errors.durationDays.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxClassesPerPeriod">{texts.classLimit}</Label>
              <Input
                id="maxClassesPerPeriod"
                type="number"
                {...register("maxClassesPerPeriod", { valueAsNumber: true })}
                placeholder="∞"
                min={0}
              />
              <p className="text-xs text-muted-foreground">{texts.classLimitDesc}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {texts.dateRestrictions}
          </CardTitle>
          <CardDescription>{texts.dateRestrictionsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="availableFrom">{texts.availableFrom}</Label>
              <Input
                id="availableFrom"
                type="date"
                {...register("availableFrom")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableUntil">{texts.availableUntil}</Label>
              <Input
                id="availableUntil"
                type="date"
                {...register("availableUntil")}
              />
              {errors.availableUntil && (
                <p className="text-sm text-destructive">{errors.availableUntil.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Age Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {texts.ageRestrictions}
          </CardTitle>
          <CardDescription>{texts.ageRestrictionsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimumAge">{texts.minimumAge}</Label>
              <Input
                id="minimumAge"
                type="number"
                {...register("minimumAge", { valueAsNumber: true })}
                placeholder="18"
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maximumAge">{texts.maximumAge}</Label>
              <Input
                id="maximumAge"
                type="number"
                {...register("maximumAge", { valueAsNumber: true })}
                placeholder="65"
                min={0}
              />
              {errors.maximumAge && (
                <p className="text-sm text-destructive">{errors.maximumAge.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {texts.feeStructure}
          </CardTitle>
          <CardDescription>{texts.feeStructureDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Membership Fee */}
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold">{texts.membershipFee} *</Label>
              <p className="text-sm text-muted-foreground">{texts.membershipFeeDesc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="membershipFee.amount">{texts.amount}</Label>
                <div className="relative">
                  <Input
                    id="membershipFee.amount"
                    type="number"
                    {...register("membershipFee.amount", { valueAsNumber: true })}
                    placeholder="299"
                    min={0}
                    step="0.01"
                    className="pe-16"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    SAR
                  </span>
                </div>
                {errors.membershipFee?.amount && (
                  <p className="text-sm text-destructive">{errors.membershipFee.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="membershipFee.taxRate">{texts.taxRate}</Label>
                <Input
                  id="membershipFee.taxRate"
                  type="number"
                  {...register("membershipFee.taxRate", { valueAsNumber: true })}
                  placeholder="15"
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.gross}</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="font-medium">
                    {calculateGross(
                      watchedValues.membershipFee?.amount || 0,
                      watchedValues.membershipFee?.taxRate || 0
                    ).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Administration Fee */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label className="text-base font-semibold">{texts.adminFee}</Label>
              <p className="text-sm text-muted-foreground">{texts.adminFeeDesc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="administrationFee.amount">{texts.amount}</Label>
                <div className="relative">
                  <Input
                    id="administrationFee.amount"
                    type="number"
                    {...register("administrationFee.amount", { valueAsNumber: true })}
                    placeholder="0"
                    min={0}
                    step="0.01"
                    className="pe-16"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    SAR
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="administrationFee.taxRate">{texts.taxRate}</Label>
                <Input
                  id="administrationFee.taxRate"
                  type="number"
                  {...register("administrationFee.taxRate", { valueAsNumber: true })}
                  placeholder="15"
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.gross}</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="font-medium">
                    {calculateGross(
                      watchedValues.administrationFee?.amount || 0,
                      watchedValues.administrationFee?.taxRate || 0
                    ).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Join Fee */}
          <div className="space-y-3 pt-4 border-t">
            <div>
              <Label className="text-base font-semibold">{texts.joinFee}</Label>
              <p className="text-sm text-muted-foreground">{texts.joinFeeDesc}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="joinFee.amount">{texts.amount}</Label>
                <div className="relative">
                  <Input
                    id="joinFee.amount"
                    type="number"
                    {...register("joinFee.amount", { valueAsNumber: true })}
                    placeholder="0"
                    min={0}
                    step="0.01"
                    className="pe-16"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    SAR
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinFee.taxRate">{texts.taxRate}</Label>
                <Input
                  id="joinFee.taxRate"
                  type="number"
                  {...register("joinFee.taxRate", { valueAsNumber: true })}
                  placeholder="0"
                  min={0}
                  max={100}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>{texts.gross}</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center">
                  <span className="font-medium">
                    {calculateGross(
                      watchedValues.joinFee?.amount || 0,
                      watchedValues.joinFee?.taxRate || 0
                    ).toFixed(2)} SAR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {texts.features}
          </CardTitle>
          <CardDescription>{texts.featuresDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
              <Label htmlFor="hasGuestPasses" className="cursor-pointer">{texts.guestPasses}</Label>
              <Switch
                id="hasGuestPasses"
                checked={hasGuestPasses}
                onCheckedChange={(checked) => setValue("hasGuestPasses", checked)}
              />
            </div>
            {hasGuestPasses && (
              <div className="space-y-2">
                <Label htmlFor="guestPassesCount">{texts.guestPassesCount}</Label>
                <Input
                  id="guestPassesCount"
                  type="number"
                  {...register("guestPassesCount", { valueAsNumber: true })}
                  placeholder="2"
                  min={0}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
              <Label htmlFor="hasLockerAccess" className="cursor-pointer">{texts.lockerAccess}</Label>
              <Switch
                id="hasLockerAccess"
                checked={watchedValues.hasLockerAccess}
                onCheckedChange={(checked) => setValue("hasLockerAccess", checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
              <Label htmlFor="hasSaunaAccess" className="cursor-pointer">{texts.saunaAccess}</Label>
              <Switch
                id="hasSaunaAccess"
                checked={watchedValues.hasSaunaAccess}
                onCheckedChange={(checked) => setValue("hasSaunaAccess", checked)}
              />
            </div>
            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
              <Label htmlFor="hasPoolAccess" className="cursor-pointer">{texts.poolAccess}</Label>
              <Switch
                id="hasPoolAccess"
                checked={watchedValues.hasPoolAccess}
                onCheckedChange={(checked) => setValue("hasPoolAccess", checked)}
              />
            </div>
          </div>

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="freezeDaysAllowed">{texts.freezeDays}</Label>
            <Input
              id="freezeDaysAllowed"
              type="number"
              {...register("freezeDaysAllowed", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.status}</CardTitle>
          <CardDescription>{texts.statusDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
            <div>
              <Label htmlFor="isActive" className="cursor-pointer">{texts.isActive}</Label>
              <p className="text-sm text-muted-foreground">{texts.isActiveDesc}</p>
            </div>
            <Switch
              id="isActive"
              checked={watchedValues.isActive}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>

          <div className="space-y-2 max-w-xs">
            <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
            <Input
              id="sortOrder"
              type="number"
              {...register("sortOrder", { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? texts.saving
            : plan
              ? texts.saveChanges
              : texts.createPlan}
        </Button>
      </div>
    </form>
  );
}
