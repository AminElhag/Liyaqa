import type { UUID } from "../api";

export type PlatformAuditAction =
  | "USER_LOGIN" | "USER_LOGOUT" | "PASSWORD_CHANGE" | "PASSWORD_RESET"
  | "TEAM_MEMBER_INVITED" | "TEAM_MEMBER_ACTIVATED" | "TEAM_ROLE_CHANGED" | "TEAM_MEMBER_DEACTIVATED"
  | "CLIENT_CREATED" | "CLIENT_ACTIVATED" | "CLIENT_SUSPENDED" | "CLIENT_ARCHIVED"
  | "SUBSCRIPTION_CREATED" | "SUBSCRIPTION_ACTIVATED" | "SUBSCRIPTION_CANCELLED" | "SUBSCRIPTION_RENEWED"
  | "DEAL_CREATED" | "DEAL_STAGE_CHANGED" | "DEAL_WON" | "DEAL_LOST"
  | "INVOICE_CREATED" | "INVOICE_PAID" | "INVOICE_VOIDED"
  | "IMPERSONATION_STARTED" | "IMPERSONATION_ENDED"
  | "API_KEY_CREATED" | "API_KEY_REVOKED" | "API_KEY_ROTATED"
  | "SETTINGS_CHANGED" | "EXPORT_REQUESTED" | "BULK_OPERATION" | "SYSTEM_EVENT";

export type PlatformAuditActorType = "PLATFORM_USER" | "SYSTEM" | "SCHEDULED_JOB";

export type PlatformAuditResourceType =
  | "PLATFORM_USER" | "CLIENT" | "SUBSCRIPTION" | "DEAL" | "INVOICE"
  | "SUPPORT_TICKET" | "API_KEY" | "IMPERSONATION_SESSION" | "SETTINGS" | "SYSTEM";

export interface PlatformAuditLogEntry {
  id: UUID;
  actorId: UUID | null;
  actorType: PlatformAuditActorType;
  actorName: string | null;
  action: PlatformAuditAction;
  resourceType: PlatformAuditResourceType;
  resourceId: UUID | null;
  tenantId: UUID | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface PlatformAuditLogFilters {
  action?: PlatformAuditAction;
  actorId?: UUID;
  resourceType?: PlatformAuditResourceType;
  tenantId?: UUID;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface AuditActionOption {
  name: string;
  displayName: string;
}

export interface AuditResourceTypeOption {
  name: string;
  displayName: string;
}
