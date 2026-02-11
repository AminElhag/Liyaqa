import type { UUID } from "../api";

export type AnnouncementType =
  | "GENERAL"
  | "MAINTENANCE"
  | "FEATURE_UPDATE"
  | "BILLING"
  | "COMPLIANCE"
  | "URGENT";

export type AnnouncementStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export type TargetAudience = "ALL" | "SPECIFIC_TENANTS" | "BY_PLAN_TIER" | "BY_STATUS";

export type PlanTier = "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE";

export type TenantStatus = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARCHIVED";

export interface Announcement {
  id: UUID;
  title: string;
  content: string;
  type: AnnouncementType;
  status: AnnouncementStatus;
  targetAudience: TargetAudience;
  targetTenantIds: UUID[];
  targetPlanTier: PlanTier | null;
  targetStatus: TenantStatus | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  createdBy: UUID;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  targetAudience?: TargetAudience;
  targetTenantIds?: UUID[];
  targetPlanTier?: PlanTier | null;
  targetStatus?: TenantStatus | null;
  priority?: number;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  targetAudience?: TargetAudience;
  targetTenantIds?: UUID[];
  targetPlanTier?: PlanTier | null;
  targetStatus?: TenantStatus | null;
  priority?: number;
}

export interface ScheduleAnnouncementRequest {
  scheduledAt: string;
}

export interface AnnouncementQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
}
