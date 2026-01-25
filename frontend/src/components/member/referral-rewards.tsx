"use client";

import { useLocale } from "next-intl";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Gift, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMyReferralRewards } from "@/queries/use-referrals";
import type { RewardStatus, RewardType } from "@/types/referral";

interface ReferralRewardsProps {
  memberId: string;
}

const STATUS_LABELS: Record<RewardStatus, { en: string; ar: string }> = {
  PENDING: { en: "Pending", ar: "معلق" },
  DISTRIBUTED: { en: "Distributed", ar: "موزع" },
  FAILED: { en: "Failed", ar: "فشل" },
  CANCELLED: { en: "Cancelled", ar: "ملغي" },
};

const STATUS_COLORS: Record<RewardStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  DISTRIBUTED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const REWARD_TYPE_LABELS: Record<RewardType, { en: string; ar: string }> = {
  WALLET_CREDIT: { en: "Wallet Credit", ar: "رصيد المحفظة" },
  FREE_DAYS: { en: "Free Days", ar: "أيام مجانية" },
  DISCOUNT_PERCENT: { en: "Discount %", ar: "خصم %" },
  DISCOUNT_AMOUNT: { en: "Discount", ar: "خصم" },
};

export function ReferralRewards({ memberId }: ReferralRewardsProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const { data, isLoading } = useMyReferralRewards(memberId, { size: 20 });

  const formatRewardValue = (type: RewardType, value: number) => {
    switch (type) {
      case "WALLET_CREDIT":
      case "DISCOUNT_AMOUNT":
        return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-SA", {
          style: "currency",
          currency: "SAR",
        }).format(value);
      case "FREE_DAYS":
        return `${value} ${isArabic ? "يوم" : "days"}`;
      case "DISCOUNT_PERCENT":
        return `${value}%`;
      default:
        return value.toString();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {isArabic ? "مكافآتي" : "My Rewards"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          {isArabic ? "مكافآتي" : "My Rewards"}
        </CardTitle>
        <CardDescription>
          {isArabic
            ? "المكافآت التي حصلت عليها من الإحالات"
            : "Rewards you've earned from referrals"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data?.content && data.content.length > 0 ? (
          <div className="space-y-3">
            {data.content.map((reward) => {
              const StatusIcon =
                reward.status === "DISTRIBUTED"
                  ? CheckCircle
                  : reward.status === "PENDING"
                  ? Clock
                  : XCircle;

              return (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {isArabic
                          ? REWARD_TYPE_LABELS[reward.rewardType].ar
                          : REWARD_TYPE_LABELS[reward.rewardType].en}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StatusIcon className="h-3 w-3" />
                      <span>
                        {format(new Date(reward.createdAt), "PP", { locale: dateLocale })}
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-primary">
                      {formatRewardValue(reward.rewardType, reward.amount || 0)}
                    </p>
                    <Badge className={STATUS_COLORS[reward.status]}>
                      {isArabic
                        ? STATUS_LABELS[reward.status].ar
                        : STATUS_LABELS[reward.status].en}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isArabic
                ? "لا توجد مكافآت بعد"
                : "No rewards yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? "ستحصل على مكافآت عندما يتحول الأشخاص المحالون إلى أعضاء"
                : "You'll earn rewards when your referrals convert to members"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
