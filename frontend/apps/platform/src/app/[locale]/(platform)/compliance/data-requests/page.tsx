"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@liyaqa/shared/components/ui/select";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { cn } from "@liyaqa/shared/utils";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useDataRequests,
  useProcessDataRequest,
} from "@liyaqa/shared/queries/platform/use-compliance";
import type { DataExportRequestStatus } from "@liyaqa/shared/types/platform/compliance";

type StatusFilter = "ALL" | DataExportRequestStatus;

const STATUS_CONFIG: Record<DataExportRequestStatus, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info"; label: string; labelAr: string }> = {
  PENDING_APPROVAL: { variant: "warning", label: "Pending Approval", labelAr: "بانتظار الموافقة" },
  APPROVED: { variant: "info", label: "Approved", labelAr: "تمت الموافقة" },
  IN_PROGRESS: { variant: "info", label: "In Progress", labelAr: "قيد التنفيذ" },
  COMPLETED: { variant: "success", label: "Completed", labelAr: "مكتمل" },
  REJECTED: { variant: "destructive", label: "Rejected", labelAr: "مرفوض" },
  FAILED: { variant: "danger", label: "Failed", labelAr: "فشل" },
};

export default function DataRequestsListPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: requests, isLoading, error } = useDataRequests();
  const processRequest = useProcessDataRequest();

  const texts = {
    title: isRtl ? "طلبات تصدير البيانات" : "Data Export Requests",
    description: isRtl ? "إدارة طلبات تصدير البيانات" : "Manage data export requests",
    total: isRtl ? "الإجمالي" : "Total",
    pending: isRtl ? "بانتظار الموافقة" : "Pending",
    approved: isRtl ? "تمت الموافقة" : "Approved",
    rejected: isRtl ? "مرفوض" : "Rejected",
    filterStatus: isRtl ? "تصفية بالحالة" : "Filter by Status",
    all: isRtl ? "الكل" : "All",
    noRequests: isRtl ? "لا توجد طلبات" : "No requests found",
    loadingError: isRtl ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    requestNumber: isRtl ? "رقم الطلب" : "Request #",
    requester: isRtl ? "مقدم الطلب" : "Requester",
    email: isRtl ? "البريد الإلكتروني" : "Email",
    reason: isRtl ? "السبب" : "Reason",
    status: isRtl ? "الحالة" : "Status",
    createdAt: isRtl ? "تاريخ الإنشاء" : "Created At",
    actions: isRtl ? "الإجراءات" : "Actions",
    approve: isRtl ? "موافقة" : "Approve",
    reject: isRtl ? "رفض" : "Reject",
    view: isRtl ? "عرض" : "View",
    approveSuccess: isRtl ? "تمت الموافقة على الطلب" : "Request approved",
    rejectSuccess: isRtl ? "تم رفض الطلب" : "Request rejected",
    errorTitle: isRtl ? "خطأ" : "Error",
    inProgress: isRtl ? "قيد التنفيذ" : "In Progress",
    completed: isRtl ? "مكتمل" : "Completed",
    failed: isRtl ? "فشل" : "Failed",
    noReason: isRtl ? "-" : "-",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRtl ? "ar-SA" : "en-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (statusFilter === "ALL") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const stats = useMemo(() => {
    if (!requests) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING_APPROVAL").length,
      approved: requests.filter((r) => ["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(r.status)).length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
    };
  }, [requests]);

  const handleApprove = (id: string) => {
    processRequest.mutate(
      { id, action: "approve" },
      {
        onSuccess: () => {
          toast({ title: texts.approveSuccess });
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  const handleReject = (id: string) => {
    processRequest.mutate(
      { id, action: "reject" },
      {
        onSuccess: () => {
          toast({ title: texts.rejectSuccess });
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {texts.loadingError}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{texts.title}</h1>
        <p className="text-muted-foreground">{texts.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.total}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.pending}</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.approved}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{texts.rejected}</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={texts.filterStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{texts.all}</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">{texts.pending}</SelectItem>
                  <SelectItem value="APPROVED">{texts.approved}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{texts.inProgress}</SelectItem>
                  <SelectItem value="COMPLETED">{texts.completed}</SelectItem>
                  <SelectItem value="REJECTED">{texts.rejected}</SelectItem>
                  <SelectItem value="FAILED">{texts.failed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loading />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              {texts.noRequests}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.requestNumber}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.requester}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.email}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.reason}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.status}</th>
                    <th className="py-3 text-start text-sm font-medium text-muted-foreground">{texts.createdAt}</th>
                    <th className="py-3 text-end text-sm font-medium text-muted-foreground">{texts.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => {
                    const statusConfig = STATUS_CONFIG[request.status];
                    return (
                      <tr key={request.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 font-mono text-sm">{request.requestNumber}</td>
                        <td className="py-3 text-sm font-medium">{request.requesterName}</td>
                        <td className="py-3 text-sm text-muted-foreground">{request.requesterEmail}</td>
                        <td className="py-3 text-sm max-w-[200px] truncate">
                          {request.reason || texts.noReason}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusConfig.variant}>
                            {isRtl ? statusConfig.labelAr : statusConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3 text-sm">{formatDate(request.createdAt)}</td>
                        <td className="py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${locale}/compliance/data-requests/${request.id}`}>
                                <Eye className="me-1 h-3.5 w-3.5" />
                                {texts.view}
                              </Link>
                            </Button>
                            {request.status === "PENDING_APPROVAL" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleApprove(request.id)}
                                  disabled={processRequest.isPending}
                                >
                                  <Check className="me-1 h-3.5 w-3.5" />
                                  {texts.approve}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive/80"
                                  onClick={() => handleReject(request.id)}
                                  disabled={processRequest.isPending}
                                >
                                  <X className="me-1 h-3.5 w-3.5" />
                                  {texts.reject}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
