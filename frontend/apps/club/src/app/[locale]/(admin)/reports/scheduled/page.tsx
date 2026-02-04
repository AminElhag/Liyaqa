"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Mail,
  Plus,
  Trash2,
  Play,
  Pause,
  FileText,
} from "lucide-react";

import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Skeleton } from "@liyaqa/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@liyaqa/shared/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@liyaqa/shared/components/ui/alert-dialog";
import {
  useScheduledReports,
  useDeleteScheduledReport,
  useEnableScheduledReport,
  useDisableScheduledReport,
} from "@liyaqa/shared/queries/use-reports";
import type { ScheduledReport, ReportType, ReportFrequency } from "@liyaqa/shared/types/report";

const reportTypeLabels: Record<ReportType, { en: string; ar: string }> = {
  REVENUE: { en: "Revenue", ar: "الإيرادات" },
  ATTENDANCE: { en: "Attendance", ar: "الحضور" },
  MEMBERS: { en: "Members", ar: "الأعضاء" },
  CHURN: { en: "Churn", ar: "التسرب" },
  LTV: { en: "Lifetime Value", ar: "القيمة الدائمة" },
  RETENTION_COHORT: { en: "Retention Cohort", ar: "مجموعات الاحتفاظ" },
  SUBSCRIPTIONS: { en: "Subscriptions", ar: "الاشتراكات" },
  CLASSES: { en: "Classes", ar: "الحصص" },
  TRAINERS: { en: "Trainers", ar: "المدربين" },
};

const frequencyLabels: Record<ReportFrequency, { en: string; ar: string }> = {
  DAILY: { en: "Daily", ar: "يومي" },
  WEEKLY: { en: "Weekly", ar: "أسبوعي" },
  MONTHLY: { en: "Monthly", ar: "شهري" },
};

export default function ScheduledReportsPage() {
  const locale = useLocale();
  const { data, isLoading } = useScheduledReports();
  const deleteMutation = useDeleteScheduledReport();
  const enableMutation = useEnableScheduledReport();
  const disableMutation = useDisableScheduledReport();

  const handleToggleEnabled = (report: ScheduledReport) => {
    const mutation = report.enabled ? disableMutation : enableMutation;
    mutation.mutate(report.id, {
      onSuccess: () => {
        toast.success(
          locale === "ar"
            ? report.enabled
              ? "تم تعطيل التقرير"
              : "تم تمكين التقرير"
            : report.enabled
            ? "Report disabled"
            : "Report enabled"
        );
      },
      onError: () => {
        toast.error(
          locale === "ar" ? "فشل في تحديث التقرير" : "Failed to update report"
        );
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success(
          locale === "ar" ? "تم حذف التقرير" : "Report deleted successfully"
        );
      },
      onError: () => {
        toast.error(
          locale === "ar" ? "فشل في حذف التقرير" : "Failed to delete report"
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const reports = data?.content || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {locale === "ar" ? "التقارير المجدولة" : "Scheduled Reports"}
          </h1>
          <p className="text-muted-foreground">
            {locale === "ar"
              ? "إدارة التقارير التلقائية المرسلة بالبريد الإلكتروني"
              : "Manage automated reports sent via email"}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {locale === "ar" ? "تقرير جديد" : "New Report"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {locale === "ar" ? "التقارير النشطة" : "Active Reports"}
          </CardTitle>
          <CardDescription>
            {locale === "ar"
              ? `${reports.length} تقرير مجدول`
              : `${reports.length} scheduled reports`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {locale === "ar"
                  ? "لا توجد تقارير مجدولة بعد"
                  : "No scheduled reports yet"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{locale === "ar" ? "الاسم" : "Name"}</TableHead>
                  <TableHead>{locale === "ar" ? "النوع" : "Type"}</TableHead>
                  <TableHead>{locale === "ar" ? "التكرار" : "Frequency"}</TableHead>
                  <TableHead>{locale === "ar" ? "المستلمون" : "Recipients"}</TableHead>
                  <TableHead>{locale === "ar" ? "التشغيل التالي" : "Next Run"}</TableHead>
                  <TableHead>{locale === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead className="text-right">
                    {locale === "ar" ? "الإجراءات" : "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {locale === "ar" && report.nameAr
                        ? report.nameAr
                        : report.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {locale === "ar"
                          ? reportTypeLabels[report.reportType].ar
                          : reportTypeLabels[report.reportType].en}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {locale === "ar"
                          ? frequencyLabels[report.frequency].ar
                          : frequencyLabels[report.frequency].en}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {report.recipients.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(report.nextRunAt), {
                        addSuffix: true,
                        locale: locale === "ar" ? ar : enUS,
                      })}
                    </TableCell>
                    <TableCell>
                      {report.enabled ? (
                        <Badge variant="default" className="bg-green-600">
                          {locale === "ar" ? "نشط" : "Active"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {locale === "ar" ? "معطل" : "Disabled"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleEnabled(report)}
                          disabled={
                            enableMutation.isPending || disableMutation.isPending
                          }
                        >
                          {report.enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {locale === "ar"
                                  ? "حذف التقرير المجدول"
                                  : "Delete Scheduled Report"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {locale === "ar"
                                  ? "هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء."
                                  : "Are you sure you want to delete this report? This action cannot be undone."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {locale === "ar" ? "إلغاء" : "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(report.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                {locale === "ar" ? "حذف" : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
