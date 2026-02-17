import type { UUID } from "../api";

/**
 * Facility health status
 */
export type FacilityHealthStatus = "HEALTHY" | "WARNING" | "AT_RISK" | "CRITICAL";

/**
 * Facility health response
 */
export interface FacilityHealthResponse {
  facilityId: UUID;
  facilityNameEn: string;
  facilityNameAr?: string;
  tenantId: UUID;
  tenantNameEn: string;
  tenantNameAr?: string;
  status: FacilityHealthStatus;
  healthScore: number;
  activeMembers: number;
  totalMembers: number;
  memberActivityRate: number;
  lastActivityAt?: string;
  issues: string[];
}

/**
 * Facility activity response
 */
export interface FacilityActivityResponse {
  facilityId: UUID;
  date: string;
  checkIns: number;
  bookings: number;
  newMembers: number;
  cancellations: number;
}

/**
 * At-risk facility response
 */
export interface AtRiskFacilityResponse {
  facilityId: UUID;
  facilityNameEn: string;
  facilityNameAr?: string;
  tenantId: UUID;
  tenantNameEn: string;
  tenantNameAr?: string;
  healthScore: number;
  riskFactors: string[];
  daysAtRisk: number;
  recommendedActions: string[];
}

/**
 * Facility health status config
 */
export const FACILITY_HEALTH_CONFIG: Record<
  FacilityHealthStatus,
  { labelEn: string; labelAr: string; color: string; bgColor: string }
> = {
  HEALTHY: {
    labelEn: "Healthy",
    labelAr: "سليم",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  WARNING: {
    labelEn: "Warning",
    labelAr: "تحذير",
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
  },
  AT_RISK: {
    labelEn: "At Risk",
    labelAr: "في خطر",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  CRITICAL: {
    labelEn: "Critical",
    labelAr: "حرج",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
};
