"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReferralConfig, UpdateReferralConfigRequest, RewardType } from "@/types/referral";
import { REWARD_TYPE_LABELS } from "@/types/referral";

const referralConfigSchema = z.object({
  isEnabled: z.boolean(),
  codePrefix: z.string().min(1).max(10).default("REF"),
  referrerRewardType: z.enum(["WALLET_CREDIT", "FREE_DAYS", "DISCOUNT_PERCENT", "DISCOUNT_AMOUNT"]),
  referrerRewardAmount: z.number().positive().optional().nullable(),
  referrerRewardCurrency: z.string().length(3).default("SAR"),
  referrerFreeDays: z.number().int().positive().optional().nullable(),
  minSubscriptionDays: z.number().int().positive().default(30),
  maxReferralsPerMember: z.number().int().positive().optional().nullable(),
});

export type ReferralConfigFormData = z.infer<typeof referralConfigSchema>;

interface ReferralConfigFormProps {
  config?: ReferralConfig;
  onSubmit: (data: UpdateReferralConfigRequest) => void;
  isPending?: boolean;
}

export function ReferralConfigForm({ config, onSubmit, isPending }: ReferralConfigFormProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ReferralConfigFormData>({
    resolver: zodResolver(referralConfigSchema),
    defaultValues: {
      isEnabled: config?.isEnabled ?? false,
      codePrefix: config?.codePrefix || "REF",
      referrerRewardType: config?.referrerRewardType || "WALLET_CREDIT",
      referrerRewardAmount: config?.referrerRewardAmount || undefined,
      referrerRewardCurrency: config?.referrerRewardCurrency || "SAR",
      referrerFreeDays: config?.referrerFreeDays || undefined,
      minSubscriptionDays: config?.minSubscriptionDays || 30,
      maxReferralsPerMember: config?.maxReferralsPerMember || undefined,
    },
  });

  const rewardType = watch("referrerRewardType");

  const handleFormSubmit = (data: ReferralConfigFormData) => {
    onSubmit({
      isEnabled: data.isEnabled,
      codePrefix: data.codePrefix,
      referrerRewardType: data.referrerRewardType,
      referrerRewardAmount: data.referrerRewardAmount || undefined,
      referrerRewardCurrency: data.referrerRewardCurrency,
      referrerFreeDays: data.referrerFreeDays || undefined,
      minSubscriptionDays: data.minSubscriptionDays,
      maxReferralsPerMember: data.maxReferralsPerMember || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Program Status */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "حالة البرنامج" : "Program Status"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "تفعيل أو تعطيل برنامج الإحالة"
              : "Enable or disable the referral program"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="isEnabled">
              {isArabic ? "تفعيل برنامج الإحالة" : "Enable Referral Program"}
            </Label>
            <Controller
              name="isEnabled"
              control={control}
              render={({ field }) => (
                <Switch
                  id="isEnabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Code Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "إعدادات الكود" : "Code Settings"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codePrefix">
              {isArabic ? "بادئة الكود" : "Code Prefix"}
            </Label>
            <Input
              id="codePrefix"
              {...register("codePrefix")}
              placeholder="REF"
              maxLength={10}
            />
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? "البادئة المستخدمة في أكواد الإحالة (مثال: REF-ABC123)"
                : "Prefix used in referral codes (e.g., REF-ABC123)"}
            </p>
            {errors.codePrefix && (
              <p className="text-sm text-destructive">{errors.codePrefix.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reward Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "إعدادات المكافأة" : "Reward Settings"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "تحديد المكافأة التي يحصل عليها العضو عند إحالة ناجحة"
              : "Configure the reward for successful referrals"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referrerRewardType">
              {isArabic ? "نوع المكافأة" : "Reward Type"}
              <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="referrerRewardType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={isArabic ? "اختر نوع المكافأة" : "Select reward type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REWARD_TYPE_LABELS) as RewardType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {isArabic ? REWARD_TYPE_LABELS[type].ar : REWARD_TYPE_LABELS[type].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {(rewardType === "WALLET_CREDIT" || rewardType === "DISCOUNT_AMOUNT") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="referrerRewardAmount">
                  {isArabic ? "مبلغ المكافأة" : "Reward Amount"}
                </Label>
                <Input
                  id="referrerRewardAmount"
                  type="number"
                  step="0.01"
                  {...register("referrerRewardAmount", { valueAsNumber: true })}
                  placeholder="50.00"
                />
                {errors.referrerRewardAmount && (
                  <p className="text-sm text-destructive">{errors.referrerRewardAmount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrerRewardCurrency">
                  {isArabic ? "العملة" : "Currency"}
                </Label>
                <Controller
                  name="referrerRewardCurrency"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">SAR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          {rewardType === "DISCOUNT_PERCENT" && (
            <div className="space-y-2">
              <Label htmlFor="referrerRewardAmount">
                {isArabic ? "نسبة الخصم (%)" : "Discount Percentage (%)"}
              </Label>
              <Input
                id="referrerRewardAmount"
                type="number"
                step="1"
                min="1"
                max="100"
                {...register("referrerRewardAmount", { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.referrerRewardAmount && (
                <p className="text-sm text-destructive">{errors.referrerRewardAmount.message}</p>
              )}
            </div>
          )}

          {rewardType === "FREE_DAYS" && (
            <div className="space-y-2">
              <Label htmlFor="referrerFreeDays">
                {isArabic ? "عدد الأيام المجانية" : "Number of Free Days"}
              </Label>
              <Input
                id="referrerFreeDays"
                type="number"
                step="1"
                min="1"
                {...register("referrerFreeDays", { valueAsNumber: true })}
                placeholder="7"
              />
              {errors.referrerFreeDays && (
                <p className="text-sm text-destructive">{errors.referrerFreeDays.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "الحدود" : "Limits"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minSubscriptionDays">
              {isArabic ? "الحد الأدنى لأيام الاشتراك" : "Minimum Subscription Days"}
            </Label>
            <Input
              id="minSubscriptionDays"
              type="number"
              step="1"
              min="1"
              {...register("minSubscriptionDays", { valueAsNumber: true })}
              placeholder="30"
            />
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? "الحد الأدنى لمدة الاشتراك المطلوبة للتحويل"
                : "Minimum subscription duration required for conversion"}
            </p>
            {errors.minSubscriptionDays && (
              <p className="text-sm text-destructive">{errors.minSubscriptionDays.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxReferralsPerMember">
              {isArabic ? "الحد الأقصى للإحالات لكل عضو" : "Max Referrals Per Member"}
            </Label>
            <Input
              id="maxReferralsPerMember"
              type="number"
              step="1"
              min="1"
              {...register("maxReferralsPerMember", { valueAsNumber: true })}
              placeholder={isArabic ? "بدون حد" : "Unlimited"}
            />
            <p className="text-sm text-muted-foreground">
              {isArabic
                ? "اتركه فارغاً للسماح بإحالات غير محدودة"
                : "Leave empty for unlimited referrals"}
            </p>
            {errors.maxReferralsPerMember && (
              <p className="text-sm text-destructive">{errors.maxReferralsPerMember.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isArabic
              ? "جاري الحفظ..."
              : "Saving..."
            : isArabic
            ? "حفظ الإعدادات"
            : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
