"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Loading } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import {
  usePTSessions,
  useConfirmPTSession,
  useCancelPTSession,
  useCompletePTSession,
  useMarkPTSessionNoShow,
} from "@/queries/use-pt-sessions";
import { getPTSessionColumns } from "@/components/admin/pt-session-columns";
import type { PTSessionStatus, PTSessionSummary } from "@/types/pt-session";

export default function PTSessionsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PTSessionStatus | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch PT sessions
  const { data, isLoading, error } = usePTSessions({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    startDate: dateFilter || undefined,
    endDate: dateFilter || undefined,
    page,
    size: pageSize,
  });

  // Mutations
  const confirmSession = useConfirmPTSession();
  const cancelSession = useCancelPTSession();
  const completeSession = useCompletePTSession();
  const markNoShow = useMarkPTSessionNoShow();

  const texts = {
    title: locale === "ar" ? "جلسات التدريب الشخصي" : "Personal Training Sessions",
    description: locale === "ar" ? "إدارة جلسات التدريب الشخصي" : "Manage personal training sessions",
    search: locale === "ar" ? "البحث..." : "Search...",
    status: locale === "ar" ? "الحالة" : "Status",
    date: locale === "ar" ? "التاريخ" : "Date",
    all: locale === "ar" ? "الكل" : "All",
    requested: locale === "ar" ? "مطلوب" : "Requested",
    confirmed: locale === "ar" ? "مؤكد" : "Confirmed",
    inProgress: locale === "ar" ? "قيد التنفيذ" : "In Progress",
    completed: locale === "ar" ? "مكتمل" : "Completed",
    cancelled: locale === "ar" ? "ملغي" : "Cancelled",
    noShow: locale === "ar" ? "لم يحضر" : "No Show",
    error: locale === "ar" ? "حدث خطأ أثناء تحميل الجلسات" : "Error loading sessions",
    // Stats
    totalSessions: locale === "ar" ? "إجمالي الجلسات" : "Total Sessions",
    pendingRequests: locale === "ar" ? "طلبات معلقة" : "Pending Requests",
    confirmedToday: locale === "ar" ? "مؤكدة اليوم" : "Confirmed Today",
    completedThisWeek: locale === "ar" ? "مكتملة هذا الأسبوع" : "Completed This Week",
    // Toast
    confirmedSuccess: locale === "ar" ? "تم تأكيد الجلسة بنجاح" : "Session confirmed successfully",
    cancelledSuccess: locale === "ar" ? "تم إلغاء الجلسة بنجاح" : "Session cancelled successfully",
    completedSuccess: locale === "ar" ? "تم إكمال الجلسة بنجاح" : "Session completed successfully",
    noShowSuccess: locale === "ar" ? "تم تسجيل عدم الحضور" : "No-show recorded successfully",
    actionError: locale === "ar" ? "حدث خطأ أثناء تنفيذ العملية" : "Error performing action",
  };

  // Calculate stats from data
  const stats = {
    total: data?.totalElements || 0,
    pending: data?.content?.filter((s) => s.status === "REQUESTED").length || 0,
    confirmed: data?.content?.filter((s) => s.status === "CONFIRMED").length || 0,
    completed: data?.content?.filter((s) => s.status === "COMPLETED").length || 0,
  };

  // Handlers
  const handleView = (session: PTSessionSummary) => {
    router.push(`/${locale}/pt-sessions/${session.id}`);
  };

  const handleConfirm = (session: PTSessionSummary) => {
    confirmSession.mutate(session.id, {
      onSuccess: () => toast({ title: texts.confirmedSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  const handleCancel = (session: PTSessionSummary) => {
    cancelSession.mutate(
      { id: session.id, data: { reason: "Cancelled by admin" } },
      {
        onSuccess: () => toast({ title: texts.cancelledSuccess }),
        onError: () => toast({ title: texts.actionError, variant: "destructive" }),
      }
    );
  };

  const handleComplete = (session: PTSessionSummary) => {
    completeSession.mutate(
      { id: session.id },
      {
        onSuccess: () => toast({ title: texts.completedSuccess }),
        onError: () => toast({ title: texts.actionError, variant: "destructive" }),
      }
    );
  };

  const handleNoShow = (session: PTSessionSummary) => {
    markNoShow.mutate(session.id, {
      onSuccess: () => toast({ title: texts.noShowSuccess }),
      onError: () => toast({ title: texts.actionError, variant: "destructive" }),
    });
  };

  // Columns
  const columns = getPTSessionColumns({
    locale,
    onView: handleView,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
    onComplete: handleComplete,
    onNoShow: handleNoShow,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">{texts.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.totalSessions}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.pendingRequests}</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.confirmedToday}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{texts.completedThisWeek}</CardTitle>
            <Users className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={texts.search}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="ps-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as PTSessionStatus | "ALL");
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={texts.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="REQUESTED">{texts.requested}</SelectItem>
                  <SelectItem value="CONFIRMED">{texts.confirmed}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{texts.inProgress}</SelectItem>
                  <SelectItem value="COMPLETED">{texts.completed}</SelectItem>
                  <SelectItem value="CANCELLED">{texts.cancelled}</SelectItem>
                  <SelectItem value="NO_SHOW">{texts.noShow}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
                className="w-[180px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.content || []}
            pageCount={data?.totalPages || 0}
            pageIndex={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
