"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  FileText,
  UserCheck,
  Mail,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  useActivityStats,
  useDSRStats,
  useBreachStats,
} from "@liyaqa/shared/queries/use-data-protection";

export default function DataProtectionDashboardPage() {
  const locale = useLocale();
  const isArabic = locale === "ar";

  const { data: activityStats, isLoading: loadingActivities } = useActivityStats();
  const { data: dsrStats, isLoading: loadingDSRs } = useDSRStats();
  const { data: breachStats, isLoading: loadingBreaches } = useBreachStats();

  const isLoading = loadingActivities || loadingDSRs || loadingBreaches;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {isArabic ? "حماية البيانات" : "Data Protection"}
        </h1>
        <p className="text-muted-foreground">
          {isArabic
            ? "إدارة الامتثال لنظام حماية البيانات الشخصية (PDPL)"
            : "Manage Personal Data Protection Law (PDPL) compliance"}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "أنشطة المعالجة" : "Processing Activities"}
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activityStats?.activeActivities ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "أنشطة نشطة" : "active activities"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "طلبات DSR المفتوحة" : "Open DSRs"}
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dsrStats?.pendingRequests ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "طلبات في الانتظار" : "pending requests"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "طلبات متأخرة" : "Overdue DSRs"}
                </CardTitle>
                <Clock className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{dsrStats?.overdueRequests ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "تجاوزت 30 يوم" : "exceeded 30 days"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {isArabic ? "انتهاكات مفتوحة" : "Open Breaches"}
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{breachStats?.openBreaches ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? "تحتاج اهتمام" : "need attention"}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* PDPL Alerts */}
      {((dsrStats?.overdueRequests ?? 0) > 0 || (breachStats?.sdaiaPendingNotification ?? 0) > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              {isArabic ? "تنبيهات PDPL" : "PDPL Alerts"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(dsrStats?.overdueRequests ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-red-700">
                  {isArabic
                    ? `${dsrStats?.overdueRequests} طلب(ات) DSR تجاوزت الموعد النهائي 30 يوم (المادة 26)`
                    : `${dsrStats?.overdueRequests} DSR request(s) exceeded 30-day deadline (Article 26)`}
                </span>
                <Link href="/settings/compliance/data-protection/requests">
                  <Badge className="bg-red-600 hover:bg-red-700 cursor-pointer">
                    {isArabic ? "عرض" : "View"}
                  </Badge>
                </Link>
              </div>
            )}
            {(breachStats?.sdaiaPendingNotification ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-red-700">
                  {isArabic
                    ? `${breachStats?.sdaiaPendingNotification} انتهاك(ات) تتطلب إشعار سدايا خلال 72 ساعة (المادة 29)`
                    : `${breachStats?.sdaiaPendingNotification} breach(es) require SDAIA notification within 72 hours (Article 29)`}
                </span>
                <Link href="/settings/compliance/data-protection/breaches">
                  <Badge className="bg-red-600 hover:bg-red-700 cursor-pointer">
                    {isArabic ? "عرض" : "View"}
                  </Badge>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/compliance/data-protection/activities">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "أنشطة المعالجة" : "Processing Activities"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "سجل أنشطة معالجة البيانات (المادة 7)"
                  : "Record of processing activities (Article 7)"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/data-protection/consents">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "إدارة الموافقات" : "Consents Management"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "تتبع موافقات أصحاب البيانات"
                  : "Track data subject consents"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/data-protection/requests">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "طلبات أصحاب البيانات" : "Data Subject Requests"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "إدارة طلبات الوصول والتصحيح والمحو (المواد 15-23)"
                  : "Manage access, rectification, erasure requests (Articles 15-23)"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/settings/compliance/data-protection/breaches">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">
                  {isArabic ? "سجل الانتهاكات" : "Breach Register"}
                </CardTitle>
              </div>
              <CardDescription>
                {isArabic
                  ? "تسجيل وإدارة انتهاكات البيانات (المادة 29)"
                  : "Record and manage data breaches (Article 29)"}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* DSR Stats */}
      <Card>
        <CardHeader>
          <CardTitle>{isArabic ? "إحصائيات طلبات DSR" : "DSR Statistics"}</CardTitle>
          <CardDescription>
            {isArabic
              ? "نظرة عامة على طلبات أصحاب البيانات"
              : "Overview of data subject requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDSRs ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "إجمالي الطلبات" : "Total Requests"}
                </p>
                <p className="text-2xl font-bold">{dsrStats?.totalRequests ?? 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "مكتملة" : "Completed"}
                </p>
                <p className="text-2xl font-bold text-green-600">{dsrStats?.completedRequests ?? 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متوسط أيام الإكمال" : "Avg. Completion Days"}
                </p>
                <p className="text-2xl font-bold">{dsrStats?.averageCompletionDays?.toFixed(1) ?? "-"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
