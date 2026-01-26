"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MoreHorizontal, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  DataSubjectRequest,
  DSRStatus,
  DataSubjectRequestType,
  DSRPriority,
} from "@/types/data-protection";

interface GetDSRColumnsOptions {
  locale: string;
  onView?: (dsr: DataSubjectRequest) => void;
  onVerify?: (dsr: DataSubjectRequest) => void;
  onProcess?: (dsr: DataSubjectRequest) => void;
  onComplete?: (dsr: DataSubjectRequest) => void;
  onReject?: (dsr: DataSubjectRequest) => void;
}

const statusColors: Record<DSRStatus, string> = {
  RECEIVED: "bg-blue-100 text-blue-800",
  IDENTITY_VERIFICATION: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<DSRStatus, { en: string; ar: string }> = {
  RECEIVED: { en: "Received", ar: "مستلم" },
  IDENTITY_VERIFICATION: { en: "Verifying Identity", ar: "التحقق من الهوية" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد المعالجة" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  CANCELLED: { en: "Cancelled", ar: "ملغى" },
};

const typeLabels: Record<DataSubjectRequestType, { en: string; ar: string }> = {
  ACCESS: { en: "Access", ar: "الوصول" },
  RECTIFICATION: { en: "Rectification", ar: "التصحيح" },
  ERASURE: { en: "Erasure", ar: "المحو" },
  RESTRICTION: { en: "Restriction", ar: "تقييد المعالجة" },
  PORTABILITY: { en: "Portability", ar: "قابلية النقل" },
  OBJECTION: { en: "Objection", ar: "الاعتراض" },
  AUTOMATED_DECISION_OPT_OUT: { en: "Opt-Out Automated", ar: "إلغاء القرار الآلي" },
};

const priorityColors: Record<DSRPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const priorityLabels: Record<DSRPriority, { en: string; ar: string }> = {
  LOW: { en: "Low", ar: "منخفض" },
  NORMAL: { en: "Normal", ar: "عادي" },
  HIGH: { en: "High", ar: "عالي" },
  URGENT: { en: "Urgent", ar: "عاجل" },
};

export function getDSRColumns({
  locale,
  onView,
  onVerify,
  onProcess,
  onComplete,
  onReject,
}: GetDSRColumnsOptions): ColumnDef<DataSubjectRequest>[] {
  const isArabic = locale === "ar";

  return [
    {
      accessorKey: "requestNumber",
      header: isArabic ? "رقم الطلب" : "Request #",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.requestNumber}</span>
      ),
    },
    {
      accessorKey: "requestType",
      header: isArabic ? "النوع" : "Type",
      cell: ({ row }) => {
        const type = row.original.requestType;
        const label = typeLabels[type];
        return (
          <Badge variant="outline">
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "requesterName",
      header: isArabic ? "مقدم الطلب" : "Requester",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.requesterName}</p>
          <p className="text-xs text-muted-foreground">{row.original.requesterEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: isArabic ? "الحالة" : "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const label = statusLabels[status];
        return (
          <Badge className={statusColors[status]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: isArabic ? "الأولوية" : "Priority",
      cell: ({ row }) => {
        const priority = row.original.priority;
        const label = priorityLabels[priority];
        return (
          <Badge className={priorityColors[priority]}>
            {isArabic ? label.ar : label.en}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: isArabic ? "تاريخ الاستحقاق" : "Due Date",
      cell: ({ row }) => {
        const dsr = row.original;
        const isOverdue = dsr.isOverdue;
        return (
          <div className={isOverdue ? "text-red-600" : ""}>
            <p className="font-medium">{formatDate(dsr.dueDate, locale)}</p>
            {isOverdue && (
              <p className="text-xs">
                {isArabic ? "متأخر!" : "Overdue!"}
              </p>
            )}
            {!isOverdue && dsr.daysUntilDue <= 7 && dsr.daysUntilDue > 0 && (
              <p className="text-xs text-yellow-600">
                {dsr.daysUntilDue} {isArabic ? "أيام متبقية" : "days left"}
              </p>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const dsr = row.original;
        const canVerify = dsr.status === "RECEIVED" || dsr.status === "IDENTITY_VERIFICATION";
        const canProcess = dsr.status === "IDENTITY_VERIFICATION" && dsr.identityVerified;
        const canComplete = dsr.status === "IN_PROGRESS";
        const canReject = dsr.status !== "COMPLETED" && dsr.status !== "REJECTED" && dsr.status !== "CANCELLED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(dsr)}>
                {isArabic ? "عرض التفاصيل" : "View Details"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canVerify && !dsr.identityVerified && (
                <DropdownMenuItem onClick={() => onVerify?.(dsr)}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  {isArabic ? "التحقق من الهوية" : "Verify Identity"}
                </DropdownMenuItem>
              )}
              {canProcess && (
                <DropdownMenuItem onClick={() => onProcess?.(dsr)}>
                  <Clock className="h-4 w-4 mr-2" />
                  {isArabic ? "بدء المعالجة" : "Start Processing"}
                </DropdownMenuItem>
              )}
              {canComplete && (
                <DropdownMenuItem onClick={() => onComplete?.(dsr)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "إكمال الطلب" : "Complete Request"}
                </DropdownMenuItem>
              )}
              {canReject && (
                <DropdownMenuItem
                  onClick={() => onReject?.(dsr)}
                  className="text-red-600"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isArabic ? "رفض الطلب" : "Reject Request"}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
