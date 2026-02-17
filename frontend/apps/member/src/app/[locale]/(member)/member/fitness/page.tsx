"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Activity,
  Footprints,
  Flame,
  Heart,
  Moon,
  TrendingUp,
  Watch,
  ChevronRight,
  Calendar,
  Dumbbell,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { useMyProfile } from "@liyaqa/shared/queries/use-me";
import {
  useMemberActivityStats,
  useMemberDailyActivities,
  useMemberWearableWorkouts,
  useMemberWearableConnections,
} from "@liyaqa/shared/queries/use-wearable";
import { getActivityTypeLabel, type WearableDailyActivity } from "@liyaqa/shared/types/wearable";

export default function MemberActivityPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: profile } = useMyProfile();
  const memberId = profile?.id || "";

  const [period, setPeriod] = useState("30");

  const { data: connections } = useMemberWearableConnections(memberId);
  const { data: activityStats, isLoading: statsLoading } = useMemberActivityStats(
    memberId,
    parseInt(period)
  );
  const { data: activitiesData, isLoading: activitiesLoading } = useMemberDailyActivities(
    memberId,
    0,
    7
  );
  const { data: workoutsData, isLoading: workoutsLoading } = useMemberWearableWorkouts(
    memberId,
    0,
    5
  );

  const hasConnections = connections && connections.length > 0;
  const activities = Array.isArray(activitiesData)
    ? activitiesData
    : activitiesData?.content || [];
  const workouts = Array.isArray(workoutsData)
    ? workoutsData
    : workoutsData?.content || [];

  // Daily step goal (could be customizable)
  const stepGoal = 10000;
  const todayActivity = activities.length > 0 ? activities[0] : null;
  const stepProgress = todayActivity?.steps
    ? Math.min((todayActivity.steps / stepGoal) * 100, 100)
    : 0;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(locale).format(num);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}${isArabic ? "س" : "h"} ${mins}${isArabic ? "د" : "m"}`;
    }
    return `${mins}${isArabic ? " دقيقة" : " min"}`;
  };

  if (!hasConnections) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "لوحة النشاط" : "Activity Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? "تتبع نشاطك اليومي وتمارينك" : "Track your daily activity and workouts"}
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">
              {isArabic ? "لا توجد أجهزة متصلة" : "No connected devices"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isArabic
                ? "اربط جهازك القابل للارتداء لعرض بيانات نشاطك"
                : "Connect your wearable device to view your activity data"}
            </p>
            <Button asChild>
              <Link href={`/${locale}/member/wearables`}>
                {isArabic ? "ربط جهاز" : "Connect Device"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isArabic ? "لوحة النشاط" : "Activity Dashboard"}
          </h1>
          <p className="text-muted-foreground">
            {isArabic ? "تتبع نشاطك اليومي وتمارينك" : "Track your daily activity and workouts"}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{isArabic ? "آخر 7 أيام" : "Last 7 days"}</SelectItem>
            <SelectItem value="30">{isArabic ? "آخر 30 يوم" : "Last 30 days"}</SelectItem>
            <SelectItem value="90">{isArabic ? "آخر 90 يوم" : "Last 90 days"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {isArabic ? "نشاط اليوم" : "Today's Activity"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : todayActivity ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Footprints className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">
                    {formatNumber(todayActivity.steps || 0)} {isArabic ? "خطوة" : "steps"}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isArabic ? "الهدف: " : "Goal: "}{formatNumber(stepGoal)}
                </span>
              </div>
              <Progress value={stepProgress} className="h-2" />
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">
                    {formatNumber(todayActivity.caloriesActive || todayActivity.caloriesTotal || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "سعرات" : "Calories"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {todayActivity.activeMinutes || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "دقائق نشطة" : "Active min"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">
                    {todayActivity.distanceKm?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? "كم" : "km"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {isArabic ? "لا توجد بيانات لليوم" : "No data for today"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : activityStats ? (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "متوسط الخطوات" : "Avg Steps"}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(Math.round(activityStats.averageStepsPerDay))}
                    </p>
                  </div>
                  <Footprints className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "إجمالي السعرات" : "Total Calories"}
                    </p>
                    <p className="text-2xl font-bold text-orange-500">
                      {formatNumber(activityStats.totalCalories)}
                    </p>
                  </div>
                  <Flame className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "وقت النشاط" : "Active Time"}
                    </p>
                    <p className="text-2xl font-bold text-green-500">
                      {activityStats.totalActiveHours.toFixed(1)}
                      <span className="text-sm font-normal">{isArabic ? "س" : "h"}</span>
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isArabic ? "متوسط النوم" : "Avg Sleep"}
                    </p>
                    <p className="text-2xl font-bold text-purple-500">
                      {activityStats.averageSleepHours.toFixed(1)}
                      <span className="text-sm font-normal">{isArabic ? "س" : "h"}</span>
                    </p>
                  </div>
                  <Moon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Recent Workouts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {isArabic ? "التمارين الأخيرة" : "Recent Workouts"}
            </CardTitle>
            <CardDescription>
              {isArabic
                ? "التمارين المسجلة من أجهزتك"
                : "Workouts recorded from your devices"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {workoutsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {workout.activityName ||
                          getActivityTypeLabel(workout.activityType, isArabic ? "ar" : "en")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workout.startedAt).toLocaleDateString(locale)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {workout.durationMinutes && (
                      <p className="font-medium">{formatDuration(workout.durationMinutes)}</p>
                    )}
                    {workout.caloriesBurned && (
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(workout.caloriesBurned)} {isArabic ? "سعرة" : "cal"}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isArabic ? "لا توجد تمارين مسجلة" : "No workouts recorded"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href={`/${locale}/member/wearables`}>
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Watch className="h-5 w-5" />
                <span>{isArabic ? "إدارة الأجهزة" : "Manage Devices"}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Card className="hover:bg-accent transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5" />
              <span>{isArabic ? "تقارير مفصلة" : "Detailed Reports"}</span>
            </div>
            <Badge variant="secondary">{isArabic ? "قريباً" : "Coming Soon"}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
