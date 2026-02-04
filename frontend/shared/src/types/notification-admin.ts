import type { UUID, LocalizedText } from "./api";

// Enums matching backend
export type NotificationType =
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_EXPIRING_7_DAYS"
  | "SUBSCRIPTION_EXPIRING_3_DAYS"
  | "SUBSCRIPTION_EXPIRING_1_DAY"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_FROZEN"
  | "SUBSCRIPTION_UNFROZEN"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_RENEWED"
  | "LOW_CLASSES_REMAINING"
  | "INVOICE_CREATED"
  | "INVOICE_DUE_SOON"
  | "INVOICE_OVERDUE"
  | "INVOICE_PAID"
  | "CLASS_BOOKING_CONFIRMED"
  | "CLASS_BOOKING_CANCELLED"
  | "CLASS_BOOKING_REMINDER_24H"
  | "CLASS_BOOKING_REMINDER_1H"
  | "CLASS_WAITLIST_PROMOTED"
  | "CLASS_SESSION_CANCELLED"
  | "CHECK_IN_CONFIRMATION"
  | "WELCOME"
  | "PASSWORD_RESET"
  | "PASSWORD_CHANGED"
  | "ACCOUNT_LOCKED"
  | "MEMBER_SUSPENDED"
  | "MEMBER_REACTIVATED"
  | "CUSTOM";

export type NotificationChannel = "EMAIL" | "SMS" | "PUSH" | "IN_APP";
export type NotificationStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "READ";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Notification {
  id: UUID;
  memberId: UUID;
  notificationType: NotificationType;
  channel: NotificationChannel;
  subject?: LocalizedText;
  body: LocalizedText;
  status: NotificationStatus;
  priority: NotificationPriority;
  recipientEmail?: string;
  recipientPhone?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  failureReason?: string;
  referenceId?: UUID;
  referenceType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationRequest {
  memberId: UUID;
  notificationType: NotificationType;
  channel: NotificationChannel;
  subjectEn?: string;
  subjectAr?: string;
  bodyEn: string;
  bodyAr?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  priority?: NotificationPriority;
  scheduledAt?: string;
  referenceId?: UUID;
  referenceType?: string;
}

export interface NotificationQueryParams {
  memberId?: UUID;
  status?: NotificationStatus;
  channel?: NotificationChannel;
  page?: number;
  size?: number;
}
