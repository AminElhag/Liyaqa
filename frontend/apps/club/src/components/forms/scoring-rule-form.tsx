"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import type { ScoringRule, ScoringTriggerType } from "@liyaqa/shared/types/lead-rules";
import {
  TRIGGER_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_ACTIVITY_LABELS,
} from "@liyaqa/shared/types/lead-rules";

const scoringRuleFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  triggerType: z.enum(["SOURCE", "ACTIVITY", "ENGAGEMENT", "ATTRIBUTE"]),
  triggerValue: z.string().nullable().optional(),
  scoreChange: z.number().min(-100).max(100),
  isActive: z.boolean().default(true),
});

export type ScoringRuleFormData = z.infer<typeof scoringRuleFormSchema>;

interface ScoringRuleFormProps {
  rule?: ScoringRule;
  onSubmit: (data: ScoringRuleFormData) => void;
  isPending?: boolean;
}

export function ScoringRuleForm({ rule, onSubmit, isPending }: ScoringRuleFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ScoringRuleFormData>({
    resolver: zodResolver(scoringRuleFormSchema),
    defaultValues: {
      name: rule?.name || "",
      triggerType: rule?.triggerType || "SOURCE",
      triggerValue: rule?.triggerValue || null,
      scoreChange: rule?.scoreChange || 10,
      isActive: rule?.isActive ?? true,
    },
  });

  const triggerType = watch("triggerType");

  const getTriggerValueOptions = (type: ScoringTriggerType) => {
    switch (type) {
      case "SOURCE":
        return Object.entries(LEAD_SOURCE_LABELS).map(([value, labels]) => ({
          value,
          label: isArabic ? labels.ar : labels.en,
        }));
      case "ACTIVITY":
        return Object.entries(LEAD_ACTIVITY_LABELS).map(([value, labels]) => ({
          value,
          label: isArabic ? labels.ar : labels.en,
        }));
      case "ENGAGEMENT":
        return [
          { value: "EMAIL_OPENED", label: isArabic ? "تم فتح البريد" : "Email Opened" },
          { value: "LINK_CLICKED", label: isArabic ? "تم النقر على الرابط" : "Link Clicked" },
          { value: "FORM_SUBMITTED", label: isArabic ? "تم إرسال النموذج" : "Form Submitted" },
        ];
      case "ATTRIBUTE":
        return [
          { value: "HAS_EMAIL", label: isArabic ? "لديه بريد إلكتروني" : "Has Email" },
          { value: "HAS_PHONE", label: isArabic ? "لديه رقم هاتف" : "Has Phone" },
          { value: "PROFILE_COMPLETE", label: isArabic ? "ملف مكتمل" : "Profile Complete" },
        ];
      default:
        return [];
    }
  };

  const triggerValueOptions = getTriggerValueOptions(triggerType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "معلومات القاعدة" : "Rule Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {isArabic ? "الاسم" : "Name"}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder={isArabic ? "مثال: نقاط الإحالة" : "e.g., Referral Bonus"}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="triggerType">
                {isArabic ? "نوع المحفز" : "Trigger Type"}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="triggerType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!rule}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRIGGER_TYPE_LABELS) as ScoringTriggerType[]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {isArabic
                              ? TRIGGER_TYPE_LABELS[type].ar
                              : TRIGGER_TYPE_LABELS[type].en}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {!!rule && (
                <p className="text-xs text-muted-foreground">
                  {isArabic
                    ? "لا يمكن تغيير نوع المحفز بعد الإنشاء"
                    : "Trigger type cannot be changed after creation"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggerValue">
                {isArabic ? "قيمة المحفز" : "Trigger Value"}
              </Label>
              <Controller
                name="triggerValue"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={isArabic ? "اختر قيمة" : "Select value"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerValueOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "اترك فارغاً للتطبيق على جميع القيم"
                  : "Leave empty to apply to all values"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scoreChange">
                {isArabic ? "تغيير النقاط" : "Score Change"}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scoreChange"
                type="number"
                {...register("scoreChange", { valueAsNumber: true })}
                min={-100}
                max={100}
              />
              {errors.scoreChange && (
                <p className="text-sm text-destructive">
                  {errors.scoreChange.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {isArabic
                  ? "استخدم قيم سالبة لخصم النقاط"
                  : "Use negative values to subtract points"}
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="isActive">
                {isArabic ? "مفعل" : "Active"}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isArabic
              ? "جارٍ الحفظ..."
              : "Saving..."
            : rule
            ? isArabic
              ? "تحديث"
              : "Update"
            : isArabic
            ? "إنشاء"
            : "Create"}
        </Button>
      </div>
    </form>
  );
}
