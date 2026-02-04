import { api } from "../client";
import type { PageResponse } from "../../../types/api";

/**
 * Audit log action types (matching backend AuditAction enum)
 */
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "STATUS_CHANGE"
  | "ROLE_CHANGE"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "SUBSCRIPTION_CREATE"
  | "SUBSCRIPTION_CANCEL"
  | "SUBSCRIPTION_RENEW"
  | "SUBSCRIPTION_FREEZE"
  | "SUBSCRIPTION_UNFREEZE"
  | "INVOICE_ISSUE"
  | "INVOICE_PAY"
  | "BOOKING_CREATE"
  | "BOOKING_CANCEL"
  | "CLASS_SCHEDULE"
  | "NOTIFICATION_SEND";

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  tenantId?: string;
  organizationId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Query parameters for fetching audit logs
 */
export interface AuditLogQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  action?: AuditAction;
  startDate?: string; // ISO date format YYYY-MM-DD
  endDate?: string; // ISO date format YYYY-MM-DD
}

/**
 * Get audit logs for a client organization
 */
export async function getClientAuditLogs(
  organizationId: string,
  params: AuditLogQueryParams = {}
): Promise<PageResponse<AuditLog>> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set("page", String(params.page));
  if (params.size !== undefined) searchParams.set("size", String(params.size));
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortDirection) searchParams.set("sortDirection", params.sortDirection);
  if (params.action) searchParams.set("action", params.action);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  return api
    .get(`api/audit/organization/${organizationId}`, { searchParams })
    .json<PageResponse<AuditLog>>();
}

/**
 * Audit action display configurations
 */
export const AUDIT_ACTION_CONFIG: Record<
  AuditAction,
  { labelEn: string; labelAr: string; color: string; icon: string }
> = {
  CREATE: { labelEn: "Created", labelAr: "إنشاء", color: "emerald", icon: "Plus" },
  UPDATE: { labelEn: "Updated", labelAr: "تحديث", color: "blue", icon: "Pencil" },
  DELETE: { labelEn: "Deleted", labelAr: "حذف", color: "red", icon: "Trash2" },
  LOGIN: { labelEn: "Login", labelAr: "تسجيل الدخول", color: "green", icon: "LogIn" },
  LOGOUT: { labelEn: "Logout", labelAr: "تسجيل الخروج", color: "slate", icon: "LogOut" },
  PASSWORD_CHANGE: { labelEn: "Password Changed", labelAr: "تغيير كلمة المرور", color: "amber", icon: "Key" },
  PASSWORD_RESET: { labelEn: "Password Reset", labelAr: "إعادة تعيين كلمة المرور", color: "orange", icon: "KeyRound" },
  STATUS_CHANGE: { labelEn: "Status Changed", labelAr: "تغيير الحالة", color: "purple", icon: "RefreshCw" },
  ROLE_CHANGE: { labelEn: "Role Changed", labelAr: "تغيير الدور", color: "indigo", icon: "Shield" },
  CHECK_IN: { labelEn: "Check In", labelAr: "تسجيل الحضور", color: "teal", icon: "UserCheck" },
  CHECK_OUT: { labelEn: "Check Out", labelAr: "تسجيل الانصراف", color: "cyan", icon: "UserMinus" },
  SUBSCRIPTION_CREATE: { labelEn: "Subscription Created", labelAr: "إنشاء اشتراك", color: "emerald", icon: "CreditCard" },
  SUBSCRIPTION_CANCEL: { labelEn: "Subscription Cancelled", labelAr: "إلغاء اشتراك", color: "red", icon: "XCircle" },
  SUBSCRIPTION_RENEW: { labelEn: "Subscription Renewed", labelAr: "تجديد اشتراك", color: "green", icon: "RefreshCcw" },
  SUBSCRIPTION_FREEZE: { labelEn: "Subscription Frozen", labelAr: "تجميد اشتراك", color: "sky", icon: "Snowflake" },
  SUBSCRIPTION_UNFREEZE: { labelEn: "Subscription Unfrozen", labelAr: "إلغاء تجميد اشتراك", color: "amber", icon: "Sun" },
  INVOICE_ISSUE: { labelEn: "Invoice Issued", labelAr: "إصدار فاتورة", color: "blue", icon: "FileText" },
  INVOICE_PAY: { labelEn: "Invoice Paid", labelAr: "دفع فاتورة", color: "green", icon: "CheckCircle" },
  BOOKING_CREATE: { labelEn: "Booking Created", labelAr: "إنشاء حجز", color: "violet", icon: "Calendar" },
  BOOKING_CANCEL: { labelEn: "Booking Cancelled", labelAr: "إلغاء حجز", color: "rose", icon: "CalendarX" },
  CLASS_SCHEDULE: { labelEn: "Class Scheduled", labelAr: "جدولة فصل", color: "fuchsia", icon: "CalendarPlus" },
  NOTIFICATION_SEND: { labelEn: "Notification Sent", labelAr: "إرسال إشعار", color: "pink", icon: "Bell" },
};

/**
 * Get localized label for an audit action
 */
export function getAuditActionLabel(action: AuditAction, locale: string): string {
  const config = AUDIT_ACTION_CONFIG[action];
  return locale === "ar" ? config.labelAr : config.labelEn;
}

/**
 * Get color for an audit action
 */
export function getAuditActionColor(action: AuditAction): string {
  return AUDIT_ACTION_CONFIG[action]?.color ?? "slate";
}

/**
 * Get icon name for an audit action
 */
export function getAuditActionIcon(action: AuditAction): string {
  return AUDIT_ACTION_CONFIG[action]?.icon ?? "Activity";
}
