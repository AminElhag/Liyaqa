"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@liyaqa/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@liyaqa/shared/components/ui/card";
import { Badge } from "@liyaqa/shared/components/ui/badge";
import { Textarea } from "@liyaqa/shared/components/ui/textarea";
import { Label } from "@liyaqa/shared/components/ui/label";
import { Loading } from "@liyaqa/shared/components/ui/spinner";
import { cn } from "@liyaqa/shared/utils";
import { useToast } from "@liyaqa/shared/hooks/use-toast";
import {
  useDataRequestById,
  useProcessDataRequest,
} from "@liyaqa/shared/queries/platform/use-compliance";
import type { DataExportRequestStatus } from "@liyaqa/shared/types/platform/compliance";

const STATUS_CONFIG: Record<DataExportRequestStatus, { variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info"; label: string; labelAr: string }> = {
  PENDING_APPROVAL: { variant: "warning", label: "Pending Approval", labelAr: "بانتظار الموافقة" },
  APPROVED: { variant: "info", label: "Approved", labelAr: "تمت الموافقة" },
  IN_PROGRESS: { variant: "info", label: "In Progress", labelAr: "قيد التنفيذ" },
  COMPLETED: { variant: "success", label: "Completed", labelAr: "مكتمل" },
  REJECTED: { variant: "destructive", label: "Rejected", labelAr: "مرفوض" },
  FAILED: { variant: "danger", label: "Failed", labelAr: "فشل" },
};

export default function DataRequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const locale = useLocale();
  const isRtl = locale === "ar";
  const { toast } = useToast();

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: request, isLoading, error } = useDataRequestById(requestId);
  const processRequest = useProcessDataRequest();

  const texts = {
    back: isRtl ? "العودة إلى الطلبات" : "Back to Requests",
    loading: isRtl ? "جاري التحميل..." : "Loading...",
    notFound: isRtl ? "الطلب غير موجود" : "Request not found",
    errorLoading: isRtl ? "حدث خطأ في تحميل البيانات" : "Error loading data",
    requestInfo: isRtl ? "معلومات الطلب" : "Request Information",
    requesterInfo: isRtl ? "معلومات مقدم الطلب" : "Requester Information",
    requestNumber: isRtl ? "رقم الطلب" : "Request Number",
    status: isRtl ? "الحالة" : "Status",
    requesterName: isRtl ? "اسم مقدم الطلب" : "Requester Name",
    requesterEmail: isRtl ? "البريد الإلكتروني" : "Email",
    reason: isRtl ? "سبب الطلب" : "Reason",
    noReason: isRtl ? "لم يتم تحديد سبب" : "No reason provided",
    createdAt: isRtl ? "تاريخ الإنشاء" : "Created At",
    updatedAt: isRtl ? "آخر تحديث" : "Last Updated",
    completedAt: isRtl ? "تاريخ الاكتمال" : "Completed At",
    dates: isRtl ? "التواريخ" : "Dates",
    approve: isRtl ? "موافقة" : "Approve",
    reject: isRtl ? "رفض" : "Reject",
    rejectionReason: isRtl ? "سبب الرفض" : "Rejection Reason",
    rejectionReasonPlaceholder: isRtl ? "أدخل سبب رفض الطلب..." : "Enter reason for rejecting the request...",
    submitReject: isRtl ? "تأكيد الرفض" : "Confirm Rejection",
    cancelReject: isRtl ? "إلغاء" : "Cancel",
    approveSuccess: isRtl ? "تمت الموافقة على الطلب" : "Request approved",
    rejectSuccess: isRtl ? "تم رفض الطلب" : "Request rejected",
    errorTitle: isRtl ? "خطأ" : "Error",
    notSet: isRtl ? "غير محدد" : "Not set",
    rejectedReason: isRtl ? "سبب الرفض" : "Rejection Reason",
    processActions: isRtl ? "إجراءات المعالجة" : "Process Actions",
  };

  const formatDate = (dateString: string | undefined, includeTime = false) => {
    if (!dateString) return texts.notSet;
    return new Date(dateString).toLocaleDateString(isRtl ? "ar-SA" : "en-SA", includeTime
      ? { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
      : { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const handleApprove = () => {
    processRequest.mutate(
      { id: requestId, action: "approve" },
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

  const handleReject = () => {
    processRequest.mutate(
      { id: requestId, action: "reject", reason: rejectionReason || undefined },
      {
        onSuccess: () => {
          toast({ title: texts.rejectSuccess });
          setShowRejectForm(false);
          setRejectionReason("");
        },
        onError: (err) => {
          toast({ title: texts.errorTitle, description: err.message, variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  if (error || !request) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-destructive">
          {error ? texts.errorLoading : texts.notFound}
        </CardContent>
      </Card>
    );
  }

  const statusConfig = STATUS_CONFIG[request.status];
  const isPending = request.status === "PENDING_APPROVAL";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/${locale}/compliance/data-requests`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight font-mono">
                {request.requestNumber}
              </h1>
              <Badge variant={statusConfig.variant}>
                {isRtl ? statusConfig.labelAr : statusConfig.label}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">{request.requesterName}</p>
          </div>
        </div>

        {isPending && !showRejectForm && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={processRequest.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="me-2 h-4 w-4" />
              {texts.approve}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectForm(true)}
              disabled={processRequest.isPending}
            >
              <X className="me-2 h-4 w-4" />
              {texts.reject}
            </Button>
          </div>
        )}
      </div>

      {/* Reject Form (inline) */}
      {showRejectForm && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              {texts.reject}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">{texts.rejectionReason}</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={texts.rejectionReasonPlaceholder}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processRequest.isPending}
              >
                {texts.submitReject}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
              >
                {texts.cancelReject}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{texts.requestInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.requestNumber}</p>
                <p className="font-mono font-medium">{request.requestNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.status}</p>
                <Badge variant={statusConfig.variant}>
                  {isRtl ? statusConfig.labelAr : statusConfig.label}
                </Badge>
              </div>
            </div>
            {request.reason && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.reason}</p>
                <p className="text-sm whitespace-pre-wrap">{request.reason}</p>
              </div>
            )}
            {!request.reason && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.reason}</p>
                <p className="text-sm text-muted-foreground italic">{texts.noReason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requester Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>{texts.requesterInfo}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.requesterName}</p>
                <p className="font-medium">{request.requesterName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{texts.requesterEmail}</p>
                <p className="font-medium">{request.requesterEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>{texts.dates}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.createdAt}</p>
                <p className="text-sm">{formatDate(request.createdAt, true)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.updatedAt}</p>
                <p className="text-sm">{formatDate(request.updatedAt, true)}</p>
              </div>
            </div>
            {request.completedAt && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{texts.completedAt}</p>
                <p className="text-sm text-green-600">{formatDate(request.completedAt, true)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rejection Reason Card (if rejected) */}
        {request.status === "REJECTED" && request.rejectionReason && (
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">{texts.rejectedReason}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{request.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
