"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { AuditLog, AuditAction } from "@/types/audit";

// Action color mapping
const actionColors: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  STATUS_CHANGE: "bg-purple-100 text-purple-800",
  LOGIN: "bg-teal-100 text-teal-800",
  LOGOUT: "bg-slate-100 text-slate-800",
  PASSWORD_CHANGE: "bg-amber-100 text-amber-800",
  PASSWORD_RESET: "bg-amber-100 text-amber-800",
  CHECK_IN: "bg-emerald-100 text-emerald-800",
  CHECK_OUT: "bg-cyan-100 text-cyan-800",
  BOOKING_CREATE: "bg-indigo-100 text-indigo-800",
  BOOKING_CANCEL: "bg-orange-100 text-orange-800",
  PAYMENT: "bg-green-100 text-green-800",
  INVOICE_ISSUE: "bg-blue-100 text-blue-800",
  SUBSCRIPTION_ACTIVATE: "bg-green-100 text-green-800",
  SUBSCRIPTION_FREEZE: "bg-sky-100 text-sky-800",
  SUBSCRIPTION_CANCEL: "bg-red-100 text-red-800",
  SUBSCRIPTION_RENEW: "bg-emerald-100 text-emerald-800",
  ACCESS_DENIED: "bg-red-100 text-red-800",
  RATE_LIMITED: "bg-yellow-100 text-yellow-800",
  IMPERSONATE_START: "bg-violet-100 text-violet-800",
  IMPERSONATE_END: "bg-violet-100 text-violet-800",
};

// Action labels
const actionLabels: Record<AuditAction, { en: string; ar: string }> = {
  CREATE: { en: "Created", ar: "إنشاء" },
  UPDATE: { en: "Updated", ar: "تحديث" },
  DELETE: { en: "Deleted", ar: "حذف" },
  STATUS_CHANGE: { en: "Status Changed", ar: "تغيير الحالة" },
  LOGIN: { en: "Login", ar: "تسجيل دخول" },
  LOGOUT: { en: "Logout", ar: "تسجيل خروج" },
  PASSWORD_CHANGE: { en: "Password Changed", ar: "تغيير كلمة المرور" },
  PASSWORD_RESET: { en: "Password Reset", ar: "إعادة تعيين كلمة المرور" },
  CHECK_IN: { en: "Check In", ar: "تسجيل حضور" },
  CHECK_OUT: { en: "Check Out", ar: "تسجيل مغادرة" },
  BOOKING_CREATE: { en: "Booking Created", ar: "إنشاء حجز" },
  BOOKING_CANCEL: { en: "Booking Cancelled", ar: "إلغاء حجز" },
  PAYMENT: { en: "Payment", ar: "دفعة" },
  INVOICE_ISSUE: { en: "Invoice Issued", ar: "إصدار فاتورة" },
  SUBSCRIPTION_ACTIVATE: { en: "Subscription Activated", ar: "تفعيل اشتراك" },
  SUBSCRIPTION_FREEZE: { en: "Subscription Frozen", ar: "تجميد اشتراك" },
  SUBSCRIPTION_CANCEL: { en: "Subscription Cancelled", ar: "إلغاء اشتراك" },
  SUBSCRIPTION_RENEW: { en: "Subscription Renewed", ar: "تجديد اشتراك" },
  ACCESS_DENIED: { en: "Access Denied", ar: "رفض الوصول" },
  RATE_LIMITED: { en: "Rate Limited", ar: "تقييد المعدل" },
  IMPERSONATE_START: { en: "Impersonation Started", ar: "بدء الانتحال" },
  IMPERSONATE_END: { en: "Impersonation Ended", ar: "انتهاء الانتحال" },
};

interface GetColumnsOptions {
  locale: string;
}

export function getAuditColumns({
  locale,
}: GetColumnsOptions): ColumnDef<AuditLog>[] {
  return [
    {
      accessorKey: "createdAt",
      header: locale === "ar" ? "التاريخ والوقت" : "Date & Time",
      cell: ({ row }) => (
        <div className="text-sm">
          <p className="font-medium">
            {formatDate(row.original.createdAt, locale)}
          </p>
          <p className="text-muted-foreground">
            {formatTime(row.original.createdAt, locale)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "action",
      header: locale === "ar" ? "الإجراء" : "Action",
      cell: ({ row }) => {
        const action = row.original.action;
        return (
          <Badge className={actionColors[action]}>
            {actionLabels[action][locale === "ar" ? "ar" : "en"]}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entityType",
      header: locale === "ar" ? "النوع" : "Entity Type",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.entityType}</span>
      ),
    },
    {
      accessorKey: "userEmail",
      header: locale === "ar" ? "المستخدم" : "User",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.userEmail || "-"}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: locale === "ar" ? "الوصف" : "Description",
      cell: ({ row }) => (
        <p className="text-sm max-w-[300px] truncate">
          {row.original.description || "-"}
        </p>
      ),
    },
  ];
}
