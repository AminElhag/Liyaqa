"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { format, subMonths } from "date-fns";
import { Calendar, TrendingDown, Users, RefreshCw } from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Input } from "@liyaqa/shared/components/ui/input";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import { useGenerateChurnReport } from "@liyaqa/shared/queries/use-reports";
import type { ChurnReport } from "@liyaqa/shared/types/report";

export default function ChurnReportPage() {
  const locale = useLocale();
  const [startDate, setStartDate] = useState(
    format(subMonths(new Date(), 6), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [report, setReport] = useState<ChurnReport | null>(null);

  const generateMutation = useGenerateChurnReport();

  const handleGenerate = () => {
    generateMutation.mutate(
      { startDate, endDate },
      {
        onSuccess: (data) => {
          setReport(data);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {locale === "ar" ? "تقرير التسرب" : "Churn Report"}
        </h1>
        <p className="text-muted-foreground">
          {locale === "ar"
            ? "تحليل تسرب الأعضاء ومعدلات الاحتفاظ"
            : "Analyze member churn and retention rates"}
        </p>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {locale === "ar" ? "نطاق التاريخ" : "Date Range"}
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
                  {locale === "ar" ? "الأعضاء في البداية" : "Members at Start"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {report.totalMembersStart.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "الأعضاء المتسربون" : "Churned Members"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {report.churnedMembers.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "معدل التسرب" : "Churn Rate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {report.churnRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {locale === "ar" ? "معدل الاحتفاظ" : "Retention Rate"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {report.retentionRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Churn by Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                {locale === "ar" ? "التسرب حسب الخطة" : "Churn by Plan"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "الخطة" : "Plan"}</TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "إجمالي الأعضاء" : "Total Members"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "المتسربون" : "Churned"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "معدل التسرب" : "Churn Rate"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.churnByPlan.map((plan) => (
                    <TableRow key={plan.planId}>
                      <TableCell className="font-medium">
                        {plan.planName}
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.totalMembers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {plan.churnedMembers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {plan.churnRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Churn Reasons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {locale === "ar" ? "أسباب التسرب" : "Churn Reasons"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === "ar" ? "السبب" : "Reason"}</TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "العدد" : "Count"}
                    </TableHead>
                    <TableHead className="text-right">
                      {locale === "ar" ? "النسبة" : "Percentage"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.churnReasons.map((reason, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {locale === "ar" ? reason.reasonAr : reason.reason}
                      </TableCell>
                      <TableCell className="text-right">
                        {reason.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {reason.percentage.toFixed(1)}%
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
