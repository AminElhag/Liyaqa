"use client";

import { useLocale } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@liyaqa/shared/components/ui/radio-group";
import { Checkbox } from "@liyaqa/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Separator } from "@liyaqa/shared/components/ui/separator";
import type { PlanWizardFormData } from "../plan-schemas";

interface EligibilityContractStepProps {
  form: UseFormReturn<PlanWizardFormData>;
}

const TERMINATION_FEE_TYPES = [
  { value: "NONE", en: "None", ar: "لا شيء" },
  { value: "FLAT_FEE", en: "Flat Fee", ar: "رسوم ثابتة" },
  { value: "REMAINING_MONTHS", en: "Remaining Months", ar: "الأشهر المتبقية" },
  { value: "PERCENTAGE", en: "Percentage", ar: "نسبة مئوية" },
];

const CONTRACT_TERMS = [
  { value: "MONTHLY", en: "Monthly", ar: "شهري" },
  { value: "QUARTERLY", en: "Quarterly", ar: "ربع سنوي" },
  { value: "SEMI_ANNUAL", en: "Semi-Annual", ar: "نصف سنوي" },
  { value: "ANNUAL", en: "Annual", ar: "سنوي" },
];

export function EligibilityContractStep({ form }: EligibilityContractStepProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { register, watch, setValue } = form;

  const contractType = watch("contractType");
  const supportedTerms = watch("supportedTerms") || [];
  const terminationFeeType = watch("earlyTerminationFeeType");
  const isFixedTerm = contractType === "FIXED_TERM";

  const handleTermToggle = (term: string, checked: boolean) => {
    const current = supportedTerms;
    if (checked) {
      setValue("supportedTerms", [...current, term]);
    } else {
      setValue("supportedTerms", current.filter((t) => t !== term));
    }
  };

  return (
    <div className="space-y-8">
      {/* Section A: Eligibility */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "الأهلية (اختياري)" : "Eligibility (optional)"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{isAr ? "متاح من" : "Available From"}</Label>
            <Input type="date" {...register("availableFrom")} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "متاح حتى" : "Available Until"}</Label>
            <Input type="date" {...register("availableUntil")} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "الحد الأدنى للعمر" : "Min Age"}</Label>
            <Input type="number" min="0" max="100" {...register("minimumAge")} />
          </div>
          <div className="space-y-2">
            <Label>{isAr ? "الحد الأقصى للعمر" : "Max Age"}</Label>
            <Input type="number" min="0" max="100" {...register("maximumAge")} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section B: Contract Terms */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">
          {isAr ? "شروط العقد" : "Contract Terms"}
        </h3>

        {/* Contract Type */}
        <div className="space-y-3">
          <Label>{isAr ? "نوع العقد" : "Contract Type"}</Label>
          <RadioGroup
            value={contractType}
            onValueChange={(v) => setValue("contractType", v as "MONTH_TO_MONTH" | "FIXED_TERM")}
            className="flex gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="MONTH_TO_MONTH" id="m2m" />
              <Label htmlFor="m2m" className="font-normal cursor-pointer">
                {isAr ? "شهري بشهري" : "Month-to-Month"}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="FIXED_TERM" id="fixed" />
              <Label htmlFor="fixed" className="font-normal cursor-pointer">
                {isAr ? "مدة ثابتة" : "Fixed-Term"}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Supported Terms */}
        <div className="space-y-3">
          <Label>{isAr ? "المدد المدعومة" : "Supported Terms"}</Label>
          <div className="flex flex-wrap gap-3">
            {CONTRACT_TERMS.map((term) => (
              <label key={term.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={supportedTerms.includes(term.value)}
                  onCheckedChange={(checked) =>
                    handleTermToggle(term.value, checked === true)
                  }
                />
                <span className="text-sm">{isAr ? term.ar : term.en}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Default Commitment */}
          <div className="space-y-2">
            <Label>{isAr ? "الالتزام الافتراضي (أشهر)" : "Default Commitment (months)"}</Label>
            <Input
              type="number"
              min="1"
              max="60"
              {...register("defaultCommitmentMonths")}
            />
          </div>

          {/* Minimum Commitment - only for Fixed-Term */}
          {isFixedTerm && (
            <div className="space-y-2">
              <Label>{isAr ? "الحد الأدنى للالتزام (أشهر)" : "Minimum Commitment (months)"}</Label>
              <Input
                type="number"
                min="0"
                max="60"
                {...register("minimumCommitmentMonths")}
              />
            </div>
          )}

          {/* Notice Period */}
          <div className="space-y-2">
            <Label>{isAr ? "فترة الإشعار (أيام)" : "Notice Period (days)"}</Label>
            <Input
              type="number"
              min="0"
              max="90"
              {...register("defaultNoticePeriodDays")}
            />
          </div>

          {/* Cooling-Off Period */}
          <div className="space-y-2">
            <Label>{isAr ? "فترة التراجع (أيام)" : "Cooling-Off Period (days)"}</Label>
            <Input
              type="number"
              min="0"
              max="30"
              {...register("coolingOffDays")}
            />
            <p className="text-xs text-muted-foreground">
              {isAr ? "حماية المستهلك السعودي" : "Saudi consumer protection"}
            </p>
          </div>
        </div>

        {/* Early Termination Fee */}
        <div className="space-y-3">
          <Label>{isAr ? "رسوم الإنهاء المبكر" : "Early Termination Fee"}</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              value={terminationFeeType}
              onValueChange={(v) =>
                setValue("earlyTerminationFeeType", v as PlanWizardFormData["earlyTerminationFeeType"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMINATION_FEE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {isAr ? t.ar : t.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {terminationFeeType !== "NONE" && (
              <div className="space-y-1">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("earlyTerminationFeeValue")}
                  placeholder={terminationFeeType === "PERCENTAGE" ? "%" : "SAR"}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
