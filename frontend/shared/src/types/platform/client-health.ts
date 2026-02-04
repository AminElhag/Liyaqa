import type { UUID } from "../api";

/**
 * Health alert types for client health
 */
export type ClientHealthAlertType =
  | "NO_RECENT_ACTIVITY"
  | "OPEN_TICKETS"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "SUBSCRIPTION_EXPIRING_SOON"
  | "OVERDUE_INVOICE";

/**
 * Health alert severity levels for client health
 */
export type ClientHealthAlertSeverity = "INFO" | "WARNING" | "CRITICAL";

/**
 * Individual client health alert
 */
export interface ClientHealthAlert {
  type: ClientHealthAlertType;
  message: string;
  severity: ClientHealthAlertSeverity;
}

/**
 * Client health response from API
 */
export interface ClientHealth {
  lastActiveAt?: string;
  lastLoginAt?: string;
  openTicketsCount: number;
  activeSubscriptionsCount: number;
  totalClubs: number;
  totalNotes: number;
  healthScore: number;
  alerts: ClientHealthAlert[];
}

/**
 * Health score color configurations
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return "emerald";
  if (score >= 60) return "yellow";
  if (score >= 40) return "orange";
  return "red";
}

/**
 * Health score label configurations
 */
export function getHealthScoreLabel(score: number, locale: string): string {
  if (score >= 80) return locale === "ar" ? "صحي" : "Healthy";
  if (score >= 60) return locale === "ar" ? "يحتاج انتباه" : "Attention";
  if (score >= 40) return locale === "ar" ? "في خطر" : "At Risk";
  return locale === "ar" ? "حرج" : "Critical";
}

/**
 * Client health alert type display configurations
 */
export const CLIENT_HEALTH_ALERT_CONFIG: Record<
  ClientHealthAlertType,
  { labelEn: string; labelAr: string; icon: string }
> = {
  NO_RECENT_ACTIVITY: {
    labelEn: "No Recent Activity",
    labelAr: "لا يوجد نشاط حديث",
    icon: "Clock",
  },
  OPEN_TICKETS: {
    labelEn: "Open Support Tickets",
    labelAr: "تذاكر دعم مفتوحة",
    icon: "Ticket",
  },
  NO_ACTIVE_SUBSCRIPTION: {
    labelEn: "No Active Subscription",
    labelAr: "لا يوجد اشتراك نشط",
    icon: "CreditCard",
  },
  SUBSCRIPTION_EXPIRING_SOON: {
    labelEn: "Subscription Expiring Soon",
    labelAr: "الاشتراك ينتهي قريباً",
    icon: "AlertTriangle",
  },
  OVERDUE_INVOICE: {
    labelEn: "Overdue Invoice",
    labelAr: "فاتورة متأخرة",
    icon: "FileWarning",
  },
};

/**
 * Client health alert severity color configurations
 */
export const CLIENT_SEVERITY_COLORS: Record<ClientHealthAlertSeverity, string> = {
  INFO: "blue",
  WARNING: "amber",
  CRITICAL: "red",
};

/**
 * Get localized client alert type label
 */
export function getClientAlertTypeLabel(type: ClientHealthAlertType, locale: string): string {
  const config = CLIENT_HEALTH_ALERT_CONFIG[type];
  return locale === "ar" ? config.labelAr : config.labelEn;
}
