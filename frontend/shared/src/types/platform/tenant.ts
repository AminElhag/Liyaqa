import type { UUID } from "../api";

/**
 * Tenant status
 */
export type TenantStatus = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARCHIVED";

/**
 * Full tenant response — aligned with backend TenantResponse
 */
export interface TenantResponse {
  id: UUID;
  facilityName: string;
  facilityNameAr?: string;
  subdomain?: string;
  crNumber?: string;
  vatNumber?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country: string;
  status: TenantStatus;
  subscriptionPlanId?: UUID;
  dealId?: UUID;
  organizationId?: UUID;
  clubId?: UUID;
  onboardedBy?: UUID;
  onboardedAt?: string;
  deactivatedAt?: string;
  dataRetentionUntil?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tenant summary for listings — aligned with backend TenantSummaryResponse
 */
export interface TenantSummaryResponse {
  id: UUID;
  facilityName: string;
  status: TenantStatus;
  contactEmail: string;
  createdAt: string;
}

/**
 * Onboarding checklist item
 */
export interface OnboardingChecklistItem {
  step: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: UUID;
  notes?: string;
}

/**
 * Onboarding checklist response (progress summary from backend)
 */
export interface OnboardingChecklistResponse {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  items: OnboardingChecklistItem[];
}

/**
 * Data export job
 */
export interface DataExportJobResponse {
  id: UUID;
  tenantId: UUID;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  format: "JSON" | "CSV";
  requestedBy: UUID;
  startedAt?: string;
  completedAt?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
  expiresAt?: string;
  createdAt: string;
}

/**
 * Deactivation log entry
 */
export interface DeactivationLogResponse {
  id: UUID;
  tenantId: UUID;
  reason: string;
  notes?: string;
  deactivatedBy: UUID;
  previousStatus: TenantStatus;
  createdAt: string;
}

/**
 * Tenant filter parameters
 */
export interface TenantFilters {
  status?: TenantStatus;
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * Provision tenant request — aligned with backend ProvisionTenantRequest
 */
export interface ProvisionTenantRequest {
  facilityName: string;
  facilityNameAr?: string;
  subdomain?: string;
  crNumber?: string;
  vatNumber?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  subscriptionPlanId?: UUID;
  metadata?: string;
}

/**
 * Update tenant request — aligned with backend UpdateTenantRequest
 */
export interface UpdateTenantRequest {
  facilityName?: string;
  facilityNameAr?: string;
  subdomain?: string;
  crNumber?: string;
  vatNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  subscriptionPlanId?: UUID;
  metadata?: string;
}

/**
 * Tenant status config
 */
export const TENANT_STATUS_CONFIG: Record<
  TenantStatus,
  { labelEn: string; labelAr: string; color: string; bgColor: string }
> = {
  PROVISIONING: {
    labelEn: "Provisioning",
    labelAr: "جاري التجهيز",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  SUSPENDED: {
    labelEn: "Suspended",
    labelAr: "معلق",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  DEACTIVATED: {
    labelEn: "Deactivated",
    labelAr: "معطل",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
  ARCHIVED: {
    labelEn: "Archived",
    labelAr: "مؤرشف",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
  },
};
