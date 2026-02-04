"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { Settings, Users, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@liyaqa/shared/components/ui/tabs";
import { ReferralLeaderboard } from "@/components/admin/referral-leaderboard";
import { ReferralAnalyticsCard } from "@/components/admin/referral-analytics";
import { useReferralAnalytics, useReferralConfig, useReferralLeaderboard } from "@liyaqa/shared/queries/use-referrals";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";

export default function ReferralsPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: config } = useReferralConfig();
  const { data: analytics, isLoading } = useReferralAnalytics();
  const { data: topReferrers, isLoading: leaderboardLoading } = useReferralLeaderboard(10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {isArabic ? "لوحة الإحالات" : "Referral Dashboard"}
            </h1>
            <Badge variant={config?.isEnabled ? "default" : "secondary"}>
              {config?.isEnabled
                ? isArabic ? "مفعل" : "Active"
                : isArabic ? "غير مفعل" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {isArabic
              ? "تتبع أداء برنامج الإحالة والأعضاء الأكثر نشاطاً"
              : "Track referral program performance and top referrers"}
          </p>
        </div>
        <Link href={`/${locale}/settings/referral`}>
          <Button variant="outline">
            <Settings className="h-4 w-4 me-2" />
            {isArabic ? "الإعدادات" : "Settings"}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalClicks || 0}</p>
                  <p className="text-muted-foreground text-sm">
                    {isArabic ? "النقرات" : "Clicks"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.totalConversions || 0}</p>
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
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {analytics?.conversionRate ? `${analytics.conversionRate.toFixed(1)}%` : "0%"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {isArabic ? "معدل التحويل" : "Conversion Rate"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.activeReferrers || 0}</p>
                  <p className="text-muted-foreground text-sm">
                    {isArabic ? "المحيلون النشطون" : "Active Referrers"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 me-2" />
            {isArabic ? "المتصدرون" : "Leaderboard"}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 me-2" />
            {isArabic ? "التحليلات" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>{isArabic ? "أفضل المحيلين" : "Top Referrers"}</CardTitle>
              <CardDescription>
                {isArabic
                  ? "الأعضاء الأكثر ناجحًا في الإحالات"
                  : "Members with the most successful referrals"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralLeaderboard topReferrers={topReferrers || []} isLoading={leaderboardLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <ReferralAnalyticsCard analytics={analytics} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
