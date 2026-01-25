"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferralConfigForm } from "@/components/admin/referral-config-form";
import { useReferralConfig, useUpdateReferralConfig } from "@/queries/use-referrals";
import type { UpdateReferralConfigRequest } from "@/types/referral";
import { toast } from "sonner";
import { Users, Gift, TrendingUp } from "lucide-react";

export default function ReferralConfigPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: config, isLoading } = useReferralConfig();
  const updateMutation = useUpdateReferralConfig();

  const handleSubmit = async (data: UpdateReferralConfigRequest) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success(
        isArabic ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully"
      );
    } catch {
      toast.error(isArabic ? "فشل في حفظ الإعدادات" : "Failed to save settings");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isArabic ? "برنامج الإحالة" : "Referral Program"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "إدارة إعدادات برنامج الإحالة والمكافآت"
            : "Manage referral program settings and rewards"}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {config?.totalReferrals || 0}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isArabic ? "إجمالي الإحالات" : "Total Referrals"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {config?.totalConversions || 0}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isArabic ? "التحويلات" : "Conversions"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Gift className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {config?.totalRewardsDistributed || 0}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isArabic ? "المكافآت الموزعة" : "Rewards Given"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <div className="max-w-3xl">
          <ReferralConfigForm
            config={config}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
