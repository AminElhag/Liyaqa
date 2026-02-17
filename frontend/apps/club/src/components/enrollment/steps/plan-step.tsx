"use client";

import { useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { useActivePlans } from "@liyaqa/shared/queries/use-plans";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { cn } from "@liyaqa/shared/utils";
import {
  Dumbbell,
  Waves,
  Flame,
  Lock,
  Users,
  Snowflake,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { EnrollmentFormData } from "../enrollment-schemas";

interface PlanStepProps {
  form: UseFormReturn<EnrollmentFormData>;
}

export function PlanStep({ form }: PlanStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { data: plans, isLoading } = useActivePlans();

  const selectedPlanId = form.watch("planId");
  const errors = form.formState.errors;

  const texts = {
    selectPlan: isAr ? "اختر خطة العضوية" : "Select a Membership Plan",
    perMonth: isAr ? "/شهر" : "/mo",
    perQuarter: isAr ? "/ربع سنة" : "/qtr",
    perYear: isAr ? "/سنة" : "/yr",
    oneTime: isAr ? "مرة واحدة" : "one-time",
    unlimited: isAr ? "غير محدود" : "Unlimited",
    classes: isAr ? "حصة" : "classes",
    pool: isAr ? "مسبح" : "Pool",
    sauna: isAr ? "ساونا" : "Sauna",
    locker: isAr ? "خزانة" : "Locker",
    guests: isAr ? "ضيوف" : "Guests",
    freeze: isAr ? "تجميد" : "Freeze",
    days: isAr ? "يوم" : "days",
    startDate: isAr ? "تاريخ البدء" : "Start Date",
    autoRenew: isAr ? "تجديد تلقائي" : "Auto-renew",
    noPlans: isAr ? "لا توجد خطط متاحة" : "No plans available",
    ageRestricted: isAr ? "قيود عمرية" : "Age restricted",
  };

  const periodLabel = (period: string) => {
    switch (period) {
      case "MONTHLY": return texts.perMonth;
      case "QUARTERLY": return texts.perQuarter;
      case "YEARLY": return texts.perYear;
      case "ONE_TIME": return texts.oneTime;
      default: return `/${period.toLowerCase()}`;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{texts.selectPlan}</p>

      {errors.planId && (
        <p className="text-sm text-destructive">{errors.planId.message}</p>
      )}

      {!plans || plans.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{texts.noPlans}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const name = isAr ? (plan.name.ar || plan.name.en) : plan.name.en;
            const price = plan.recurringTotal?.amount ?? plan.membershipFee?.grossAmount ?? 0;
            const currency = plan.recurringTotal?.currency ?? "SAR";

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => form.setValue("planId", plan.id, { shouldValidate: true })}
                className={cn(
                  "relative flex flex-col gap-3 rounded-xl border-2 p-4 text-start transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{name}</h3>
                  {plan.hasAgeRestriction && (
                    <Badge variant="secondary" className="text-xs">
                      {texts.ageRestricted}
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{price}</span>
                  <span className="text-sm text-muted-foreground">
                    {currency} {periodLabel(plan.billingPeriod)}
                  </span>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {plan.hasUnlimitedClasses ? (
                    <FeatureBadge icon={Dumbbell} label={texts.unlimited} />
                  ) : plan.maxClassesPerPeriod ? (
                    <FeatureBadge icon={Dumbbell} label={`${plan.maxClassesPerPeriod} ${texts.classes}`} />
                  ) : null}
                  {plan.hasPoolAccess && <FeatureBadge icon={Waves} label={texts.pool} />}
                  {plan.hasSaunaAccess && <FeatureBadge icon={Flame} label={texts.sauna} />}
                  {plan.hasLockerAccess && <FeatureBadge icon={Lock} label={texts.locker} />}
                  {plan.hasGuestPasses && (
                    <FeatureBadge icon={Users} label={`${plan.guestPassesCount} ${texts.guests}`} />
                  )}
                  {plan.freezeDaysAllowed > 0 && (
                    <FeatureBadge icon={Snowflake} label={`${plan.freezeDaysAllowed} ${texts.days}`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Start date & auto-renew */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{texts.startDate}</Label>
          <div className="relative">
            <CalendarIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              {...form.register("startDate")}
              type="date"
              className="ps-9"
            />
          </div>
        </div>
        <div className="flex items-end gap-2 pb-2">
          <Checkbox
            id="autoRenew"
            checked={form.watch("autoRenew")}
            onCheckedChange={(checked) =>
              form.setValue("autoRenew", checked === true)
            }
          />
          <Label htmlFor="autoRenew" className="cursor-pointer font-normal">
            {texts.autoRenew}
          </Label>
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
