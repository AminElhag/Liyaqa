"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Settings, Award, TrendingUp, Gift } from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Switch } from "@liyaqa/shared/components/ui/switch";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useLoyaltyConfig, useUpdateLoyaltyConfig } from "@liyaqa/shared/queries/use-loyalty";

const loyaltyConfigSchema = z.object({
  enabled: z.boolean(),
  pointsPerCheckin: z.coerce.number().min(0),
  pointsPerReferral: z.coerce.number().min(0),
  pointsPerSarSpent: z.coerce.number().min(0),
  redemptionRateSar: z.coerce.number().positive(),
  bronzeThreshold: z.coerce.number().min(0),
  silverThreshold: z.coerce.number().min(0),
  goldThreshold: z.coerce.number().min(0),
  platinumThreshold: z.coerce.number().min(0),
  pointsExpiryMonths: z.coerce.number().min(1),
});

type LoyaltyConfigFormData = z.infer<typeof loyaltyConfigSchema>;

export default function LoyaltySettingsPage() {
  const locale = useLocale();
  const { data: config, isLoading } = useLoyaltyConfig();
  const updateConfigMutation = useUpdateLoyaltyConfig();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LoyaltyConfigFormData>({
    resolver: zodResolver(loyaltyConfigSchema),
    defaultValues: {
      enabled: true,
      pointsPerCheckin: 10,
      pointsPerReferral: 100,
      pointsPerSarSpent: 1,
      redemptionRateSar: 0.01,
      bronzeThreshold: 0,
      silverThreshold: 500,
      goldThreshold: 2000,
      platinumThreshold: 5000,
      pointsExpiryMonths: 12,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        enabled: config.enabled,
        pointsPerCheckin: config.pointsPerCheckin,
        pointsPerReferral: config.pointsPerReferral,
        pointsPerSarSpent: config.pointsPerSarSpent,
        redemptionRateSar: config.redemptionRateSar,
        bronzeThreshold: config.bronzeThreshold,
        silverThreshold: config.silverThreshold,
        goldThreshold: config.goldThreshold,
        platinumThreshold: config.platinumThreshold,
        pointsExpiryMonths: config.pointsExpiryMonths,
      });
    }
  }, [config, reset]);

  const onSubmit = (data: LoyaltyConfigFormData) => {
    updateConfigMutation.mutate(data, {
      onSuccess: () => {
        toast.success(
          locale === "ar"
            ? "تم تحديث إعدادات الولاء بنجاح"
            : "Loyalty settings updated successfully"
        );
      },
      onError: () => {
        toast.error(
          locale === "ar"
            ? "فشل في تحديث إعدادات الولاء"
            : "Failed to update loyalty settings"
        );
      },
    });
  };

  const enabled = watch("enabled");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "إعدادات برنامج الولاء" : "Loyalty Program Settings"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة كيفية كسب الأعضاء واستبدال النقاط"
              : "Manage how members earn and redeem points"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Enable/Disable Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {locale === "ar" ? "الحالة العامة" : "General Status"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">
                  {locale === "ar" ? "تمكين برنامج الولاء" : "Enable Loyalty Program"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {locale === "ar"
                    ? "عند التعطيل، لن يتمكن الأعضاء من كسب أو استبدال النقاط"
                    : "When disabled, members cannot earn or redeem points"}
                </p>
              </div>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={(checked) => setValue("enabled", checked, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Points Earning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {locale === "ar" ? "كسب النقاط" : "Points Earning"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "حدد كيفية كسب الأعضاء للنقاط"
                : "Define how members earn points"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pointsPerCheckin">
                {locale === "ar" ? "نقاط لكل تسجيل حضور" : "Points per Check-in"}
              </Label>
              <Input
                id="pointsPerCheckin"
                type="number"
                min={0}
                {...register("pointsPerCheckin")}
                disabled={!enabled}
              />
              {errors.pointsPerCheckin && (
                <p className="text-sm text-destructive">
                  {errors.pointsPerCheckin.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsPerReferral">
                {locale === "ar" ? "نقاط لكل إحالة" : "Points per Referral"}
              </Label>
              <Input
                id="pointsPerReferral"
                type="number"
                min={0}
                {...register("pointsPerReferral")}
                disabled={!enabled}
              />
              {errors.pointsPerReferral && (
                <p className="text-sm text-destructive">
                  {errors.pointsPerReferral.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsPerSarSpent">
                {locale === "ar" ? "نقاط لكل ريال" : "Points per SAR Spent"}
              </Label>
              <Input
                id="pointsPerSarSpent"
                type="number"
                min={0}
                {...register("pointsPerSarSpent")}
                disabled={!enabled}
              />
              {errors.pointsPerSarSpent && (
                <p className="text-sm text-destructive">
                  {errors.pointsPerSarSpent.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Points Redemption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              {locale === "ar" ? "استبدال النقاط" : "Points Redemption"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "حدد قيمة النقاط وانتهاء صلاحيتها"
                : "Define point value and expiration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="redemptionRateSar">
                {locale === "ar" ? "قيمة النقطة بالريال" : "Point Value (SAR)"}
              </Label>
              <Input
                id="redemptionRateSar"
                type="number"
                step="0.01"
                min={0.001}
                {...register("redemptionRateSar")}
                disabled={!enabled}
              />
              <p className="text-xs text-muted-foreground">
                {locale === "ar"
                  ? "100 نقطة = " + (100 * (watch("redemptionRateSar") || 0.01)).toFixed(2) + " ريال"
                  : "100 points = SAR " + (100 * (watch("redemptionRateSar") || 0.01)).toFixed(2)}
              </p>
              {errors.redemptionRateSar && (
                <p className="text-sm text-destructive">
                  {errors.redemptionRateSar.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsExpiryMonths">
                {locale === "ar" ? "انتهاء صلاحية النقاط (أشهر)" : "Points Expiry (Months)"}
              </Label>
              <Input
                id="pointsExpiryMonths"
                type="number"
                min={1}
                {...register("pointsExpiryMonths")}
                disabled={!enabled}
              />
              {errors.pointsExpiryMonths && (
                <p className="text-sm text-destructive">
                  {errors.pointsExpiryMonths.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tier Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {locale === "ar" ? "حدود المستويات" : "Tier Thresholds"}
            </CardTitle>
            <CardDescription>
              {locale === "ar"
                ? "حدد النقاط المطلوبة لكل مستوى (بناءً على إجمالي النقاط المكتسبة)"
                : "Define points required for each tier (based on lifetime earned)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="bronzeThreshold" className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-700" />
                {locale === "ar" ? "برونزي" : "Bronze"}
              </Label>
              <Input
                id="bronzeThreshold"
                type="number"
                min={0}
                {...register("bronzeThreshold")}
                disabled={!enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="silverThreshold" className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gray-400" />
                {locale === "ar" ? "فضي" : "Silver"}
              </Label>
              <Input
                id="silverThreshold"
                type="number"
                min={0}
                {...register("silverThreshold")}
                disabled={!enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goldThreshold" className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                {locale === "ar" ? "ذهبي" : "Gold"}
              </Label>
              <Input
                id="goldThreshold"
                type="number"
                min={0}
                {...register("goldThreshold")}
                disabled={!enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platinumThreshold" className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                {locale === "ar" ? "بلاتيني" : "Platinum"}
              </Label>
              <Input
                id="platinumThreshold"
                type="number"
                min={0}
                {...register("platinumThreshold")}
                disabled={!enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending
              ? locale === "ar"
                ? "جارٍ الحفظ..."
                : "Saving..."
              : locale === "ar"
              ? "حفظ التغييرات"
              : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
