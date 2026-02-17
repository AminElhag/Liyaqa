"use client";

import { useLocale } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { Check, FileEdit, Zap } from "lucide-react";
import type { PlanWizardFormData } from "../plan-schemas";
import { calculateGross } from "../plan-schemas";
import type { MembershipPlanType } from "@liyaqa/shared/types/member";

interface ReviewStepProps {
  form: UseFormReturn<PlanWizardFormData>;
  planType: MembershipPlanType;
  isEditMode?: boolean;
}

const PLAN_TYPE_LABELS: Record<MembershipPlanType, { en: string; ar: string }> = {
  RECURRING: { en: "Recurring", ar: "متكرر" },
  CLASS_PACK: { en: "Class Pack", ar: "باقة حصص" },
  DAY_PASS: { en: "Day Pass", ar: "تذكرة يومية" },
  TRIAL: { en: "Trial", ar: "تجربة" },
};

const BILLING_LABELS: Record<string, { en: string; ar: string }> = {
  DAILY: { en: "Daily", ar: "يومي" },
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  BIWEEKLY: { en: "Bi-weekly", ar: "كل أسبوعين" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
  QUARTERLY: { en: "Quarterly", ar: "ربع سنوي" },
  YEARLY: { en: "Yearly", ar: "سنوي" },
  ONE_TIME: { en: "One-time", ar: "مرة واحدة" },
};

export function ReviewStep({ form, planType, isEditMode }: ReviewStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { watch, setValue, register } = form;
  const values = watch();

  const membershipGross = calculateGross(values.membershipFee.amount, values.membershipFee.taxRate);
  const adminGross = calculateGross(values.administrationFee.amount, values.administrationFee.taxRate);
  const joinGross = calculateGross(values.joinFee.amount, values.joinFee.taxRate);
  const monthlyTotal = membershipGross + adminGross;

  const features: string[] = [];
  if (values.hasPoolAccess) features.push(isAr ? "مسبح" : "Pool");
  if (values.hasSaunaAccess) features.push(isAr ? "ساونا" : "Sauna");
  if (values.hasLockerAccess) features.push(isAr ? "خزانة" : "Locker");
  if (values.hasGuestPasses && values.guestPassesCount > 0) {
    features.push(isAr ? `${values.guestPassesCount} تذكرة ضيف` : `${values.guestPassesCount} Guest Passes`);
  }
  if (!values.maxClassesPerPeriod) {
    features.push(isAr ? "حصص غير محدودة" : "Unlimited Classes");
  } else {
    features.push(isAr ? `${values.maxClassesPerPeriod} حصة` : `${values.maxClassesPerPeriod} Classes`);
  }
  if (values.freezeDaysAllowed > 0) {
    features.push(isAr ? `${values.freezeDaysAllowed} يوم تجميد` : `${values.freezeDaysAllowed} Freeze Days`);
  }
  // PT access
  if (values.ptAccessLevel === "UNLIMITED") {
    features.push(isAr ? "تدريب شخصي غير محدود" : "Unlimited PT");
  } else if (values.ptAccessLevel === "LIMITED" && values.maxPtSessionsPerPeriod) {
    features.push(isAr ? `${values.maxPtSessionsPerPeriod} جلسة تدريب شخصي` : `${values.maxPtSessionsPerPeriod} PT Sessions`);
  }
  if (values.ptSessionsIncluded && values.ptSessionsIncluded > 0) {
    features.push(isAr ? `${values.ptSessionsIncluded} جلسة مشمولة` : `${values.ptSessionsIncluded} PT Included`);
  }

  const typeLabel = PLAN_TYPE_LABELS[planType];
  const billingLabel = BILLING_LABELS[values.billingPeriod] || { en: values.billingPeriod, ar: values.billingPeriod };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {values.nameEn}
              {values.nameAr && (
                <span className="text-muted-foreground ms-2">({values.nameAr})</span>
              )}
            </h3>
            {values.descriptionEn && (
              <p className="text-sm text-muted-foreground mt-1">{values.descriptionEn}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
          <Badge variant="outline">{isAr ? billingLabel.ar : billingLabel.en}</Badge>
        </div>

        <Separator />

        {/* Pricing */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {isAr ? "التسعير" : "PRICING"}
          </h4>
          {planType === "RECURRING" ? (
            <div className="space-y-1 text-sm">
              <p>
                {isAr ? "شهري:" : "Monthly:"}{" "}
                <span className="font-semibold">
                  {monthlyTotal.toFixed(2)} SAR
                </span>
                {adminGross > 0 && (
                  <span className="text-muted-foreground">
                    {" "}({isAr ? "عضوية" : "membership"} {membershipGross.toFixed(2)} + {isAr ? "إداري" : "admin"} {adminGross.toFixed(2)})
                  </span>
                )}
              </p>
              {joinGross > 0 && (
                <p>
                  {isAr ? "رسوم انضمام:" : "Join Fee:"}{" "}
                  <span className="font-semibold">{joinGross.toFixed(2)} SAR</span>
                  <span className="text-muted-foreground"> ({isAr ? "مرة واحدة" : "one-time"})</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm">
              {isAr ? "السعر:" : "Price:"}{" "}
              <span className="font-semibold">{membershipGross.toFixed(2)} SAR</span>
            </p>
          )}
        </div>

        <Separator />

        {/* Features */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            {isAr ? "المميزات" : "FEATURES"}
          </h4>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 text-sm">
                <Check className="h-3.5 w-3.5 text-green-600" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Contract (only for RECURRING / TRIAL) */}
        {(planType === "RECURRING" || planType === "TRIAL") && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                {isAr ? "العقد" : "CONTRACT"}
              </h4>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>
                  {values.contractType === "FIXED_TERM"
                    ? (isAr ? "مدة ثابتة" : "Fixed-Term")
                    : (isAr ? "شهري بشهري" : "Month-to-Month")}
                </span>
                <span>{values.defaultNoticePeriodDays} {isAr ? "يوم إشعار" : "-day notice"}</span>
                <span>{values.coolingOffDays} {isAr ? "يوم تراجع" : "-day cooling-off"}</span>
              </div>
            </div>
          </>
        )}

        {/* Class pack specific */}
        {planType === "CLASS_PACK" && values.sessionCount && (
          <>
            <Separator />
            <div className="text-sm">
              <span className="font-semibold">{values.sessionCount}</span>{" "}
              {isAr ? "حصة" : "sessions"}
              {values.expiryDays && (
                <span className="text-muted-foreground">
                  {" "}&middot; {isAr ? `صالح لمدة ${values.expiryDays} يوم` : `valid for ${values.expiryDays} days`}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label>{isAr ? "ترتيب العرض" : "Display Order"}</Label>
        <Input
          type="number"
          min="0"
          className="w-24"
          {...register("sortOrder")}
        />
      </div>

      {/* Save Options */}
      {!isEditMode && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            {isAr ? "خيارات الحفظ" : "Save Options"}
          </h3>
          <RadioGroup
            value={watch("saveAs")}
            onValueChange={(v) => setValue("saveAs", v as "draft" | "active")}
            className="space-y-3"
          >
            <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="draft" id="save-draft" className="mt-0.5" />
              <Label htmlFor="save-draft" className="font-normal cursor-pointer">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{isAr ? "حفظ كمسودة" : "Save as Draft"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? "تعديل لاحقاً قبل التفعيل" : "Edit later before activating"}
                </p>
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="active" id="save-active" className="mt-0.5" />
              <Label htmlFor="save-active" className="font-normal cursor-pointer">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium">{isAr ? "حفظ وتفعيل" : "Save & Activate"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? "متاح للتسجيل فوراً" : "Available for enrollment now"}
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
