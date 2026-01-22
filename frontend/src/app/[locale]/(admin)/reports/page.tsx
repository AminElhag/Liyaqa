"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  FileText,
  CreditCard,
  ClipboardList,
  ChevronRight,
  Clock,
  AlertCircle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useExportMembers,
  useExportSubscriptions,
  useExportInvoices,
  useExportAttendance,
  useExportBookings,
} from "@/queries/use-exports";
import {
  useRevenueReport,
  useAttendanceReport,
  useMemberReport,
} from "@/queries/use-reports";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { AttendanceChart } from "@/components/admin/attendance-chart";
import { MemberGrowthChart } from "@/components/admin/member-growth-chart";

type DatePreset = "7d" | "30d" | "90d" | "custom";

export default function ReportsPage() {
  const locale = useLocale();
  const { toast } = useToast();

  // Date preset state
  const [datePreset, setDatePreset] = useState<DatePreset>("30d");
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate date range based on preset
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    let days = 30;

    switch (datePreset) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return { startDate: start, endDate: end };
  }, [datePreset]);

  // Group by based on preset
  const groupBy = useMemo(() => {
    switch (datePreset) {
      case "7d":
        return "day" as const;
      case "30d":
        return "day" as const;
      case "90d":
        return "week" as const;
      default:
        return "day" as const;
    }
  }, [datePreset]);

  // Fetch reports
  const { data: revenueReport, isLoading: revenueLoading } = useRevenueReport({
    startDate,
    endDate,
    groupBy,
  });
  const { data: attendanceReport, isLoading: attendanceLoading } = useAttendanceReport({
    startDate,
    endDate,
    groupBy,
  });
  const { data: memberReport, isLoading: memberLoading } = useMemberReport({
    startDate,
    endDate,
    groupBy: "week",
  });

  // Exports
  const exportMembers = useExportMembers();
  const exportSubscriptions = useExportSubscriptions();
  const exportInvoices = useExportInvoices();
  const exportAttendance = useExportAttendance();
  const exportBookings = useExportBookings();

  const handleExport = async (
    type: "members" | "subscriptions" | "invoices" | "attendance" | "bookings"
  ) => {
    try {
      switch (type) {
        case "members":
          await exportMembers.mutateAsync({});
          break;
        case "subscriptions":
          await exportSubscriptions.mutateAsync({});
          break;
        case "invoices":
          await exportInvoices.mutateAsync({});
          break;
        case "attendance":
          await exportAttendance.mutateAsync({});
          break;
        case "bookings":
          await exportBookings.mutateAsync({});
          break;
      }
      toast({
        title: locale === "ar" ? "تم التصدير" : "Exported",
        description:
          locale === "ar"
            ? "تم تنزيل الملف بنجاح"
            : "File downloaded successfully",
      });
    } catch {
      toast({
        title: locale === "ar" ? "خطأ" : "Error",
        description:
          locale === "ar"
            ? "فشل في تصدير البيانات"
            : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const texts = {
    title: locale === "ar" ? "التقارير والتحليلات" : "Reports & Analytics",
    subtitle: locale === "ar" ? "عرض التقارير وتصدير البيانات" : "View reports and export data",
    overview: locale === "ar" ? "نظرة عامة" : "Overview",
    revenue: locale === "ar" ? "الإيرادات" : "Revenue",
    attendance: locale === "ar" ? "الحضور" : "Attendance",
    members: locale === "ar" ? "الأعضاء" : "Members",
    exports: locale === "ar" ? "التصدير" : "Exports",
    last7Days: locale === "ar" ? "آخر 7 أيام" : "Last 7 days",
    last30Days: locale === "ar" ? "آخر 30 يوم" : "Last 30 days",
    last90Days: locale === "ar" ? "آخر 90 يوم" : "Last 90 days",
    viewFullReport: locale === "ar" ? "عرض التقرير الكامل" : "View full report",
    totalRevenue: locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue",
    pendingRevenue: locale === "ar" ? "الإيرادات المعلقة" : "Pending Revenue",
    overdueRevenue: locale === "ar" ? "الإيرادات المتأخرة" : "Overdue Revenue",
    totalCheckIns: locale === "ar" ? "إجمالي الزيارات" : "Total Check-ins",
    uniqueMembers: locale === "ar" ? "أعضاء فريدون" : "Unique Members",
    avgPerDay: locale === "ar" ? "متوسط/يوم" : "Avg/Day",
    peakHour: locale === "ar" ? "ساعة الذروة" : "Peak Hour",
    totalMembers: locale === "ar" ? "إجمالي الأعضاء" : "Total Members",
    activeMembers: locale === "ar" ? "أعضاء نشطون" : "Active Members",
    newMembers: locale === "ar" ? "أعضاء جدد" : "New Members",
    churnedMembers: locale === "ar" ? "مغادرون" : "Churned",
    retentionRate: locale === "ar" ? "معدل الاحتفاظ" : "Retention Rate",
    paidInvoices: locale === "ar" ? "فواتير مدفوعة" : "paid invoices",
    pendingInvoices: locale === "ar" ? "فواتير معلقة" : "pending invoices",
    overdueInvoices: locale === "ar" ? "فواتير متأخرة" : "overdue invoices",
  };

  const exportOptions = [
    {
      title: locale === "ar" ? "الأعضاء" : "Members",
      description: locale === "ar" ? "تصدير بيانات الأعضاء" : "Export member data",
      icon: Users,
      type: "members" as const,
      isPending: exportMembers.isPending,
    },
    {
      title: locale === "ar" ? "الاشتراكات" : "Subscriptions",
      description: locale === "ar" ? "تصدير بيانات الاشتراكات" : "Export subscription data",
      icon: CreditCard,
      type: "subscriptions" as const,
      isPending: exportSubscriptions.isPending,
    },
    {
      title: locale === "ar" ? "الفواتير" : "Invoices",
      description: locale === "ar" ? "تصدير بيانات الفواتير" : "Export invoice data",
      icon: FileText,
      type: "invoices" as const,
      isPending: exportInvoices.isPending,
    },
    {
      title: locale === "ar" ? "الحضور" : "Attendance",
      description: locale === "ar" ? "تصدير سجلات الحضور" : "Export attendance records",
      icon: Calendar,
      type: "attendance" as const,
      isPending: exportAttendance.isPending,
    },
    {
      title: locale === "ar" ? "الحجوزات" : "Bookings",
      description: locale === "ar" ? "تصدير بيانات الحجوزات" : "Export booking data",
      icon: ClipboardList,
      type: "bookings" as const,
      isPending: exportBookings.isPending,
    },
  ];

  const isLoading = revenueLoading || attendanceLoading || memberLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {texts.title}
          </h1>
          <p className="text-neutral-500">{texts.subtitle}</p>
        </div>

        {/* Date Presets */}
        <div className="flex gap-2">
          <Button
            variant={datePreset === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDatePreset("7d")}
          >
            {texts.last7Days}
          </Button>
          <Button
            variant={datePreset === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDatePreset("30d")}
          >
            {texts.last30Days}
          </Button>
          <Button
            variant={datePreset === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setDatePreset("90d")}
          >
            {texts.last90Days}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{texts.overview}</TabsTrigger>
          <TabsTrigger value="revenue">{texts.revenue}</TabsTrigger>
          <TabsTrigger value="attendance">{texts.attendance}</TabsTrigger>
          <TabsTrigger value="members">{texts.members}</TabsTrigger>
          <TabsTrigger value="exports">{texts.exports}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Revenue Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-success" />
                  {texts.totalRevenue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : revenueReport ? (
                  <>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(
                        revenueReport.summary.totalRevenue.amount,
                        revenueReport.summary.totalRevenue.currency,
                        locale
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {revenueReport.summary.paidInvoices} {texts.paidInvoices}
                    </p>
                  </>
                ) : (
                  <p className="text-neutral-400">-</p>
                )}
              </CardContent>
            </Card>

            {/* Total Check-ins Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {texts.totalCheckIns}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : attendanceReport ? (
                  <>
                    <p className="text-2xl font-bold text-primary">
                      {attendanceReport.summary.totalCheckIns}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {attendanceReport.summary.uniqueMembers} {texts.uniqueMembers}
                    </p>
                  </>
                ) : (
                  <p className="text-neutral-400">-</p>
                )}
              </CardContent>
            </Card>

            {/* Active Members Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-info" />
                  {texts.activeMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : memberReport ? (
                  <>
                    <p className="text-2xl font-bold text-info">
                      {memberReport.summary.activeMembers}
                    </p>
                    <p className="text-sm text-neutral-500">
                      +{memberReport.summary.newMembersThisPeriod} {texts.newMembers}
                    </p>
                  </>
                ) : (
                  <p className="text-neutral-400">-</p>
                )}
              </CardContent>
            </Card>

            {/* Retention Rate Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  {texts.retentionRate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : memberReport ? (
                  <>
                    <p className="text-2xl font-bold text-warning">
                      {memberReport.summary.retentionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-neutral-500">
                      -{memberReport.summary.churnedMembersThisPeriod} {texts.churnedMembers}
                    </p>
                  </>
                ) : (
                  <p className="text-neutral-400">-</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{texts.revenue}</CardTitle>
                <Link href={`/${locale}/reports/revenue`}>
                  <Button variant="ghost" size="sm">
                    {texts.viewFullReport}
                    <ChevronRight className="h-4 w-4 ms-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : revenueReport ? (
                  <RevenueChart data={revenueReport.byPeriod} locale={locale} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-neutral-400">
                    {locale === "ar" ? "لا توجد بيانات" : "No data"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{texts.attendance}</CardTitle>
                <Link href={`/${locale}/reports/attendance`}>
                  <Button variant="ghost" size="sm">
                    {texts.viewFullReport}
                    <ChevronRight className="h-4 w-4 ms-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : attendanceReport ? (
                  <AttendanceChart data={attendanceReport.byPeriod} locale={locale} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-neutral-400">
                    {locale === "ar" ? "لا توجد بيانات" : "No data"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Member Growth Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{texts.members}</CardTitle>
              <Link href={`/${locale}/reports/members`}>
                <Button variant="ghost" size="sm">
                  {texts.viewFullReport}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {memberLoading ? (
                <Skeleton className="h-[200px]" />
              ) : memberReport ? (
                <MemberGrowthChart data={memberReport.growthByPeriod} locale={locale} />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-neutral-400">
                  {locale === "ar" ? "لا توجد بيانات" : "No data"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {texts.totalRevenue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : revenueReport ? (
                  <>
                    <p className="text-2xl font-bold text-success">
                      {formatCurrency(
                        revenueReport.summary.totalRevenue.amount,
                        revenueReport.summary.totalRevenue.currency,
                        locale
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {revenueReport.summary.paidInvoices} {texts.paidInvoices}
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  {texts.pendingRevenue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : revenueReport ? (
                  <>
                    <p className="text-2xl font-bold text-warning">
                      {formatCurrency(
                        revenueReport.summary.pendingRevenue.amount,
                        revenueReport.summary.pendingRevenue.currency,
                        locale
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {revenueReport.summary.pendingInvoices} {texts.pendingInvoices}
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  {texts.overdueRevenue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : revenueReport ? (
                  <>
                    <p className="text-2xl font-bold text-danger">
                      {formatCurrency(
                        revenueReport.summary.overdueRevenue.amount,
                        revenueReport.summary.overdueRevenue.currency,
                        locale
                      )}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {revenueReport.summary.overdueInvoices} {texts.overdueInvoices}
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{texts.revenue}</CardTitle>
              <Link href={`/${locale}/reports/revenue`}>
                <Button variant="outline" size="sm">
                  {texts.viewFullReport}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-[300px]" />
              ) : revenueReport ? (
                <RevenueChart data={revenueReport.byPeriod} locale={locale} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {texts.totalCheckIns}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : attendanceReport ? (
                  <p className="text-2xl font-bold text-primary">
                    {attendanceReport.summary.totalCheckIns}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-success" />
                  {texts.uniqueMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : attendanceReport ? (
                  <p className="text-2xl font-bold text-success">
                    {attendanceReport.summary.uniqueMembers}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-warning" />
                  {texts.avgPerDay}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : attendanceReport ? (
                  <p className="text-2xl font-bold text-warning">
                    {attendanceReport.summary.averageCheckInsPerDay.toFixed(1)}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-info" />
                  {texts.peakHour}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : attendanceReport ? (
                  <>
                    <p className="text-2xl font-bold">
                      {attendanceReport.summary.peakHour}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {attendanceReport.summary.peakDay}
                    </p>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{texts.attendance}</CardTitle>
              <Link href={`/${locale}/reports/attendance`}>
                <Button variant="outline" size="sm">
                  {texts.viewFullReport}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <Skeleton className="h-[300px]" />
              ) : attendanceReport ? (
                <AttendanceChart data={attendanceReport.byPeriod} locale={locale} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {texts.totalMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : memberReport ? (
                  <p className="text-2xl font-bold text-primary">
                    {memberReport.summary.totalMembers}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {texts.activeMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : memberReport ? (
                  <p className="text-2xl font-bold text-success">
                    {memberReport.summary.activeMembers}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-info" />
                  {texts.newMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : memberReport ? (
                  <p className="text-2xl font-bold text-info">
                    +{memberReport.summary.newMembersThisPeriod}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-danger" />
                  {texts.churnedMembers}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : memberReport ? (
                  <p className="text-2xl font-bold text-danger">
                    -{memberReport.summary.churnedMembersThisPeriod}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-warning" />
                  {texts.retentionRate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : memberReport ? (
                  <p className="text-2xl font-bold text-warning">
                    {memberReport.summary.retentionRate.toFixed(1)}%
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{texts.members}</CardTitle>
              <Link href={`/${locale}/reports/members`}>
                <Button variant="outline" size="sm">
                  {texts.viewFullReport}
                  <ChevronRight className="h-4 w-4 ms-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {memberLoading ? (
                <Skeleton className="h-[300px]" />
              ) : memberReport ? (
                <MemberGrowthChart data={memberReport.growthByPeriod} locale={locale} />
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                {locale === "ar" ? "تصدير البيانات" : "Export Data"}
              </CardTitle>
              <CardDescription>
                {locale === "ar"
                  ? "قم بتنزيل بياناتك بتنسيق CSV"
                  : "Download your data in CSV format"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {exportOptions.map((option) => (
                  <div
                    key={option.type}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <option.icon className="h-5 w-5 text-neutral-400" />
                      <div>
                        <p className="font-medium">{option.title}</p>
                        <p className="text-sm text-neutral-500">
                          {option.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(option.type)}
                      disabled={option.isPending}
                    >
                      <Download className="h-4 w-4 me-1" />
                      {option.isPending ? "..." : "CSV"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
