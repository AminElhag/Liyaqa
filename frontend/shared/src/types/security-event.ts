import type { UUID } from "./api";

// ===== Enums matching backend =====

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "MFA_ENABLED"
  | "MFA_DISABLED"
  | "SESSION_TIMEOUT"
  | "SESSION_REVOKED"
  | "PERMISSION_DENIED"
  | "RATE_LIMITED"
  | "SUSPICIOUS_ACTIVITY"
  | "BRUTE_FORCE_ATTEMPT"
  | "DATA_EXPORT"
  | "BULK_DELETE"
  | "ADMIN_ACTION"
  | "CONFIGURATION_CHANGE"
  | "API_KEY_CREATED"
  | "API_KEY_REVOKED"
  | "PII_ACCESS"
  | "SENSITIVE_DATA_ACCESS"
  | "DATA_BREACH_SUSPECTED";

export type SecuritySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityOutcome = "SUCCESS" | "FAILURE" | "BLOCKED" | "UNKNOWN";

// ===== Security Event =====

export interface SecurityEvent {
  id: UUID;
  tenantId: UUID;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  sourceIp?: string;
  userId?: UUID;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  outcome?: SecurityOutcome;
  details?: Record<string, unknown>;
  riskScore: number;
  investigated: boolean;
  investigatedBy?: UUID;
  investigatedAt?: string;
  investigationNotes?: string;
  createdAt: string;
}

// ===== Stats =====

export interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  highSeverityEvents: number;
  uninvestigatedEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsByOutcome: Record<SecurityOutcome, number>;
  recentFailedLogins: number;
  recentRateLimited: number;
}

// ===== Request DTOs =====

export interface InvestigateEventRequest {
  notes?: string;
}

// ===== Query Params =====

export interface SecurityEventParams {
  eventType?: SecurityEventType;
  severity?: SecuritySeverity;
  userId?: UUID;
  startDate?: string;
  endDate?: string;
  investigated?: boolean;
  page?: number;
  size?: number;
}
