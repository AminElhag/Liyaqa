"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Users,
  Clock,
  TrendingUp,
  Dumbbell,
  BarChart3,
  Grid3X3,
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
import { useAttendanceReport } from "@/queries/use-reports";
import { AttendanceChart } from "@/components/admin/attendance-chart";
import { PeakHoursHeatmap } from "@/components/admin/peak-hours-heatmap";

export default function AttendanceReportPage() {
  const locale = useLocale();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(
    thirtyDaysAgo.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  const { data: report, isLoading, error } = useAttendanceReport({
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
          <Calendar className="h-6 w-6" />
          {locale === "ar" ? "تقرير الحضور" : "Attendance Report"}
        </h1>
        <p className="text-neutral-500">
          {locale === "ar"
            ? "تحليل معدلات الحضور"
            : "Attendance rates analysis"}
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  {locale === "ar" ? "إجمالي الزيارات" : "Total Check-ins"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {report.summary.totalCheckIns}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-success" />
                  {locale === "ar" ? "أعضاء فريدون" : "Unique Members"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">
                  {report.summary.uniqueMembers}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-warning" />
                  {locale === "ar" ? "متوسط الزيارات/يوم" : "Avg Check-ins/Day"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-warning">
                  {report.summary.averageCheckInsPerDay.toFixed(1)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-500 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-info" />
                  {locale === "ar" ? "ساعة الذروة" : "Peak Hour"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{report.summary.peakHour}</p>
                <p className="text-sm text-neutral-500">
                  {report.summary.peakDay}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {locale === "ar" ? "اتجاه الحضور" : "Attendance Trend"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChart data={report.byPeriod} locale={locale} />
            </CardContent>
          </Card>

          {/* Peak Hours Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-info" />
                {locale === "ar" ? "ساعات الذروة" : "Peak Hours Heatmap"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PeakHoursHeatmap data={report.byHour} locale={locale} />
            </CardContent>
          </Card>

          {/* Attendance by Period Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "الحضور حسب الفترة" : "Attendance by Period"}
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
                          {item.uniqueMembers}{" "}
                          {locale === "ar" ? "عضو" : "members"}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {item.checkIns}{" "}
                        <span className="text-sm font-normal text-neutral-500">
                          {locale === "ar" ? "زيارة" : "check-ins"}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance by Class */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                {locale === "ar" ? "الحضور حسب الحصة" : "Attendance by Class"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.byClass.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">
                  {locale === "ar" ? "لا توجد بيانات" : "No data available"}
                </p>
              ) : (
                <div className="space-y-3">
                  {report.byClass.map((item) => (
                    <div
                      key={item.classId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.className}</p>
                        <p className="text-sm text-neutral-500">
                          {item.bookings}{" "}
                          {locale === "ar" ? "حجز" : "bookings"}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-lg font-bold">
                          {item.attendance}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {locale === "ar" ? "حضور" : "attended"}
                        </p>
                      </div>
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
