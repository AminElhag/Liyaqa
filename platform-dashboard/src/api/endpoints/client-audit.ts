import api from '@/api/client'
import type { PageResponse } from '@/types'

/**
 * Audit log action types (matching backend AuditAction enum).
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'STATUS_CHANGE'
  | 'ROLE_CHANGE'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'SUBSCRIPTION_CREATE'
  | 'SUBSCRIPTION_CANCEL'
  | 'SUBSCRIPTION_RENEW'
  | 'SUBSCRIPTION_FREEZE'
  | 'SUBSCRIPTION_UNFREEZE'
  | 'INVOICE_ISSUE'
  | 'INVOICE_PAY'
  | 'BOOKING_CREATE'
  | 'BOOKING_CANCEL'
  | 'CLASS_SCHEDULE'
  | 'NOTIFICATION_SEND'

/**
 * Audit log entry.
 */
export interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  userId?: string
  userName?: string
  userEmail?: string
  tenantId?: string
  organizationId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

/**
 * Query parameters for fetching audit logs.
 */
export interface AuditLogQueryParams {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  action?: AuditAction
  startDate?: string
  endDate?: string
}

/**
 * Get audit logs for a client organization.
 */
export async function getClientAuditLogs(
  organizationId: string,
  queryParams: AuditLogQueryParams = {},
): Promise<PageResponse<AuditLog>> {
  const params: Record<string, string | number> = {}
  if (queryParams.page !== undefined) params.page = queryParams.page
  if (queryParams.size !== undefined) params.size = queryParams.size
  if (queryParams.sortBy) params.sortBy = queryParams.sortBy
  if (queryParams.sortDirection) params.sortDirection = queryParams.sortDirection
  if (queryParams.action) params.action = queryParams.action
  if (queryParams.startDate) params.startDate = queryParams.startDate
  if (queryParams.endDate) params.endDate = queryParams.endDate

  return api
    .get<PageResponse<AuditLog>>(`api/audit/organization/${organizationId}`, { params })
    .then((r) => r.data)
}

/**
 * Audit action display configurations.
 */
export const AUDIT_ACTION_CONFIG: Record<
  AuditAction,
  { labelEn: string; labelAr: string; color: string; icon: string }
> = {
  CREATE: { labelEn: 'Created', labelAr: '\u0625\u0646\u0634\u0627\u0621', color: 'emerald', icon: 'Plus' },
  UPDATE: { labelEn: 'Updated', labelAr: '\u062A\u062D\u062F\u064A\u062B', color: 'blue', icon: 'Pencil' },
  DELETE: { labelEn: 'Deleted', labelAr: '\u062D\u0630\u0641', color: 'red', icon: 'Trash2' },
  LOGIN: { labelEn: 'Login', labelAr: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644', color: 'green', icon: 'LogIn' },
  LOGOUT: { labelEn: 'Logout', labelAr: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C', color: 'slate', icon: 'LogOut' },
  PASSWORD_CHANGE: { labelEn: 'Password Changed', labelAr: '\u062A\u063A\u064A\u064A\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631', color: 'amber', icon: 'Key' },
  PASSWORD_RESET: { labelEn: 'Password Reset', labelAr: '\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631', color: 'orange', icon: 'KeyRound' },
  STATUS_CHANGE: { labelEn: 'Status Changed', labelAr: '\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062D\u0627\u0644\u0629', color: 'purple', icon: 'RefreshCw' },
  ROLE_CHANGE: { labelEn: 'Role Changed', labelAr: '\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062F\u0648\u0631', color: 'indigo', icon: 'Shield' },
  CHECK_IN: { labelEn: 'Check In', labelAr: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062D\u0636\u0648\u0631', color: 'teal', icon: 'UserCheck' },
  CHECK_OUT: { labelEn: 'Check Out', labelAr: '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0627\u0646\u0635\u0631\u0627\u0641', color: 'cyan', icon: 'UserMinus' },
  SUBSCRIPTION_CREATE: { labelEn: 'Subscription Created', labelAr: '\u0625\u0646\u0634\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643', color: 'emerald', icon: 'CreditCard' },
  SUBSCRIPTION_CANCEL: { labelEn: 'Subscription Cancelled', labelAr: '\u0625\u0644\u063A\u0627\u0621 \u0627\u0634\u062A\u0631\u0627\u0643', color: 'red', icon: 'XCircle' },
  SUBSCRIPTION_RENEW: { labelEn: 'Subscription Renewed', labelAr: '\u062A\u062C\u062F\u064A\u062F \u0627\u0634\u062A\u0631\u0627\u0643', color: 'green', icon: 'RefreshCcw' },
  SUBSCRIPTION_FREEZE: { labelEn: 'Subscription Frozen', labelAr: '\u062A\u062C\u0645\u064A\u062F \u0627\u0634\u062A\u0631\u0627\u0643', color: 'sky', icon: 'Snowflake' },
  SUBSCRIPTION_UNFREEZE: { labelEn: 'Subscription Unfrozen', labelAr: '\u0625\u0644\u063A\u0627\u0621 \u062A\u062C\u0645\u064A\u062F \u0627\u0634\u062A\u0631\u0627\u0643', color: 'amber', icon: 'Sun' },
  INVOICE_ISSUE: { labelEn: 'Invoice Issued', labelAr: '\u0625\u0635\u062F\u0627\u0631 \u0641\u0627\u062A\u0648\u0631\u0629', color: 'blue', icon: 'FileText' },
  INVOICE_PAY: { labelEn: 'Invoice Paid', labelAr: '\u062F\u0641\u0639 \u0641\u0627\u062A\u0648\u0631\u0629', color: 'green', icon: 'CheckCircle' },
  BOOKING_CREATE: { labelEn: 'Booking Created', labelAr: '\u0625\u0646\u0634\u0627\u0621 \u062D\u062C\u0632', color: 'violet', icon: 'Calendar' },
  BOOKING_CANCEL: { labelEn: 'Booking Cancelled', labelAr: '\u0625\u0644\u063A\u0627\u0621 \u062D\u062C\u0632', color: 'rose', icon: 'CalendarX' },
  CLASS_SCHEDULE: { labelEn: 'Class Scheduled', labelAr: '\u062C\u062F\u0648\u0644\u0629 \u0641\u0635\u0644', color: 'fuchsia', icon: 'CalendarPlus' },
  NOTIFICATION_SEND: { labelEn: 'Notification Sent', labelAr: '\u0625\u0631\u0633\u0627\u0644 \u0625\u0634\u0639\u0627\u0631', color: 'pink', icon: 'Bell' },
}

/**
 * Get localized label for an audit action.
 */
export function getAuditActionLabel(action: AuditAction, locale: string): string {
  const config = AUDIT_ACTION_CONFIG[action]
  return locale === 'ar' ? config.labelAr : config.labelEn
}

/**
 * Get color for an audit action.
 */
export function getAuditActionColor(action: AuditAction): string {
  return AUDIT_ACTION_CONFIG[action]?.color ?? 'slate'
}

/**
 * Get icon name for an audit action.
 */
export function getAuditActionIcon(action: AuditAction): string {
  return AUDIT_ACTION_CONFIG[action]?.icon ?? 'Activity'
}
