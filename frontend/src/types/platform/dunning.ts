import type { UUID } from "../api";

/**
 * Dunning step status
 */
export type DunningStepStatus = "PENDING" | "SENT" | "COMPLETED" | "SKIPPED";

/**
 * Dunning sequence status
 */
export type DunningSequenceStatus =
  | "ACTIVE"
  | "RECOVERED"
  | "ESCALATED"
  | "FAILED"
  | "CANCELLED";

/**
 * Dunning step type
 */
export type DunningStepType =
  | "IN_APP_ALERT"
  | "EMAIL"
  | "SMS"
  | "FOLLOW_UP_EMAIL"
  | "WARNING_EMAIL"
  | "FINAL_NOTICE"
  | "CSM_ESCALATION"
  | "SERVICE_INTERRUPTION";

/**
 * Individual dunning step
 */
export interface DunningStep {
  day: number;
  type: DunningStepType;
  status: DunningStepStatus;
  scheduledAt: string;
  executedAt?: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

/**
 * Dunning sequence
 */
export interface DunningSequence {
  id: UUID;
  organizationId: UUID;
  organizationNameEn: string;
  organizationNameAr?: string;
  invoiceId: UUID;
  invoiceNumber: string;
  invoiceAmount: number;
  currency: string;
  status: DunningSequenceStatus;
  startedAt: string;
  recoveredAt?: string;
  escalatedAt?: string;
  failedAt?: string;
  currentStep: number;
  totalSteps: number;
  daysSinceFailure: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  attempts: number;
  assignedCsmId?: UUID;
  assignedCsmName?: string;
  steps: DunningStep[];
  notes?: string;
}

/**
 * Dunning statistics
 */
export interface DunningStatistics {
  activeSequences: number;
  recoveredThisMonth: number;
  failedThisMonth: number;
  escalatedCount: number;
  totalAtRisk: number;
  revenueAtRisk: number;
  recoveryRate: number;
  averageRecoveryDays: number;
  currency: string;
}

/**
 * Dunning filter parameters
 */
export interface DunningFilters {
  status?: DunningSequenceStatus[];
  organizationId?: UUID;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Dunning action types
 */
export type DunningActionType =
  | "MANUAL_RETRY"
  | "SEND_PAYMENT_LINK"
  | "ESCALATE_TO_CSM"
  | "PAUSE_SEQUENCE"
  | "RESUME_SEQUENCE"
  | "CANCEL_SEQUENCE"
  | "MARK_RECOVERED"
  | "ADD_NOTE";

/**
 * Default dunning timeline configuration
 */
export const DUNNING_TIMELINE: DunningStep[] = [
  {
    day: 0,
    type: "IN_APP_ALERT",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "In-App Alert",
    titleAr: "تنبيه داخلي",
    descriptionEn: "Display payment failure alert in the app",
    descriptionAr: "عرض تنبيه فشل الدفع في التطبيق",
  },
  {
    day: 1,
    type: "EMAIL",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "Initial Email + SMS",
    titleAr: "البريد الإلكتروني + رسالة نصية الأولية",
    descriptionEn: "Send payment link via email and SMS",
    descriptionAr: "إرسال رابط الدفع عبر البريد الإلكتروني والرسائل النصية",
  },
  {
    day: 3,
    type: "FOLLOW_UP_EMAIL",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "Follow-up Email",
    titleAr: "بريد المتابعة",
    descriptionEn: "We noticed an issue with your payment...",
    descriptionAr: "لاحظنا مشكلة في عملية الدفع الخاصة بك...",
  },
  {
    day: 5,
    type: "WARNING_EMAIL",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "Warning Email",
    titleAr: "بريد التحذير",
    descriptionEn: "Service interruption in 5 days",
    descriptionAr: "انقطاع الخدمة خلال 5 أيام",
  },
  {
    day: 7,
    type: "FINAL_NOTICE",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "Final Notice",
    titleAr: "الإشعار النهائي",
    descriptionEn: "Final notice before escalation",
    descriptionAr: "الإشعار الأخير قبل التصعيد",
  },
  {
    day: 7,
    type: "CSM_ESCALATION",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "CSM Escalation",
    titleAr: "تصعيد لمدير نجاح العميل",
    descriptionEn: "Escalate to Customer Success Manager",
    descriptionAr: "تصعيد إلى مدير نجاح العميل",
  },
  {
    day: 14,
    type: "SERVICE_INTERRUPTION",
    status: "PENDING",
    scheduledAt: "",
    titleEn: "Service Interruption",
    titleAr: "انقطاع الخدمة",
    descriptionEn: "Suspend service if not recovered",
    descriptionAr: "تعليق الخدمة إذا لم يتم الاسترداد",
  },
];

/**
 * Dunning status configuration
 */
export const DUNNING_STATUS_CONFIG: Record<
  DunningSequenceStatus,
  { labelEn: string; labelAr: string; color: string; bgColor: string }
> = {
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  RECOVERED: {
    labelEn: "Recovered",
    labelAr: "تم الاسترداد",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  ESCALATED: {
    labelEn: "Escalated",
    labelAr: "تم التصعيد",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  FAILED: {
    labelEn: "Failed",
    labelAr: "فشل",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  CANCELLED: {
    labelEn: "Cancelled",
    labelAr: "ملغي",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
};

/**
 * Dunning step type configuration
 */
export const DUNNING_STEP_CONFIG: Record<
  DunningStepType,
  { icon: string; color: string }
> = {
  IN_APP_ALERT: { icon: "Bell", color: "blue" },
  EMAIL: { icon: "Mail", color: "blue" },
  SMS: { icon: "MessageSquare", color: "green" },
  FOLLOW_UP_EMAIL: { icon: "MailOpen", color: "amber" },
  WARNING_EMAIL: { icon: "AlertTriangle", color: "orange" },
  FINAL_NOTICE: { icon: "AlertCircle", color: "red" },
  CSM_ESCALATION: { icon: "UserCog", color: "purple" },
  SERVICE_INTERRUPTION: { icon: "Ban", color: "red" },
};

/**
 * Get dunning severity color based on days since failure
 */
export function getDunningSeverityColor(daysSinceFailure: number): string {
  if (daysSinceFailure >= 10) return "red";
  if (daysSinceFailure >= 5) return "orange";
  if (daysSinceFailure >= 3) return "amber";
  return "yellow";
}

/**
 * Format currency amount
 */
export function formatDunningAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: currency || "SAR",
  }).format(amount);
}
