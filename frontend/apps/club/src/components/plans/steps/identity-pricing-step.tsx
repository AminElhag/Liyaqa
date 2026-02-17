"use client";

import { useLocale } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import { useActivePlans } from "@liyaqa/shared/queries/use-plans";
import { getLocalizedText } from "@liyaqa/shared/utils";
import type { PlanWizardFormData } from "../plan-schemas";
import { calculateGross } from "../plan-schemas";
import type { MembershipPlanType } from "@liyaqa/shared/types/member";

interface IdentityPricingStepProps {
  form: UseFormReturn<PlanWizardFormData>;
  planType: MembershipPlanType;
}

const BILLING_PERIODS = [
  { value: "DAILY", en: "Daily", ar: "يومي" },
  { value: "WEEKLY", en: "Weekly", ar: "أسبوعي" },
  { value: "BIWEEKLY", en: "Bi-weekly", ar: "كل أسبوعين" },
  { value: "MONTHLY", en: "Monthly", ar: "شهري" },
  { value: "QUARTERLY", en: "Quarterly", ar: "ربع سنوي" },
  { value: "YEARLY", en: "Yearly", ar: "سنوي" },
  { value: "ONE_TIME", en: "One-time", ar: "مرة واحدة" },
];

export function IdentityPricingStep({ form, planType }: IdentityPricingStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { register, watch, setValue } = form;

  const membershipFee = watch("membershipFee");
  const adminFee = watch("administrationFee");
  const joinFee = watch("joinFee");

  const membershipGross = calculateGross(membershipFee.amount, membershipFee.taxRate);
  const adminGross = calculateGross(adminFee.amount, adminFee.taxRate);
  const joinGross = calculateGross(joinFee.amount, joinFee.taxRate);
  const monthlyTotal = membershipGross + adminGross;
  const firstPayment = monthlyTotal + joinGross;

  // For trial plans, load active plans for conversion selection
  const { data: activePlans } = useActivePlans({ enabled: planType === "TRIAL" });

  const isClassPack = planType === "CLASS_PACK";
  const isDayPass = planType === "DAY_PASS";
  const isTrial = planType === "TRIAL";
  const isRecurring = planType === "RECURRING";

  return (
    <div className="space-y-8">
      {/* Section A: Plan Identity */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "هوية الباقة" : "Plan Identity"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nameEn">{isAr ? "الاسم (إنجليزي)" : "Name (EN)"} *</Label>
            <Input
              id="nameEn"
              {...register("nameEn")}
              placeholder={isAr ? "مثال: العضوية الذهبية" : "e.g. Gold Membership"}
            />
            {form.formState.errors.nameEn && (
              <p className="text-xs text-destructive">{form.formState.errors.nameEn.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nameAr">{isAr ? "الاسم (عربي)" : "Name (AR)"}</Label>
            <Input
              id="nameAr"
              {...register("nameAr")}
              dir="rtl"
              placeholder="مثال: عضوية ذهبية"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionEn">{isAr ? "الوصف (إنجليزي)" : "Description (EN)"}</Label>
            <Textarea
              id="descriptionEn"
              {...register("descriptionEn")}
              rows={2}
              placeholder={isAr ? "وصف مختصر للباقة" : "Brief plan description"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionAr">{isAr ? "الوصف (عربي)" : "Description (AR)"}</Label>
            <Textarea
              id="descriptionAr"
              {...register("descriptionAr")}
              dir="rtl"
              rows={2}
              placeholder="وصف مختصر للباقة"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section B: Pricing */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "التسعير" : "Pricing"}
        </h3>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          {/* Membership Fee */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {isAr
                ? isClassPack ? "سعر الباقة" : isDayPass ? "سعر التذكرة" : "رسوم العضوية (متكررة)"
                : isClassPack ? "Pack Price" : isDayPass ? "Pass Price" : "Membership Fee (recurring)"}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "المبلغ" : "Amount"}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("membershipFee.amount")}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{isAr ? "الضريبة %" : "Tax %"}</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register("membershipFee.taxRate")}
                />
              </div>
              <div className="flex items-end pb-0.5">
                <p className="text-sm text-muted-foreground">
                  {isAr ? "الإجمالي:" : "Gross:"}{" "}
                  <span className="font-semibold text-foreground">
                    {membershipGross.toFixed(2)} SAR
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Admin Fee - only for recurring */}
          {(isRecurring || isTrial) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {isAr ? "رسوم إدارية (متكررة، اختياري)" : "Administration Fee (recurring, optional)"}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "المبلغ" : "Amount"}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("administrationFee.amount")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الضريبة %" : "Tax %"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register("administrationFee.taxRate")}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "الإجمالي:" : "Gross:"}{" "}
                    <span className="font-semibold text-foreground">
                      {adminGross.toFixed(2)} SAR
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Join Fee - only for recurring */}
          {isRecurring && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {isAr ? "رسوم انضمام (مرة واحدة)" : "Join Fee (one-time, first subscription only)"}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "المبلغ" : "Amount"}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("joinFee.amount")}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? "الضريبة %" : "Tax %"}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    {...register("joinFee.taxRate")}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? "الإجمالي:" : "Gross:"}{" "}
                    <span className="font-semibold text-foreground">
                      {joinGross.toFixed(2)} SAR
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Totals - for recurring */}
          {isRecurring && (
            <>
              <Separator />
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {isAr ? "الإجمالي الشهري:" : "Monthly total:"}
                  </span>
                  <span className="font-bold text-foreground">
                    {monthlyTotal.toFixed(2)} SAR {isAr ? "(شامل الضريبة)" : "(incl. VAT)"}
                  </span>
                </div>
                {joinFee.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {isAr ? "الدفعة الأولى:" : "First payment:"}
                    </span>
                    <span className="font-bold text-primary">
                      {firstPayment.toFixed(2)} SAR {isAr ? "(شامل رسوم الانضمام)" : "(incl. join fee)"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Section C: Billing & Type-specific */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "الفوترة" : "Billing"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Billing Period - not for day pass */}
          {!isDayPass && (
            <div className="space-y-2">
              <Label>{isAr ? "فترة الفوترة" : "Billing Period"}</Label>
              <Select
                value={watch("billingPeriod")}
                onValueChange={(v) => setValue("billingPeriod", v as PlanWizardFormData["billingPeriod"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_PERIODS.map((bp) => (
                    <SelectItem key={bp.value} value={bp.value}>
                      {isAr ? bp.ar : bp.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration Days - for recurring and trial */}
          {(isRecurring || isTrial) && (
            <div className="space-y-2">
              <Label>{isAr ? "المدة (أيام)" : "Duration (days)"}</Label>
              <Input
                type="number"
                min="1"
                {...register("durationDays")}
                placeholder={isAr ? "تلقائي من فترة الفوترة" : "Auto from billing period"}
              />
            </div>
          )}

          {/* Session Count - for class pack */}
          {isClassPack && (
            <div className="space-y-2">
              <Label>{isAr ? "عدد الحصص" : "Session Count"} *</Label>
              <Input
                type="number"
                min="1"
                {...register("sessionCount")}
                placeholder={isAr ? "مثال: 10" : "e.g. 10"}
              />
            </div>
          )}

          {/* Expiry Days - for class pack */}
          {isClassPack && (
            <div className="space-y-2">
              <Label>{isAr ? "صلاحية (أيام)" : "Expiry (days)"}</Label>
              <Input
                type="number"
                min="1"
                {...register("expiryDays")}
                placeholder={isAr ? "مثال: 90" : "e.g. 90"}
              />
            </div>
          )}

          {/* Converts To Plan - for trial */}
          {isTrial && activePlans && (
            <div className="space-y-2">
              <Label>{isAr ? "يتحول إلى باقة" : "Converts To Plan"}</Label>
              <Select
                value={watch("convertsToPlanId") || ""}
                onValueChange={(v) => setValue("convertsToPlanId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? "اختر باقة" : "Select a plan"} />
                </SelectTrigger>
                <SelectContent>
                  {activePlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {getLocalizedText(p.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
