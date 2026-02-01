"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import {
  usePendingFollowUps,
  useOverdueFollowUps,
  useCompleteFollowUp,
  useLeadActivities,
} from "@/queries/use-leads";
import type { LeadActivity } from "@/types/lead";
import { LEAD_ACTIVITY_TYPE_LABELS } from "@/types/lead";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function FollowUpsPage() {
  const locale = useLocale();
  const router = useRouter();
  const isArabic = locale === "ar";
  const dateLocale = isArabic ? ar : enUS;

  const [activeTab, setActiveTab] = useState("pending");
  const [pendingPage, setPendingPage] = useState(0);
  const [overduePage, setOverduePage] = useState(0);
  const [completeDialog, setCompleteDialog] = useState<LeadActivity | null>(null);

  const { data: pendingData, isLoading: pendingLoading } = usePendingFollowUps({
    page: pendingPage,
    size: 20,
  });
  const { data: overdueData, isLoading: overdueLoading } = useOverdueFollowUps({
    page: overduePage,
    size: 20,
  });
  const completeMutation = useCompleteFollowUp();

  const handleComplete = async () => {
    if (!completeDialog) return;
    try {
      await completeMutation.mutateAsync({
        activityId: completeDialog.id,
        data: {},
      });
      toast.success(isArabic ? "تم إكمال المتابعة" : "Follow-up completed");
      setCompleteDialog(null);
    } catch {
      toast.error(isArabic ? "فشل في إكمال المتابعة" : "Failed to complete follow-up");
    }
  };

  const handleViewLead = (activity: LeadActivity) => {
    router.push(`/${locale}/leads/${activity.leadId}`);
  };

  const getFollowUpColumns = (): ColumnDef<LeadActivity>[] => [
    {
      accessorKey: "type",
      header: isArabic ? "النوع" : "Type",
      cell: ({ row }) => {
        const type = row.original.type;
        const label = LEAD_ACTIVITY_TYPE_LABELS[type];
        return (
          <Badge variant="outline">
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: isArabic ? "الملاحظات" : "Notes",
      cell: ({ row }) => {
        const notes = row.original.notes;
        return (
          <span className="text-sm line-clamp-2">
            {notes || "-"}
          </span>
        );
      },
    },
    {
      accessorKey: "followUpDate",
      header: isArabic ? "تاريخ المتابعة" : "Follow-up Date",
      cell: ({ row }) => {
        const date = row.original.followUpDate;
        if (!date) return "-";

        const isOverdue = new Date(date) < new Date();
        return (
          <div className="flex flex-col gap-1">
            <span className={isOverdue ? "text-red-600 font-medium" : ""}>
              {format(new Date(date), "PPP", { locale: dateLocale })}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(date), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "performedByUserId",
      header: isArabic ? "المسؤول" : "Assigned To",
      cell: ({ row }) => {
        const userId = row.original.performedByUserId;
        return <span className="text-sm">{userId || "-"}</span>;
      },
    },
    {
      accessorKey: "createdAt",
      header: isArabic ? "تاريخ الإنشاء" : "Created",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(date), "PP", { locale: dateLocale })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: isArabic ? "الإجراءات" : "Actions",
      cell: ({ row }) => {
        const activity = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewLead(activity)}
            >
              {isArabic ? "عرض العميل" : "View Lead"}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setCompleteDialog(activity)}
            >
              <CheckCircle className="h-3 w-3 me-1" />
              {isArabic ? "إكمال" : "Complete"}
            </Button>
          </div>
        );
      },
    },
  ];

  const pendingColumns = getFollowUpColumns();
  const overdueColumns = getFollowUpColumns();

  const pendingCount = pendingData?.totalElements ?? 0;
  const overdueCount = overdueData?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/leads`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isArabic ? "المتابعات" : "Follow-ups"}
            </h1>
            <p className="text-muted-foreground">
              {isArabic
                ? "إدارة المتابعات المجدولة والمتأخرة"
                : "Manage scheduled and overdue follow-ups"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متابعات معلقة" : "Pending Follow-ups"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "متابعات متأخرة" : "Overdue Follow-ups"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount + overdueCount}</p>
                <p className="text-sm text-muted-foreground">
                  {isArabic ? "إجمالي المتابعات" : "Total Follow-ups"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            {isArabic ? "معلقة" : "Pending"}{" "}
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ms-2">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue">
            {isArabic ? "متأخرة" : "Overdue"}{" "}
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ms-2">
                {overdueCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {isArabic ? "المتابعات المعلقة" : "Pending Follow-ups"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "المتابعات المجدولة التي لم يتم إكمالها بعد"
                  : "Scheduled follow-ups that haven't been completed yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={pendingColumns}
                data={pendingData?.content ?? []}
                isLoading={pendingLoading}
                pageCount={pendingData?.totalPages ?? 0}
                pageIndex={pendingPage}
                onPageChange={setPendingPage}
                manualPagination
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Bell className="h-5 w-5" />
                {isArabic ? "المتابعات المتأخرة" : "Overdue Follow-ups"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "المتابعات التي تجاوزت موعدها وتحتاج اهتمام فوري"
                  : "Follow-ups that are past their due date and need immediate attention"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={overdueColumns}
                data={overdueData?.content ?? []}
                isLoading={overdueLoading}
                pageCount={overdueData?.totalPages ?? 0}
                pageIndex={overduePage}
                onPageChange={setOverduePage}
                manualPagination
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Follow-up Dialog */}
      <AlertDialog open={!!completeDialog} onOpenChange={() => setCompleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArabic ? "إكمال المتابعة؟" : "Complete Follow-up?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? "هل أنت متأكد من إكمال هذه المتابعة؟ سيتم وضع علامة عليها كمكتملة."
                : "Are you sure you want to complete this follow-up? It will be marked as completed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isArabic ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              {isArabic ? "إكمال" : "Complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
