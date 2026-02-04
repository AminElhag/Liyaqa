"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format, subMonths } from "date-fns";
import { Calendar, DollarSign, Users, TrendingUp, RefreshCw } from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { Progress } from "@liyaqa/shared/components/ui/progress";
import { useGenerateLtvReport } from "@liyaqa/shared/queries/use-reports";
import type { LtvReport, LtvSegment } from "@liyaqa/shared/types/report";

const segmentOptions: { value: LtvSegment; labelEn: string; labelAr: string }[] = [
  { value: "PLAN", labelEn: "By Plan", labelAr: "حسب الخطة" },
  { value: "LOCATION", labelEn: "By Location", labelAr: "حسب الموقع" },
  { value: "JOIN_MONTH", labelEn: "By Join Date", labelAr: "حسب تاريخ الانضمام" },
  { value: "GENDER", labelEn: "By Gender", labelAr: "حسب الجنس" },
];

export default function LtvReportPage() {
  const locale = useLocale();
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 12), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [segmentBy, setSegmentBy] = useState<LtvSegment>("PLAN");
  const [report, setReport] = useState<LtvReport | null>(null);

  const generateMutation = useGenerateLtvReport();

  const handleGenerate = () => {
    generateMutation.mutate(
      { startDate, endDate, segmentBy },
      {
        onSuccess: (data) => {
          setReport(data);
        },
      }
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "تقرير القيمة الدائمة للعميل" : "Lifetime Value Report"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "تحليل القيمة الدائمة للأعضاء عبر الشرائح"
            : "Analyze member lifetime value across segments"}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {locale === "ar" ? "معايير التقرير" : "Report Criteria"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>{locale === "ar" ? "من تاريخ" : "Start Date"}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "إلى تاريخ" : "End Date"}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "ar" ? "تقسيم حسب" : "Segment By"}</Label>
              <Select
                value={segmentBy}
                onValueChange={(v) => setSegmentBy(v as LtvSegment)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {locale === "ar" ? opt.labelAr : opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {locale === "ar" ? "جارٍ التحميل..." : "Loading..."}
                </>
              ) : (
                locale === "ar" ? "إنشاء التقرير" : "Generate Report"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generateMutation.isPending && (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "إجمالي الأعضاء" : "Total Members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {report.totalMembers.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "متوسط LTV" : "Average LTV"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(report.averageLtv)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <p className="text-2xl font-bold">
                    {formatCurrency(report.totalRevenue)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "متوسط عمر العضوية" : "Avg. Lifespan"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {report.averageLifespanMonths.toFixed(1)}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {locale === "ar" ? "أشهر" : "months"}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* LTV Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "توزيع LTV" : "LTV Distribution"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.ltvDistribution.map((bucket, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{bucket.label}</span>
                    <span className="text-muted-foreground">
                      {bucket.count.toLocaleString()} ({bucket.percentage}%)
                    </span>
                  </div>
                  <Progress value={bucket.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Members by LTV */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "أعلى الأعضاء قيمة" : "Top Members by LTV"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>{locale === "ar" ? "العضو" : "Member"}</TableHead>
                    <TableHead className="text-right">LTV</TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "العمر (أشهر)" : "Lifespan (months)"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "المعاملات" : "Transactions"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.topMembers.map((member, idx) => (
                    <TableRow key={member.memberId}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{member.memberName}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {formatCurrency(member.ltv)}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.lifespanMonths}
                      </TableCell>
                      <TableCell className="text-right">
                        {member.transactionCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* LTV by Segment */}
          <Card>
            <CardHeader>
              <CardTitle>
                {locale === "ar" ? "LTV حسب الشريحة" : "LTV by Segment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "الشريحة" : "Segment"}</TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "الأعضاء" : "Members"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "متوسط LTV" : "Avg LTV"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.ltvBySegment.map((segment) => (
                    <TableRow key={segment.segmentId}>
                      <TableCell className="font-medium">
                        {locale === "ar" && segment.segmentNameAr
                          ? segment.segmentNameAr
                          : segment.segmentName}
                      </TableCell>
                      <TableCell className="text-right">
                        {segment.memberCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(segment.averageLtv)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(segment.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
