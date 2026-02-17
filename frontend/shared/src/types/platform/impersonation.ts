import type { UUID } from "../api";

/**
 * Impersonation session status
 */
export type ImpersonationSessionStatus = "ACTIVE" | "ENDED" | "EXPIRED" | "FORCE_ENDED";

/**
 * Impersonation session response
 */
export interface ImpersonationSessionResponse {
  id: UUID;
  platformUserId: UUID;
  platformUserName: string;
  platformUserEmail: string;
  targetUserId: UUID;
  targetUserName: string;
  targetUserEmail: string;
  targetUserRole: string;
  tenantId: UUID;
  tenantName?: string;
  status: ImpersonationSessionStatus;
  reason?: string;
  startedAt: string;
  endedAt?: string;
  expiresAt: string;
}

/**
 * Active sessions response
 */
export interface ActiveSessionsResponse {
  sessions: ImpersonationSessionResponse[];
  totalActive: number;
}

/**
 * Start impersonation request
 */
export interface StartImpersonationRequest {
  targetUserId: UUID;
  tenantId: UUID;
  reason?: string;
  durationMinutes?: number;
}

/**
 * Impersonation history filters
 */
export interface ImpersonationFilters {
  platformUserId?: UUID;
  targetUserId?: UUID;
  tenantId?: UUID;
  status?: ImpersonationSessionStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

/**
 * Session status config
 */
export const IMPERSONATION_STATUS_CONFIG: Record<
  ImpersonationSessionStatus,
  { labelEn: string; labelAr: string; color: string }
> = {
  ACTIVE: {
    labelEn: "Active",
    labelAr: "نشط",
    color: "text-green-600 dark:text-green-400",
  },
  ENDED: {
    labelEn: "Ended",
    labelAr: "منتهي",
    color: "text-gray-600 dark:text-gray-400",
  },
  EXPIRED: {
    labelEn: "Expired",
    labelAr: "منتهي الصلاحية",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  FORCE_ENDED: {
    labelEn: "Force Ended",
    labelAr: "إنهاء إجباري",
    color: "text-red-600 dark:text-red-400",
  },
};
