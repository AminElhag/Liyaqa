import type { UUID, LocalizedText } from "./api";

// ============================================
// Roles
// ============================================

export type UserRole =
  | "PLATFORM_ADMIN"
  | "SALES_REP"
  | "MARKETING"
  | "SUPPORT"
  | "SUPER_ADMIN"
  | "CLUB_ADMIN"
  | "STAFF"
  | "MEMBER"
  | "TRAINER";

export type PlatformRole =
  | "PLATFORM_SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "ACCOUNT_MANAGER"
  | "SUPPORT_LEAD"
  | "SUPPORT_AGENT"
  | "PLATFORM_VIEWER";

export const PLATFORM_ROLES: UserRole[] = [
  "PLATFORM_ADMIN",
  "SALES_REP",
  "MARKETING",
  "SUPPORT",
];

export function isPlatformRole(role: UserRole): boolean {
  return PLATFORM_ROLES.includes(role);
}

// ============================================
// User
// ============================================

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING_VERIFICATION";

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

// ============================================
// Auth Requests / Responses
// ============================================

export interface SendCodeRequest {
  email: string;
}

export interface SendCodeResponse {
  email: string;
  expiresIn: number;
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  deviceInfo?: string;
}

export interface PlatformAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
