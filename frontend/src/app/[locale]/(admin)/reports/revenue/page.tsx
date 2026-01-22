"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRevenueReport } from "@/queries/use-reports";
import { formatCurrency } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { RevenueByPlanChart } from "@/components/admin/revenue-by-plan";

export default function RevenueReportPage() {
  const locale = useLocale();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const { data: report, isLoading, error } = useRevenueReport({
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
          <DollarSign className="h-6 w-6" />
          {locale === "ar" ? "تقرير الإيرادات" : "Revenue Report"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "تحليل الإيرادات والفواتير"
            : "Revenue and invoice analysis"}
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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  {locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(
                    report.summary.totalRevenue.amount,
                    report.summary.totalRevenue.currency,
                    locale
                  )}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {report.summary.paidInvoices}{" "}
                  {locale === "ar" ? "فواتير مدفوعة" : "paid invoices"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  {locale === "ar" ? "الإيرادات المعلقة" : "Pending Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(
                    report.summary.pendingRevenue.amount,
                    report.summary.pendingRevenue.currency,
                    locale
                  )}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {report.summary.pendingInvoices}{" "}
                  {locale === "ar" ? "فواتير معلقة" : "pending invoices"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-danger" />
                  {locale === "ar" ? "الإيرادات المتأخرة" : "Overdue Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-danger">
                  {formatCurrency(
                    report.summary.overdueRevenue.amount,
                    report.summary.overdueRevenue.currency,
                    locale
                  )}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {report.summary.overdueInvoices}{" "}
                  {locale === "ar" ? "فواتير متأخرة" : "overdue invoices"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-success" />
                {locale === "ar" ? "اتجاه الإيرادات" : "Revenue Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={report.byPeriod} locale={locale} />
            </CardContent>
          </Card>

          {/* Revenue by Period Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "الإيرادات حسب الفترة" : "Revenue by Period"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.byPeriod.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  {locale === "ar" ? "لا توجد بيانات" : "No data available"}
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {report.byPeriod.map((item) => (
                    <div
                      key={item.period}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.period}</p>
                        <p className="text-sm text-neutral-500">
                          {item.invoiceCount}{" "}
                          {locale === "ar" ? "فاتورة" : "invoices"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-success">
                        {formatCurrency(item.revenue, "SAR", locale)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Plan Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {locale === "ar" ? "توزيع الإيرادات حسب الباقة" : "Revenue Distribution by Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueByPlanChart data={report.byPlan} locale={locale} />
            </CardContent>
          </Card>

          {/* Revenue by Plan List */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "الإيرادات حسب الباقة" : "Revenue by Plan"}
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
                      <div>
                        <p className="font-medium">{item.planName}</p>
                        <p className="text-sm text-neutral-500">
                          {item.subscriptionCount}{" "}
                          {locale === "ar" ? "اشتراك" : "subscriptions"}
                        </p>
                      </div>
                      <p className="text-lg font-bold">
                        {formatCurrency(item.revenue, "SAR", locale)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
