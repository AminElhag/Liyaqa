import type { UUID, LocalizedText } from "./api";

/**
 * User roles matching backend
 */
export type UserRole =
  // Platform roles (internal Liyaqa team)
  | "PLATFORM_ADMIN"
  | "SALES_REP"
  | "MARKETING"
  | "SUPPORT"
  // Client roles (organization users)
  | "SUPER_ADMIN"
  | "CLUB_ADMIN"
  | "STAFF"
  | "MEMBER";

/**
 * Platform roles array for type checking
 */
export const PLATFORM_ROLES: UserRole[] = [
  "PLATFORM_ADMIN",
  "SALES_REP",
  "MARKETING",
  "SUPPORT",
];

/**
 * Client roles array for type checking
 */
export const CLIENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "CLUB_ADMIN",
  "STAFF",
  "MEMBER",
];

/**
 * Check if a role is a platform role
 */
export function isPlatformRole(role: UserRole): boolean {
  return PLATFORM_ROLES.includes(role);
}

/**
 * Check if a role is a client role
 */
export function isClientRole(role: UserRole): boolean {
  return CLIENT_ROLES.includes(role);
}

/**
 * User status enum matching backend
 */
export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING_VERIFICATION";

/**
 * User entity matching backend UserResponse
 */
export interface User {
  id: UUID;
  email: string;
  role: UserRole;
  displayName: LocalizedText;
  status: UserStatus;
  tenantId?: UUID;
  organizationId?: UUID;
  memberId?: UUID;
  isPlatformUser?: boolean;
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Login request.
 * tenantId is optional when accessed via subdomain.
 */
export interface LoginRequest {
  email: string;
  password: string;
  /** Optional when subdomain-based login is used */
  tenantId?: UUID;
}

/**
 * Login response
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  tenantId?: UUID;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Platform login request (no tenantId required)
 */
export interface PlatformLoginRequest {
  email: string;
  password: string;
}

/**
 * Response from tenant-info endpoint.
 * Used by frontend to determine if tenant ID field should be shown on login.
 */
export interface TenantInfoResponse {
  /** True if tenant was resolved from subdomain */
  resolved: boolean;
  /** The resolved tenant (club) ID, if resolved is true */
  tenantId?: UUID;
  /** The club name (bilingual) */
  clubName?: LocalizedText;
  /** The subdomain slug used to resolve the tenant */
  slug?: string;
}
