"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CreditCard, Plus, Tag, Calendar, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickCreatePlanDialog } from "../quick-create-plan-dialog";
import { useActiveClientPlans } from "@/queries/platform/use-client-plans";
import { getLocalizedText, cn } from "@/lib/utils";
import type { BillingCycle, ClientPlanSummary } from "@/types/platform/client-plan";
import type { OnboardingFormValues } from "./types";

interface SubscriptionStepProps {
  form: UseFormReturn<OnboardingFormValues>;
  locale: string;
}

const BILLING_CYCLES: { value: BillingCycle; labelEn: string; labelAr: string }[] = [
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "شهري" },
  { value: "QUARTERLY", labelEn: "Quarterly", labelAr: "ربع سنوي" },
  { value: "ANNUAL", labelEn: "Annual", labelAr: "سنوي" },
];

export function SubscriptionStep({ form, locale }: SubscriptionStepProps) {
  const isRtl = locale === "ar";
  const { register, watch, setValue, formState: { errors } } = form;
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  // Fetch active plans
  const { data: activePlans } = useActiveClientPlans();

  const createSubscription = watch("createSubscription");
  const startWithTrial = watch("startWithTrial");
  const watchBillingCycle = watch("billingCycle");
  const watchClientPlanId = watch("clientPlanId");

  const texts = {
    title: locale === "ar" ? "الاشتراك" : "Subscription",
    description:
      locale === "ar"
        ? "اختر خطة اشتراك للعميل (اختياري). يمكن إضافة الاشتراك لاحقاً."
        : "Choose a subscription plan for the client (optional). Subscription can be added later.",
    enableSubscription: locale === "ar" ? "إنشاء اشتراك" : "Create Subscription",
    enableSubDesc:
      locale === "ar"
        ? "إنشاء اشتراك للعميل في المنصة الآن"
        : "Create a platform subscription for this client now",
    plan: locale === "ar" ? "الخطة" : "Plan",
    selectPlan: locale === "ar" ? "اختر الخطة" : "Select a plan",
    createNewPlan: locale === "ar" ? "إنشاء خطة جديدة" : "Create New Plan",
    pricing: locale === "ar" ? "التسعير" : "Pricing",
    agreedPrice: locale === "ar" ? "السعر المتفق عليه" : "Agreed Price",
    billingCycle: locale === "ar" ? "دورة الفوترة" : "Billing Cycle",
    contractTerms: locale === "ar" ? "شروط العقد" : "Contract Terms",
    contractMonths: locale === "ar" ? "مدة العقد (شهور)" : "Contract Duration (months)",
    discount: locale === "ar" ? "نسبة الخصم" : "Discount",
    trial: locale === "ar" ? "فترة تجريبية" : "Trial Period",
    enableTrial: locale === "ar" ? "بدء بفترة تجريبية" : "Start with Trial",
    trialDesc:
      locale === "ar"
        ? "بدء الاشتراك بفترة تجريبية مجانية"
        : "Start subscription with a free trial period",
    trialDays: locale === "ar" ? "أيام التجربة" : "Trial Days",
    skipNote:
      locale === "ar"
        ? "يمكنك تخطي هذه الخطوة وإضافة الاشتراك لاحقاً من صفحة العميل."
        : "You can skip this step and add subscription later from the client page.",
  };

  // Handle when a new plan is created from the dialog
  const handlePlanCreated = (plan: ClientPlanSummary) => {
    setValue("clientPlanId", plan.id);
    setValue("agreedPriceAmount", plan.monthlyPrice.amount);
    setValue("agreedPriceCurrency", plan.monthlyPrice.currency);
  };

  return (
    <Card className="border-cyan-500/20 dark:border-cyan-500/30">
      <CardHeader className={cn(isRtl && "text-right")}>
        <div className={cn("flex items-center gap-3", isRtl && "flex-row-reverse")}>
          <div className="p-2 rounded-lg bg-cyan-500/20">
            <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <CardTitle className="text-lg">{texts.title}</CardTitle>
            <CardDescription className="mt-1">{texts.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Subscription Toggle */}
        <div className={cn(
          "flex items-center justify-between rounded-lg border p-4",
          isRtl && "flex-row-reverse"
        )}>
          <div className={cn("space-y-0.5", isRtl && "text-right")}>
            <Label className="text-base font-medium">{texts.enableSubscription}</Label>
            <p className="text-sm text-muted-foreground">{texts.enableSubDesc}</p>
          </div>
          <Switch
            checked={createSubscription}
            onCheckedChange={(checked) => setValue("createSubscription", checked)}
          />
        </div>

        {createSubscription ? (
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="space-y-2">
              <Label className={cn(isRtl && "text-right block")}>
                {texts.plan} <span className="text-destructive">*</span>
              </Label>
              <Select value={watchClientPlanId || ""} onValueChange={(v) => setValue("clientPlanId", v)}>
                <SelectTrigger className={cn(errors.clientPlanId && "border-destructive")}>
                  <SelectValue placeholder={texts.selectPlan} />
                </SelectTrigger>
                <SelectContent>
                  {/* Create New Plan Option */}
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none text-primary hover:bg-accent hover:text-accent-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPlanDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {texts.createNewPlan}
                  </div>
                  {activePlans && activePlans.length > 0 && <SelectSeparator />}
                  {/* Existing Plans */}
                  {activePlans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {getLocalizedText(plan.name, locale)} - {plan.monthlyPrice.amount}{" "}
                      {plan.monthlyPrice.currency}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <Tag className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="font-medium">{texts.pricing}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agreedPriceAmount" className={cn(isRtl && "text-right block")}>
                    {texts.agreedPrice} (SAR)
                  </Label>
                  <Input
                    id="agreedPriceAmount"
                    type="number"
                    min={0}
                    step={0.01}
                    {...register("agreedPriceAmount")}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={cn(isRtl && "text-right block")}>{texts.billingCycle}</Label>
                  <Select
                    value={watchBillingCycle || "MONTHLY"}
                    onValueChange={(v) => setValue("billingCycle", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_CYCLES.map((cycle) => (
                        <SelectItem key={cycle.value} value={cycle.value}>
                          {locale === "ar" ? cycle.labelAr : cycle.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contract Terms */}
            <div className="space-y-4">
              <div className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                <Calendar className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="font-medium">{texts.contractTerms}</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractMonths" className={cn(isRtl && "text-right block")}>
                    {texts.contractMonths}
                  </Label>
                  <Input
                    id="contractMonths"
                    type="number"
                    min={1}
                    {...register("contractMonths")}
                    placeholder="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage" className={cn(isRtl && "text-right block")}>
                    <div className={cn("flex items-center gap-1", isRtl && "flex-row-reverse justify-end")}>
                      <Percent className="h-3 w-3" />
                      {texts.discount}
                    </div>
                  </Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    min={0}
                    max={100}
                    {...register("discountPercentage")}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Trial Period */}
            <div className="space-y-4">
              <div className={cn(
                "flex items-center justify-between rounded-lg border p-4",
                isRtl && "flex-row-reverse"
              )}>
                <div className={cn("space-y-0.5", isRtl && "text-right")}>
                  <Label className="text-base font-medium">{texts.enableTrial}</Label>
                  <p className="text-sm text-muted-foreground">{texts.trialDesc}</p>
                </div>
                <Switch
                  checked={startWithTrial}
                  onCheckedChange={(checked) => setValue("startWithTrial", checked)}
                />
              </div>

              {startWithTrial && (
                <div className="space-y-2">
                  <Label htmlFor="trialDays" className={cn(isRtl && "text-right block")}>
                    {texts.trialDays}
                  </Label>
                  <Input
                    id="trialDays"
                    type="number"
                    min={1}
                    {...register("trialDays")}
                    placeholder="14"
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Skip Note */
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900",
            isRtl && "flex-row-reverse text-right"
          )}>
            <CreditCard className="h-5 w-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <p className="text-sm text-cyan-800 dark:text-cyan-200">{texts.skipNote}</p>
          </div>
        )}
      </CardContent>

      {/* Quick Create Plan Dialog */}
      <QuickCreatePlanDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        onPlanCreated={handlePlanCreated}
      />
    </Card>
  );
}
