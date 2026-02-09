import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
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
import { useActiveClientPlans } from "@/hooks/use-client-plans";
import { getLocalizedText, cn } from "@/lib/utils";
import type { BillingCycle, ClientPlanSummary } from "@/types";
import type { ConvertDealFormValues } from "./types";

interface SubscriptionStepProps {
  form: UseFormReturn<ConvertDealFormValues>;
  locale: string;
}

const BILLING_CYCLES: { value: BillingCycle; labelEn: string; labelAr: string }[] = [
  { value: "MONTHLY", labelEn: "Monthly", labelAr: "\u0634\u0647\u0631\u064A" },
  { value: "QUARTERLY", labelEn: "Quarterly", labelAr: "\u0631\u0628\u0639 \u0633\u0646\u0648\u064A" },
  { value: "ANNUAL", labelEn: "Annual", labelAr: "\u0633\u0646\u0648\u064A" },
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
    title: locale === "ar" ? "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643" : "Subscription",
    description:
      locale === "ar"
        ? "\u0627\u062E\u062A\u0631 \u062E\u0637\u0629 \u0627\u0634\u062A\u0631\u0627\u0643 \u0644\u0644\u0639\u0645\u064A\u0644 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A). \u064A\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0644\u0627\u062D\u0642\u0627\u064B."
        : "Choose a subscription plan for the client (optional). Subscription can be added later.",
    enableSubscription: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643" : "Create Subscription",
    enableSubDesc:
      locale === "ar"
        ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643 \u0644\u0644\u0639\u0645\u064A\u0644 \u0641\u064A \u0627\u0644\u0645\u0646\u0635\u0629 \u0627\u0644\u0622\u0646"
        : "Create a platform subscription for this client now",
    plan: locale === "ar" ? "\u0627\u0644\u062E\u0637\u0629" : "Plan",
    selectPlan: locale === "ar" ? "\u0627\u062E\u062A\u0631 \u0627\u0644\u062E\u0637\u0629" : "Select a plan",
    createNewPlan: locale === "ar" ? "\u0625\u0646\u0634\u0627\u0621 \u062E\u0637\u0629 \u062C\u062F\u064A\u062F\u0629" : "Create New Plan",
    pricing: locale === "ar" ? "\u0627\u0644\u062A\u0633\u0639\u064A\u0631" : "Pricing",
    agreedPrice: locale === "ar" ? "\u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0645\u062A\u0641\u0642 \u0639\u0644\u064A\u0647" : "Agreed Price",
    billingCycle: locale === "ar" ? "\u062F\u0648\u0631\u0629 \u0627\u0644\u0641\u0648\u062A\u0631\u0629" : "Billing Cycle",
    contractTerms: locale === "ar" ? "\u0634\u0631\u0648\u0637 \u0627\u0644\u0639\u0642\u062F" : "Contract Terms",
    contractMonths: locale === "ar" ? "\u0645\u062F\u0629 \u0627\u0644\u0639\u0642\u062F (\u0634\u0647\u0648\u0631)" : "Contract Duration (months)",
    discount: locale === "ar" ? "\u0646\u0633\u0628\u0629 \u0627\u0644\u062E\u0635\u0645" : "Discount",
    trial: locale === "ar" ? "\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629" : "Trial Period",
    enableTrial: locale === "ar" ? "\u0628\u062F\u0621 \u0628\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629" : "Start with Trial",
    trialDesc:
      locale === "ar"
        ? "\u0628\u062F\u0621 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0641\u062A\u0631\u0629 \u062A\u062C\u0631\u064A\u0628\u064A\u0629 \u0645\u062C\u0627\u0646\u064A\u0629"
        : "Start subscription with a free trial period",
    trialDays: locale === "ar" ? "\u0623\u064A\u0627\u0645 \u0627\u0644\u062A\u062C\u0631\u0628\u0629" : "Trial Days",
    skipNote:
      locale === "ar"
        ? "\u064A\u0645\u0643\u0646\u0643 \u062A\u062E\u0637\u064A \u0647\u0630\u0647 \u0627\u0644\u062E\u0637\u0648\u0629 \u0648\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0644\u0627\u062D\u0642\u0627\u064B \u0645\u0646 \u0635\u0641\u062D\u0629 \u0627\u0644\u0639\u0645\u064A\u0644."
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
