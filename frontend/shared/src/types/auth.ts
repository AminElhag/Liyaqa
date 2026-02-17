import type { UUID, LocalizedText } from "./api";

/**
 * Account types — a user can hold multiple simultaneously.
 */
export type AccountType = "EMPLOYEE" | "TRAINER" | "MEMBER";

/**
 * Info about an available account type.
 */
export interface AccountTypeInfo {
  accountType: AccountType;
  label: string;
  labelAr: string;
}

/**
 * Response when login requires account type selection (user has multiple account types).
 */
export interface AccountTypeSelectionResponse {
  accountTypeSelectionRequired: true;
  sessionToken: string;
  availableAccountTypes: AccountTypeInfo[];
  user: User;
}

/**
 * Request to select an account type after login.
 */
export interface SelectAccountTypeRequest {
  sessionToken: string;
  accountType: AccountType;
}

/**
 * Request to switch account type while already authenticated.
 */
export interface SwitchAccountTypeRequest {
  accountType: AccountType;
}

/**
 * Type guard to check if login response requires account type selection.
 */
export function isAccountTypeSelection(
  response: LoginResponse | MfaRequiredResponse | AccountTypeSelectionResponse
): response is AccountTypeSelectionResponse {
  return (
    "accountTypeSelectionRequired" in response &&
    response.accountTypeSelectionRequired === true
  );
}

/**
 * User roles matching backend
 */
export type UserRole =
  // Platform roles (internal Liyaqa team)
  | "PLATFORM_SUPER_ADMIN"
  | "PLATFORM_ADMIN"
  | "ACCOUNT_MANAGER"
  | "SUPPORT_LEAD"
  | "SUPPORT_AGENT"
  | "PLATFORM_VIEWER"
  // Client roles (organization users)
  | "SUPER_ADMIN"
  | "CLUB_ADMIN"
  | "STAFF"
  | "MEMBER"
  | "TRAINER";

/**
 * Platform roles array for type checking
 */
export const PLATFORM_ROLES: UserRole[] = [
  "PLATFORM_SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "ACCOUNT_MANAGER",
  "SUPPORT_LEAD",
  "SUPPORT_AGENT",
  "PLATFORM_VIEWER",
];

/**
 * Client roles array for type checking
 */
export const CLIENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "CLUB_ADMIN",
  "STAFF",
  "MEMBER",
  "TRAINER",
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
  accountTypes?: AccountType[];
  activeAccountType?: AccountType;
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

/**
 * MFA required response (returned when user has MFA enabled during login)
 */
export interface MfaRequiredResponse {
  mfaRequired: boolean;
  userId: UUID;
  email: string;
  message: string;
}

/**
 * Type guard to check if login response requires MFA
 */
export function isMfaRequired(
  response: LoginResponse | MfaRequiredResponse
): response is MfaRequiredResponse {
  return "mfaRequired" in response && response.mfaRequired === true;
}

/**
 * Send passwordless login code request
 */
export interface SendCodeRequest {
  email: string;
}

/**
 * Send passwordless login code response
 */
export interface SendCodeResponse {
  email: string;
  expiresIn: number; // seconds
  message: string;
}

/**
 * Verify passwordless login code request
 */
export interface VerifyCodeRequest {
  email: string;
  code: string;
  deviceInfo?: string;
}

/**
 * Platform auth response (matches LoginResponse but for platform users)
 */
export interface PlatformAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
