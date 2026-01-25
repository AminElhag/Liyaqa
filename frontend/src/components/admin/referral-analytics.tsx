"use client";

import { useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MousePointer,
  UserPlus,
  CheckCircle,
  Wallet,
  Clock,
  TrendingUp,
} from "lucide-react";
import type { ReferralAnalytics } from "@/types/referral";

interface ReferralAnalyticsCardProps {
  analytics?: ReferralAnalytics;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  color?: string;
}

function StatCard({ icon, label, value, subValue, color = "text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-muted ${color}`}>{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground">{subValue}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReferralAnalyticsCard({ analytics, isLoading }: ReferralAnalyticsCardProps) {
  const locale = useLocale();
  const isArabic = locale === "ar";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-muted rounded" />
                    <div className="h-6 w-12 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(isArabic ? "ar-SA" : "en-US", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const formatPercent = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MousePointer className="h-5 w-5" />}
          label={isArabic ? "إجمالي النقرات" : "Total Clicks"}
          value={analytics.totalClicks.toLocaleString()}
          color="text-blue-500"
        />
        <StatCard
          icon={<UserPlus className="h-5 w-5" />}
          label={isArabic ? "التسجيلات" : "Sign Ups"}
          value={analytics.totalSignups.toLocaleString()}
          color="text-yellow-500"
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5" />}
          label={isArabic ? "التحويلات" : "Conversions"}
          value={analytics.totalConversions.toLocaleString()}
          color="text-green-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={isArabic ? "معدل التحويل" : "Conversion Rate"}
          value={formatPercent(analytics.overallConversionRate)}
          color="text-purple-500"
        />
      </div>

      {/* Rewards Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {isArabic ? "المكافآت الموزعة" : "Rewards Distributed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatCurrency(analytics.totalRewardsDistributed)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic ? "إجمالي المكافآت المدفوعة" : "Total rewards paid out"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {isArabic ? "المكافآت المعلقة" : "Pending Rewards"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.pendingRewards}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic ? "مكافآت في انتظار التوزيع" : "Rewards awaiting distribution"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "قمع التحويل" : "Conversion Funnel"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isArabic ? "النقرات" : "Clicks"}</span>
              <span>{analytics.totalClicks.toLocaleString()}</span>
            </div>
            <Progress value={100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isArabic ? "التسجيلات" : "Sign Ups"}</span>
              <span>{analytics.totalSignups.toLocaleString()}</span>
            </div>
            <Progress
              value={
                analytics.totalClicks > 0
                  ? (analytics.totalSignups / analytics.totalClicks) * 100
                  : 0
              }
              className="h-2"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{isArabic ? "التحويلات" : "Conversions"}</span>
              <span>{analytics.totalConversions.toLocaleString()}</span>
            </div>
            <Progress
              value={
                analytics.totalClicks > 0
                  ? (analytics.totalConversions / analytics.totalClicks) * 100
                  : 0
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
