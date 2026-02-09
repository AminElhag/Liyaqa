"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useCallback } from "react";
import {
  Package,
  DollarSign,
  Building2,
  Users,
  Smartphone,
  Watch,
  Megaphone,
  Award,
  DoorOpen,
  CalendarCheck,
  Dumbbell,
  Briefcase,
  Heart,
  CreditCard,
  BarChart3,
  Code,
  HeadphonesIcon,
  Palette,
  Plug,
  AlertCircle,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@liyaqa/shared/components/ui/tooltip";
import {
  FEATURE_CATEGORIES,
  FEATURE_DEPENDENCIES,
  getDependentFeatures,
  type FeatureKey,
} from "@liyaqa/shared/types/platform/client-plan";

/**
 * Icon mapping for feature keys
 */
const FEATURE_ICONS: Record<FeatureKey, React.ElementType> = {
  hasMemberPortal: Users,
  hasMobileApp: Smartphone,
  hasWearablesIntegration: Watch,
  hasMarketingAutomation: Megaphone,
  hasLoyaltyProgram: Award,
  hasAccessControl: DoorOpen,
  hasFacilityBooking: CalendarCheck,
  hasPersonalTraining: Dumbbell,
  hasCorporateAccounts: Briefcase,
  hasFamilyGroups: Heart,
  hasOnlinePayments: CreditCard,
  hasAdvancedReporting: BarChart3,
  hasApiAccess: Code,
  hasPrioritySupport: HeadphonesIcon,
  hasWhiteLabeling: Palette,
  hasCustomIntegrations: Plug,
};

/**
 * Zod validation schema for client plan form.
 */
const planFormSchema = z.object({
  // Basic Info
  nameEn: z.string().min(1, "English name is required"),
  nameAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),

  // Pricing
  monthlyPriceAmount: z.coerce.number().min(0, "Price must be positive"),
  monthlyPriceCurrency: z.string().default("SAR"),
  annualPriceAmount: z.coerce.number().min(0, "Price must be positive"),
  annualPriceCurrency: z.string().default("SAR"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),

  // Usage Limits
  maxClubs: z.coerce.number().min(1, "Must allow at least 1 club").default(1),
  maxLocationsPerClub: z.coerce.number().min(1, "Must allow at least 1 location").default(3),
  maxMembers: z.coerce.number().min(1, "Must allow at least 1 member").default(100),
  maxStaffUsers: z.coerce.number().min(1, "Must allow at least 1 staff").default(5),

  // Member Engagement Features
  hasMemberPortal: z.boolean().default(false),
  hasMobileApp: z.boolean().default(false),
  hasWearablesIntegration: z.boolean().default(false),

  // Marketing & Loyalty Features
  hasMarketingAutomation: z.boolean().default(false),
  hasLoyaltyProgram: z.boolean().default(false),

  // Operations Features
  hasAccessControl: z.boolean().default(false),
  hasFacilityBooking: z.boolean().default(false),
  hasPersonalTraining: z.boolean().default(false),

  // Accounts & Payments Features
  hasCorporateAccounts: z.boolean().default(false),
  hasFamilyGroups: z.boolean().default(false),
  hasOnlinePayments: z.boolean().default(false),

  // Legacy Features
  hasAdvancedReporting: z.boolean().default(false),
  hasApiAccess: z.boolean().default(false),
  hasPrioritySupport: z.boolean().default(false),
  hasWhiteLabeling: z.boolean().default(false),
  hasCustomIntegrations: z.boolean().default(false),

  // Display
  sortOrder: z.coerce.number().min(0).default(0),
});

export type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  defaultValues?: Partial<PlanFormValues>;
  onSubmit: (data: PlanFormValues) => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * Form component for creating and editing client plans.
 * Contains sections for: Basic Info, Pricing, Usage Limits, and Features by category.
 */
