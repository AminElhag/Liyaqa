"use client";

import { useLocale } from "next-intl";
import { type UseFormReturn } from "react-hook-form";
import { Label } from "@liyaqa/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Card, CardContent } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { cn } from "@liyaqa/shared/utils";
import { FileText, CalendarRange } from "lucide-react";
import type { EnrollmentFormData } from "../enrollment-schemas";

interface ContractStepProps {
  form: UseFormReturn<EnrollmentFormData>;
}

const CONTRACT_TERMS = [
  { value: "MONTHLY", months: 1 },
  { value: "QUARTERLY", months: 3 },
  { value: "SEMI_ANNUAL", months: 6 },
  { value: "ANNUAL", months: 12 },
] as const;

export function ContractStep({ form }: ContractStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const contractType = form.watch("contractType");
  const contractTerm = form.watch("contractTerm");

  const texts = {
    contractType: isAr ? "نوع العقد" : "Contract Type",
    monthToMonth: isAr ? "شهري بدون التزام" : "Month-to-Month",
    monthToMonthDesc: isAr ? "بدون فترة التزام، يمكنك الإلغاء في أي وقت" : "No commitment period, cancel anytime",
    fixedTerm: isAr ? "عقد محدد المدة" : "Fixed Term",
    fixedTermDesc: isAr ? "فترة التزام مع سعر مخفض محتمل" : "Commitment period with potential discount",
    contractTerm: isAr ? "مدة العقد" : "Contract Term",
    monthly: isAr ? "شهري" : "Monthly",
    quarterly: isAr ? "ربع سنوي" : "Quarterly",
    semiAnnual: isAr ? "نصف سنوي" : "Semi-Annual",
    annual: isAr ? "سنوي" : "Annual",
    months: isAr ? "أشهر" : "months",
    month: isAr ? "شهر" : "month",
    coolingOff: isAr ? "فترة التراجع: 7 أيام" : "Cooling-off period: 7 days",
    notice: isAr ? "فترة الإشعار: 30 يوم" : "Notice period: 30 days",
    recommended: isAr ? "موصى به" : "Recommended",
  };

  const termLabels: Record<string, string> = {
    MONTHLY: texts.monthly,
    QUARTERLY: texts.quarterly,
    SEMI_ANNUAL: texts.semiAnnual,
    ANNUAL: texts.annual,
  };

  return (
    <div className="space-y-6">
      {/* Contract type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{texts.contractType}</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              form.setValue("contractType", "MONTH_TO_MONTH");
              form.setValue("contractTerm", "MONTHLY");
            }}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 p-4 text-start transition-all",
              contractType === "MONTH_TO_MONTH"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <CalendarRange className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{texts.monthToMonth}</p>
              <p className="mt-1 text-xs text-muted-foreground">{texts.monthToMonthDesc}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => form.setValue("contractType", "FIXED_TERM")}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 p-4 text-start transition-all",
              contractType === "FIXED_TERM"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40"
            )}
          >
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{texts.fixedTerm}</p>
              <p className="mt-1 text-xs text-muted-foreground">{texts.fixedTermDesc}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Contract term selection (only for fixed term) */}
      {contractType === "FIXED_TERM" && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">{texts.contractTerm}</Label>
          <RadioGroup
            value={contractTerm}
            onValueChange={(v) => form.setValue("contractTerm", v)}
            className="grid gap-2 sm:grid-cols-2"
          >
            {CONTRACT_TERMS.map((term) => (
              <label
                key={term.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                  contractTerm === term.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <RadioGroupItem value={term.value} />
                <div className="flex flex-1 items-center justify-between">
                  <span className="text-sm font-medium">{termLabels[term.value]}</span>
                  <span className="text-xs text-muted-foreground">
                    {term.months} {term.months === 1 ? texts.month : texts.months}
                  </span>
                </div>
                {term.value === "ANNUAL" && (
                  <Badge variant="secondary" className="text-xs">
                    {texts.recommended}
                  </Badge>
                )}
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Info cards */}
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col gap-2 p-4 text-sm text-muted-foreground">
          <p>{texts.coolingOff}</p>
          <p>{texts.notice}</p>
        </CardContent>
      </Card>
    </div>
  );
}
