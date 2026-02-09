"use client";

import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  DollarSign,
  Calendar,
  Clock,
  Package,
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
import { usePlatformClients } from "@liyaqa/shared/queries/platform/use-platform-clients";
import { useActiveClientPlans } from "@liyaqa/shared/queries/platform/use-client-plans";
import type { ClientSubscription } from "@liyaqa/shared/types/platform/client-subscription";
import type { LocalizedText, Money } from "@liyaqa/shared/types/api";

/**
 * Zod validation schema for subscription form.
 */
const subscriptionFormSchema = z.object({
  // Organization & Plan
  organizationId: z.string().min(1, "Organization is required"),
  clientPlanId: z.string().min(1, "Plan is required"),

  // Pricing
  agreedPriceAmount: z.coerce.number().min(0, "Price must be positive"),
  agreedPriceCurrency: z.string().default("SAR"),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),

  // Contract Terms
  contractMonths: z.coerce.number().min(1, "Contract must be at least 1 month").default(12),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL"]).default("MONTHLY"),
  autoRenew: z.boolean().default(false),

  // Trial
  startWithTrial: z.boolean().default(false),
  trialDays: z.coerce.number().min(1).max(90).optional(),

  // Sales tracking
  salesRepId: z.string().optional(),
  dealId: z.string().optional(),

  // Notes
  notesEn: z.string().optional(),
  notesAr: z.string().optional(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>;

interface SubscriptionFormProps {
  defaultValues?: Partial<SubscriptionFormValues>;
  subscription?: ClientSubscription;
  onSubmit: (data: SubscriptionFormValues) => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

/**
 * Get localized text based on locale.
 */
function getLocalizedText(text: LocalizedText | undefined, locale: string): string {
  if (!text) return "";
  return locale === "ar" ? text.ar || text.en : text.en;
}

/**
 * Format currency for display.
 */
function formatCurrency(money: Money | number, locale: string, currency = "SAR"): string {
  const amount = typeof money === "number" ? money : money.amount;
  const curr = typeof money === "number" ? currency : money.currency;
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: curr,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Form component for creating and editing client subscriptions.
 * Contains 4 card sections: Organization & Plan, Pricing, Contract Terms, Trial & Sales.
 */
export function SubscriptionForm({
  defaultValues,
  subscription,
  onSubmit,
  isLoading = false,
  mode,
}: SubscriptionFormProps) {
  const locale = useLocale();

  // Fetch organizations and plans for selectors
  const { data: clientsData } = usePlatformClients({ size: 100, status: "ACTIVE" });
  const { data: activePlans } = useActiveClientPlans();

  const clients = clientsData?.content || [];
  const plans = activePlans || [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      organizationId: subscription?.organizationId || "",
      clientPlanId: subscription?.clientPlanId || "",
      agreedPriceAmount: subscription?.agreedPrice.amount || 0,
      agreedPriceCurrency: subscription?.agreedPrice.currency || "SAR",
      discountPercentage: subscription?.discountPercentage || undefined,
      contractMonths: subscription?.contractMonths || 12,
      billingCycle: subscription?.billingCycle || "MONTHLY",
      autoRenew: subscription?.autoRenew || false,
      startWithTrial: false,
      trialDays: 14,
      salesRepId: subscription?.salesRepId || "",
      dealId: subscription?.dealId || "",
      notesEn: subscription?.notes?.en || "",
      notesAr: subscription?.notes?.ar || "",
      ...defaultValues,
    },
  });

  // Watch values for calculations and conditional rendering
  const watchOrgId = watch("organizationId");
  const watchPlanId = watch("clientPlanId");
  const watchAgreedPrice = watch("agreedPriceAmount");
  const watchCurrency = watch("agreedPriceCurrency");
  const watchDiscount = watch("discountPercentage") || 0;
  const watchStartWithTrial = watch("startWithTrial");
  const watchBillingCycle = watch("billingCycle");

  // Calculate effective monthly price
  const effectiveMonthly = watchAgreedPrice * (1 - watchDiscount / 100);

  // Get selected plan info
  const selectedPlan = plans.find((p) => p.id === watchPlanId);

  const texts = {
    // Section headers
    orgAndPlan: locale === "ar" ? "المؤسسة والخطة" : "Organization & Plan",
    orgAndPlanDesc:
      locale === "ar"
        ? "اختر المؤسسة والخطة للاشتراك"
        : "Select the organization and subscription plan",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    pricingDesc:
      locale === "ar"
        ? "السعر المتفق عليه والخصم"
        : "Agreed price and discount",
    contractTerms: locale === "ar" ? "شروط العقد" : "Contract Terms",
    contractTermsDesc:
      locale === "ar"
        ? "مدة العقد ودورة الفوترة"
        : "Contract duration and billing cycle",
    trialAndSales: locale === "ar" ? "التجربة والمبيعات" : "Trial & Sales",
    trialAndSalesDesc:
      locale === "ar"
        ? "خيارات الفترة التجريبية وتتبع المبيعات"
        : "Trial period options and sales tracking",

    // Fields
    organization: locale === "ar" ? "المؤسسة" : "Organization",
    selectOrganization: locale === "ar" ? "اختر المؤسسة" : "Select organization",
    plan: locale === "ar" ? "الخطة" : "Plan",
    selectPlan: locale === "ar" ? "اختر الخطة" : "Select plan",
    planPrice: locale === "ar" ? "سعر الخطة" : "Plan Price",
    agreedPrice: locale === "ar" ? "السعر المتفق عليه" : "Agreed Price",
    currency: locale === "ar" ? "العملة" : "Currency",
    discount: locale === "ar" ? "الخصم (%)" : "Discount (%)",
    effectiveMonthly: locale === "ar" ? "الشهري الفعلي" : "Effective Monthly",
    contractMonths: locale === "ar" ? "مدة العقد (شهور)" : "Contract Duration (months)",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Billing Cycle",
    autoRenew: locale === "ar" ? "تجديد تلقائي" : "Auto Renew",
    autoRenewDesc:
      locale === "ar"
        ? "تجديد الاشتراك تلقائياً عند انتهائه"
        : "Automatically renew subscription when it expires",
    enableTrial: locale === "ar" ? "تفعيل الفترة التجريبية" : "Enable Trial Period",
    enableTrialDesc:
      locale === "ar"
        ? "ابدأ الاشتراك بفترة تجريبية مجانية"
        : "Start subscription with a free trial period",
    trialDays: locale === "ar" ? "أيام التجربة" : "Trial Days",
    salesRepId: locale === "ar" ? "معرف مندوب المبيعات" : "Sales Rep ID",
    dealId: locale === "ar" ? "معرف الصفقة" : "Deal ID",
    notesEn: locale === "ar" ? "ملاحظات (إنجليزي)" : "Notes (English)",
    notesAr: locale === "ar" ? "ملاحظات (عربي)" : "Notes (Arabic)",

    // Billing cycles
    monthly: locale === "ar" ? "شهري" : "Monthly",
    quarterly: locale === "ar" ? "ربع سنوي" : "Quarterly",
    annual: locale === "ar" ? "سنوي" : "Annual",

    // Buttons
    submit:
      mode === "create"
        ? locale === "ar"
          ? "إنشاء الاشتراك"
          : "Create Subscription"
        : locale === "ar"
          ? "حفظ التغييرات"
          : "Save Changes",
    submitting: locale === "ar" ? "جاري الحفظ..." : "Saving...",

    // Other
    perMonth: locale === "ar" ? "/شهر" : "/month",
    noOrganizations:
      locale === "ar"
        ? "لا توجد مؤسسات نشطة"
        : "No active organizations",
    noPlans: locale === "ar" ? "لا توجد خطط نشطة" : "No active plans",
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Organization & Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>{texts.orgAndPlan}</CardTitle>
          </div>
          <CardDescription>{texts.orgAndPlanDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Selector */}
            <div className="space-y-2">
              <Label htmlFor="organizationId">
                {texts.organization} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchOrgId}
                onValueChange={(value) => setValue("organizationId", value)}
                disabled={mode === "edit"}
              >
                <SelectTrigger id="organizationId">
                  <SelectValue placeholder={texts.selectOrganization} />
                </SelectTrigger>
                <SelectContent>
                  {clients.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      {texts.noOrganizations}
                    </div>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {getLocalizedText(client.name, locale)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.organizationId && (
                <p className="text-sm text-destructive">
                  {errors.organizationId.message}
                </p>
              )}
            </div>

            {/* Plan Selector */}
            <div className="space-y-2">
              <Label htmlFor="clientPlanId">
                {texts.plan} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watchPlanId}
                onValueChange={(value) => {
                  setValue("clientPlanId", value);
                  // Auto-fill price from plan
                  const plan = plans.find((p) => p.id === value);
                  if (plan) {
                    setValue("agreedPriceAmount", plan.monthlyPrice.amount);
                    setValue("agreedPriceCurrency", plan.monthlyPrice.currency);
                  }
                }}
                disabled={mode === "edit"}
              >
                <SelectTrigger id="clientPlanId">
                  <SelectValue placeholder={texts.selectPlan} />
                </SelectTrigger>
                <SelectContent>
                  {plans.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      {texts.noPlans}
                    </div>
                  ) : (
                    plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {getLocalizedText(plan.name, locale)} -{" "}
                        {formatCurrency(plan.monthlyPrice, locale)}
                        {texts.perMonth}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.clientPlanId && (
                <p className="text-sm text-destructive">
                  {errors.clientPlanId.message}
                </p>
              )}
            </div>
          </div>

          {/* Selected Plan Info */}
          {selectedPlan && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-muted-foreground">{texts.planPrice}</p>
              <p className="text-lg font-semibold text-blue-700">
                {formatCurrency(selectedPlan.monthlyPrice, locale)}
                {texts.perMonth}
              </p>
            </div>
          )}
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
            {/* Agreed Price */}
            <div className="space-y-2">
              <Label htmlFor="agreedPriceAmount">
                {texts.agreedPrice} <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="agreedPriceAmount"
                  type="number"
                  min="0"
                  step="1"
                  {...register("agreedPriceAmount")}
                  className="flex-1"
                />
                <Select
                  value={watchCurrency}
                  onValueChange={(value) => setValue("agreedPriceCurrency", value)}
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
              {errors.agreedPriceAmount && (
                <p className="text-sm text-destructive">
                  {errors.agreedPriceAmount.message}
                </p>
              )}
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">{texts.discount}</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                step="1"
                {...register("discountPercentage")}
              />
              {errors.discountPercentage && (
                <p className="text-sm text-destructive">
                  {errors.discountPercentage.message}
                </p>
              )}
            </div>
          </div>

          {/* Effective Monthly Display */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-muted-foreground">{texts.effectiveMonthly}</p>
            <p className="text-lg font-semibold text-green-700">
              {formatCurrency(effectiveMonthly, locale, watchCurrency)}
              {texts.perMonth}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contract Terms Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>{texts.contractTerms}</CardTitle>
          </div>
          <CardDescription>{texts.contractTermsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Months */}
            <div className="space-y-2">
              <Label htmlFor="contractMonths">{texts.contractMonths}</Label>
              <Input
                id="contractMonths"
                type="number"
                min="1"
                max="36"
                {...register("contractMonths")}
              />
              {errors.contractMonths && (
                <p className="text-sm text-destructive">
                  {errors.contractMonths.message}
                </p>
              )}
            </div>

            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label htmlFor="billingCycle">{texts.billingCycle}</Label>
              <Select
                value={watchBillingCycle}
                onValueChange={(value) =>
                  setValue("billingCycle", value as "MONTHLY" | "QUARTERLY" | "ANNUAL")
                }
              >
                <SelectTrigger id="billingCycle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">{texts.monthly}</SelectItem>
                  <SelectItem value="QUARTERLY">{texts.quarterly}</SelectItem>
                  <SelectItem value="ANNUAL">{texts.annual}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto Renew Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="autoRenew" className="cursor-pointer">
                {texts.autoRenew}
              </Label>
              <p className="text-sm text-muted-foreground">{texts.autoRenewDesc}</p>
            </div>
            <Switch
              id="autoRenew"
              checked={watch("autoRenew")}
              onCheckedChange={(checked) => setValue("autoRenew", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trial & Sales Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>{texts.trialAndSales}</CardTitle>
          </div>
          <CardDescription>{texts.trialAndSalesDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trial Toggle - only show in create mode */}
          {mode === "create" && (
            <>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="startWithTrial" className="cursor-pointer">
                    {texts.enableTrial}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {texts.enableTrialDesc}
                  </p>
                </div>
                <Switch
                  id="startWithTrial"
                  checked={watchStartWithTrial}
                  onCheckedChange={(checked) => setValue("startWithTrial", checked)}
                />
              </div>

              {/* Trial Days - only show when trial is enabled */}
              {watchStartWithTrial && (
                <div className="space-y-2">
                  <Label htmlFor="trialDays">{texts.trialDays}</Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min="1"
                    max="90"
                    {...register("trialDays")}
                    className="w-32"
                  />
                  {errors.trialDays && (
                    <p className="text-sm text-destructive">
                      {errors.trialDays.message}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sales Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salesRepId">{texts.salesRepId}</Label>
              <Input id="salesRepId" {...register("salesRepId")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealId">{texts.dealId}</Label>
              <Input id="dealId" {...register("dealId")} />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notesEn">{texts.notesEn}</Label>
              <Textarea id="notesEn" {...register("notesEn")} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notesAr">{texts.notesAr}</Label>
              <Textarea id="notesAr" dir="rtl" {...register("notesAr")} rows={3} />
            </div>
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