export function PlanForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  mode,
}: PlanFormProps) {
  const locale = useLocale();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      nameEn: "",
      nameAr: "",
      descriptionEn: "",
      descriptionAr: "",
      monthlyPriceAmount: 0,
      monthlyPriceCurrency: "SAR",
      annualPriceAmount: 0,
      annualPriceCurrency: "SAR",
      billingCycle: "MONTHLY",
      maxClubs: 1,
      maxLocationsPerClub: 3,
      maxMembers: 100,
      maxStaffUsers: 5,
      hasMemberPortal: false,
      hasMobileApp: false,
      hasWearablesIntegration: false,
      hasMarketingAutomation: false,
      hasLoyaltyProgram: false,
      hasAccessControl: false,
      hasFacilityBooking: false,
      hasPersonalTraining: false,
      hasCorporateAccounts: false,
      hasFamilyGroups: false,
      hasOnlinePayments: false,
      hasAdvancedReporting: false,
      hasApiAccess: false,
      hasPrioritySupport: false,
      hasWhiteLabeling: false,
      hasCustomIntegrations: false,
      sortOrder: 0,
      ...defaultValues,
    },
  });

  // Watch values for calculations and dependencies
  const monthlyPrice = watch("monthlyPriceAmount");
  const annualPrice = watch("annualPriceAmount");
  const billingCycle = watch("billingCycle");

  // Watch all feature values for dependency handling
  const featureValues = {
    hasMemberPortal: watch("hasMemberPortal"),
    hasMobileApp: watch("hasMobileApp"),
    hasWearablesIntegration: watch("hasWearablesIntegration"),
    hasMarketingAutomation: watch("hasMarketingAutomation"),
    hasLoyaltyProgram: watch("hasLoyaltyProgram"),
    hasAccessControl: watch("hasAccessControl"),
    hasFacilityBooking: watch("hasFacilityBooking"),
    hasPersonalTraining: watch("hasPersonalTraining"),
    hasCorporateAccounts: watch("hasCorporateAccounts"),
    hasFamilyGroups: watch("hasFamilyGroups"),
    hasOnlinePayments: watch("hasOnlinePayments"),
    hasAdvancedReporting: watch("hasAdvancedReporting"),
    hasApiAccess: watch("hasApiAccess"),
    hasPrioritySupport: watch("hasPrioritySupport"),
    hasWhiteLabeling: watch("hasWhiteLabeling"),
    hasCustomIntegrations: watch("hasCustomIntegrations"),
  };

  /**
   * Handle feature toggle with dependency management.
   * When enabling a feature: auto-enable its dependencies
   * When disabling a feature: auto-disable dependent features
   */
  const handleFeatureToggle = useCallback((featureKey: FeatureKey, enabled: boolean) => {
    if (enabled) {
      // Enable the feature
      setValue(featureKey, true);

      // Auto-enable dependency if exists
      const dependency = FEATURE_DEPENDENCIES[featureKey];
      if (dependency) {
        setValue(dependency as FeatureKey, true);
        // Also enable transitive dependencies
        const transitiveDep = FEATURE_DEPENDENCIES[dependency];
        if (transitiveDep) {
          setValue(transitiveDep as FeatureKey, true);
        }
      }
    } else {
      // Disable the feature
      setValue(featureKey, false);

      // Auto-disable dependent features
      const dependents = getDependentFeatures(featureKey);
      dependents.forEach((dependent) => {
        setValue(dependent as FeatureKey, false);
      });
    }
  }, [setValue]);

  /**
   * Check if a feature is disabled due to missing dependency.
   */
  const isFeatureDisabled = (featureKey: FeatureKey): boolean => {
    const dependency = FEATURE_DEPENDENCIES[featureKey];
    if (!dependency) return false;
    return !featureValues[dependency as FeatureKey];
  };

  // Calculate annual savings
  const annualSavings = monthlyPrice * 12 - annualPrice;
  const effectiveMonthly = annualPrice / 12;

  const texts = {
    // Section headers
    basicInfo: locale === "ar" ? "المعلومات الأساسية" : "Basic Information",
    basicDesc: locale === "ar" ? "اسم الخطة ووصفها" : "Plan name and description",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    pricingDesc: locale === "ar" ? "أسعار الخطة الشهرية والسنوية" : "Monthly and annual pricing",
    limits: locale === "ar" ? "حدود الاستخدام" : "Usage Limits",
    limitsDesc: locale === "ar" ? "الحدود القصوى للموارد" : "Maximum resource allocations",
    features: locale === "ar" ? "الميزات" : "Features",
    featuresDesc: locale === "ar" ? "الميزات المضمنة في الخطة" : "Features included in the plan",

    // Fields
    nameEn: locale === "ar" ? "الاسم (إنجليزي)" : "Name (English)",
    nameAr: locale === "ar" ? "الاسم (عربي)" : "Name (Arabic)",
    descriptionEn: locale === "ar" ? "الوصف (إنجليزي)" : "Description (English)",
    descriptionAr: locale === "ar" ? "الوصف (عربي)" : "Description (Arabic)",
    monthlyPrice: locale === "ar" ? "السعر الشهري" : "Monthly Price",
    annualPrice: locale === "ar" ? "السعر السنوي" : "Annual Price",
    currency: locale === "ar" ? "العملة" : "Currency",
    annualSavings: locale === "ar" ? "التوفير السنوي" : "Annual Savings",
    effectiveMonthly: locale === "ar" ? "الشهري الفعلي (سنوي)" : "Effective Monthly (Annual)",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Default Billing Cycle",
    maxClubs: locale === "ar" ? "الحد الأقصى للأندية" : "Max Clubs",
    maxLocationsPerClub: locale === "ar" ? "الفروع لكل نادي" : "Locations per Club",
    maxMembers: locale === "ar" ? "الحد الأقصى للأعضاء" : "Max Members",
    maxStaffUsers: locale === "ar" ? "الحد الأقصى للموظفين" : "Max Staff Users",
    sortOrder: locale === "ar" ? "ترتيب العرض" : "Display Order",
    sortOrderDesc: locale === "ar" ? "ترتيب عرض الخطة في القوائم (0 = أولاً)" : "Order in which the plan appears (0 = first)",

    // Billing cycles
    monthly: locale === "ar" ? "شهري" : "Monthly",
    quarterly: locale === "ar" ? "ربع سنوي" : "Quarterly",
    annual: locale === "ar" ? "سنوي" : "Annual",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "إنشاء الخطة"
          : "Create Plan"
        : locale === "ar"
          ? "حفظ التغييرات"
          : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",

    // Validation
    required: locale === "ar" ? "مطلوب" : "Required",

    // Dependency warning
    requiresFeature: locale === "ar" ? "يتطلب تفعيل" : "Requires",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>{texts.basicInfo}</CardTitle>
          </div>
          <CardDescription>{texts.basicDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {texts.nameEn} <span className="text-destructive">*</span>
              </Label>
              <Input id="nameEn" {...register("nameEn")} />
              {errors.nameEn && (
                <p className="text-sm text-destructive">{errors.nameEn.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nameAr">{texts.nameAr}</Label>
              <Input id="nameAr" dir="rtl" {...register("nameAr")} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="descriptionEn">{texts.descriptionEn}</Label>
              <Textarea
                id="descriptionEn"
                {...register("descriptionEn")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descriptionAr">{texts.descriptionAr}</Label>
              <Textarea
                id="descriptionAr"
                dir="rtl"
                {...register("descriptionAr")}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>{texts.pricing}</CardTitle>
          </div>
          <CardDescription>{texts.pricingDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyPriceAmount">
                {texts.monthlyPrice} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="monthlyPriceAmount"
                  type="number"
                  min="0"
                  step="1"
                  {...register("monthlyPriceAmount")}
                  className="flex-1"
                />
                <Select
                  value={watch("monthlyPriceCurrency")}
                  onValueChange={(value) => {
                    setValue("monthlyPriceCurrency", value);
                    setValue("annualPriceCurrency", value); // Keep currencies in sync
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.monthlyPriceAmount && (
                <p className="text-sm text-destructive">
                  {errors.monthlyPriceAmount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="annualPriceAmount">
                {texts.annualPrice} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="annualPriceAmount"
                  type="number"
                  min="0"
                  step="1"
                  {...register("annualPriceAmount")}
                  className="flex-1"
                />
                <Select
                  value={watch("annualPriceCurrency")}
                  onValueChange={(value) => {
                    setValue("annualPriceCurrency", value);
                    setValue("monthlyPriceCurrency", value); // Keep currencies in sync
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAR">SAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.annualPriceAmount && (
                <p className="text-sm text-destructive">
                  {errors.annualPriceAmount.message}
                </p>
              )}
            </div>
          </div>

          {/* Calculated Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-muted-foreground">{texts.annualSavings}</p>
              <p className="text-lg font-semibold text-green-700">
                {formatCurrency(annualSavings > 0 ? annualSavings : 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-muted-foreground">{texts.effectiveMonthly}</p>
              <p className="text-lg font-semibold text-blue-700">
                {formatCurrency(effectiveMonthly)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingCycle">{texts.billingCycle}</Label>
            <Select
              value={billingCycle}
              onValueChange={(value) =>
                setValue("billingCycle", value as "MONTHLY" | "QUARTERLY" | "ANNUAL")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">{texts.monthly}</SelectItem>
                <SelectItem value="QUARTERLY">{texts.quarterly}</SelectItem>
                <SelectItem value="ANNUAL">{texts.annual}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{texts.limits}</CardTitle>
          </div>
          <CardDescription>{texts.limitsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxClubs">{texts.maxClubs}</Label>
              <Input
                id="maxClubs"
                type="number"
                min="1"
                {...register("maxClubs")}
              />
              {errors.maxClubs && (
                <p className="text-sm text-destructive">{errors.maxClubs.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLocationsPerClub">{texts.maxLocationsPerClub}</Label>
              <Input
                id="maxLocationsPerClub"
                type="number"
                min="1"
                {...register("maxLocationsPerClub")}
              />
              {errors.maxLocationsPerClub && (
                <p className="text-sm text-destructive">
                  {errors.maxLocationsPerClub.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMembers">{texts.maxMembers}</Label>
              <Input
                id="maxMembers"
                type="number"
                min="1"
                {...register("maxMembers")}
              />
              {errors.maxMembers && (
                <p className="text-sm text-destructive">{errors.maxMembers.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStaffUsers">{texts.maxStaffUsers}</Label>
              <Input
                id="maxStaffUsers"
                type="number"
                min="1"
                {...register("maxStaffUsers")}
              />
              {errors.maxStaffUsers && (
                <p className="text-sm text-destructive">
                  {errors.maxStaffUsers.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Cards - One per category */}
      <TooltipProvider>
        {FEATURE_CATEGORIES.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === "ar" ? category.labelAr : category.labelEn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.features.map((feature) => {
                  const Icon = FEATURE_ICONS[feature.key];
                  const isDisabled = isFeatureDisabled(feature.key);
                  const dependencyLabel = feature.dependsOn
                    ? FEATURE_CATEGORIES.flatMap((c) => c.features).find(
                        (f) => f.key === feature.dependsOn
                      )
                    : null;

                  return (
                    <div
                      key={feature.key}
                      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                        isDisabled
                          ? "opacity-60 bg-slate-50"
                          : featureValues[feature.key]
                            ? "bg-primary/5 border-primary/20"
                            : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={feature.key}
                            className={`cursor-pointer ${isDisabled ? "cursor-not-allowed" : ""}`}
                          >
                            {locale === "ar" ? feature.labelAr : feature.labelEn}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {locale === "ar" ? feature.descriptionAr : feature.descriptionEn}
                          </p>
                          {isDisabled && dependencyLabel && (
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>
                                {texts.requiresFeature}{" "}
                                {locale === "ar"
                                  ? dependencyLabel.labelAr
                                  : dependencyLabel.labelEn}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Switch
                              id={feature.key}
                              checked={featureValues[feature.key]}
                              disabled={isDisabled}
                              onCheckedChange={(checked) =>
                                handleFeatureToggle(feature.key, checked)
                              }
                            />
                          </div>
                        </TooltipTrigger>
                        {isDisabled && dependencyLabel && (
                          <TooltipContent>
                            <p>
                              {texts.requiresFeature}{" "}
                              {locale === "ar"
                                ? dependencyLabel.labelAr
                                : dependencyLabel.labelEn}
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </TooltipProvider>

      {/* Sort Order */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "ar" ? "الإعدادات الإضافية" : "Additional Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="sortOrder">{texts.sortOrder}</Label>
            <Input
              id="sortOrder"
              type="number"
              min="0"
              {...register("sortOrder")}
              className="w-32"
            />
            <p className="text-sm text-muted-foreground">{texts.sortOrderDesc}</p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? texts.submitting : texts.submit}
        </Button>
      </div>
    </form>
  );
}
