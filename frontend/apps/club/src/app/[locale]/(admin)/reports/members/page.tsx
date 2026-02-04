"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  PieChart,
  CreditCard,
  LineChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@liyaqa/shared/components/ui/card";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { useMemberReport } from "@liyaqa/shared/queries/use-reports";
import { MemberGrowthChart } from "@/components/admin/member-growth-chart";
import { MemberDistributionChart } from "@/components/admin/member-distribution";

export default function MemberReportPage() {
  const locale = useLocale();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("week");

  const { data: report, isLoading, error } = useMemberReport({
    startDate,
    endDate,
    groupBy,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/${locale}/reports`}>
            <ChevronLeft className="h-4 w-4 me-1" />
            {locale === "ar" ? "العودة للتقارير" : "Back to reports"}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          {locale === "ar" ? "تقرير الأعضاء" : "Members Report"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "نمو الأعضاء والاحتفاظ بهم"
            : "Member growth and retention"}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>{locale === "ar" ? "من تاريخ" : "From Date"}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "إلى تاريخ" : "To Date"}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "تجميع حسب" : "Group By"}</Label>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">
                    {locale === "ar" ? "يوم" : "Day"}
                  </SelectItem>
                  <SelectItem value="week">
                    {locale === "ar" ? "أسبوع" : "Week"}
                  </SelectItem>
                  <SelectItem value="month">
                    {locale === "ar" ? "شهر" : "Month"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center text-neutral-500">
            {locale === "ar"
              ? "فشل في تحميل التقرير"
              : "Failed to load report"}
          </CardContent>
        </Card>
      )}

      {/* Report Data */}
      {!isLoading && !error && report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {locale === "ar" ? "إجمالي الأعضاء" : "Total Members"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {report.summary.totalMembers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {locale === "ar" ? "أعضاء نشطون" : "Active Members"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  {report.summary.activeMembers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-info" />
                  {locale === "ar" ? "أعضاء جدد" : "New Members"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-info">
                  {report.summary.newMembersThisPeriod}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <UserMinus className="h-4 w-4 text-danger" />
                  {locale === "ar" ? "أعضاء مغادرون" : "Churned Members"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-danger">
                  {report.summary.churnedMembersThisPeriod}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-warning" />
                  {locale === "ar" ? "معدل الاحتفاظ" : "Retention Rate"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">
                  {report.summary.retentionRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Member Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                {locale === "ar" ? "اتجاه نمو الأعضاء" : "Member Growth Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberGrowthChart data={report.growthByPeriod} locale={locale} />
            </CardContent>
          </Card>

          {/* Member Growth by Period Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "نمو الأعضاء حسب الفترة" : "Member Growth by Period"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.growthByPeriod.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  {locale === "ar" ? "لا توجد بيانات" : "No data available"}
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {report.growthByPeriod.map((item) => (
                    <div
                      key={item.period}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.period}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="success" className="text-xs">
                            +{item.newMembers}{" "}
                            {locale === "ar" ? "جديد" : "new"}
                          </Badge>
                          {item.churnedMembers > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              -{item.churnedMembers}{" "}
                              {locale === "ar" ? "مغادر" : "churned"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-end">
                        <p className="text-lg font-bold">
                          {item.totalMembers}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {locale === "ar" ? "إجمالي" : "total"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Member Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {locale === "ar" ? "توزيع الأعضاء" : "Member Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberDistributionChart data={report.byStatus} locale={locale} />
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Members by Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {locale === "ar" ? "الأعضاء حسب الحالة" : "Members by Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.byStatus.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">
                    {locale === "ar" ? "لا توجد بيانات" : "No data available"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.byStatus.map((item) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              item.status === "ACTIVE"
                                ? "success"
                                : item.status === "SUSPENDED"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {item.status}
                          </Badge>
                        </div>
                        <p className="font-bold">{item.count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Members by Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {locale === "ar" ? "الأعضاء حسب الباقة" : "Members by Plan"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {report.byPlan.length === 0 ? (
                  <p className="text-neutral-500 text-center py-8">
                    {locale === "ar" ? "لا توجد بيانات" : "No data available"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.byPlan.map((item) => (
                      <div
                        key={item.planId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <p className="font-medium">{item.planName}</p>
                        <p className="font-bold">{item.memberCount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
