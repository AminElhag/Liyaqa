import type { UUID, PageResponse } from "../api";

/**
 * Platform user roles for internal B2B dashboard access.
 */
export type PlatformUserRole = "PLATFORM_ADMIN" | "SALES_REP" | "SUPPORT_REP";

/**
 * Platform user account status.
 */
export type PlatformUserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

/**
 * Full platform user entity with all fields.
 */
export interface PlatformUser {
  id: UUID;
  email: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: PlatformUserRole;
  status: PlatformUserStatus;
  phoneNumber?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  createdById?: UUID;
  createdByName?: string;
}

/**
 * Summary view for platform user lists.
 */
export interface PlatformUserSummary {
  id: UUID;
  email: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: PlatformUserRole;
  status: PlatformUserStatus;
  lastLoginAt?: string;
  createdAt: string;
}

/**
 * Statistics for platform users dashboard.
 */
export interface PlatformUserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: {
    PLATFORM_ADMIN: number;
    SALES_REP: number;
    SUPPORT_REP: number;
  };
}

/**
 * Request to create a new platform user.
 */
export interface CreatePlatformUserRequest {
  email: string;
  password: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: PlatformUserRole;
  phoneNumber?: string;
}

/**
 * Request to update an existing platform user.
 */
export interface UpdatePlatformUserRequest {
  displayNameEn?: string;
  displayNameAr?: string;
  role?: PlatformUserRole;
  phoneNumber?: string;
}

/**
 * Request to change user status.
 */
export interface ChangeUserStatusRequest {
  status: PlatformUserStatus;
  reason?: string;
}

/**
 * Request to reset user password (admin-initiated).
 * Can either set a new password directly or send a reset email.
 */
export interface ResetUserPasswordRequest {
  newPassword?: string;
  sendEmail?: boolean;
}

/**
 * Query parameters for platform user list.
 */
export interface PlatformUserQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: PlatformUserStatus;
  role?: PlatformUserRole;
  search?: string;
}

/**
 * Activity log entry for a platform user.
 */
export interface PlatformUserActivity {
  id: UUID;
  userId: UUID;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/**
 * Paginated response for platform users.
 */
export type PlatformUserPage = PageResponse<PlatformUserSummary>;

/**
 * Paginated response for user activities.
 */
export type PlatformUserActivityPage = PageResponse<PlatformUserActivity>;
