import type { UUID, LocalizedText, LocalizedAddress, TaxableFee } from "../api";
import type { ClubStatus } from "../organization";

// ============================================
// Club Detail Types
// ============================================

/**
 * Club statistics for platform view.
 */
export interface ClubStats {
  totalUsers: number;
  activeUsers: number;
  totalEmployees: number;
  activeEmployees: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  totalLocations?: number;
}

/**
 * Club detail response for platform admin.
 */
export interface PlatformClubDetail {
  id: UUID;
  organizationId: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  slug?: string;
  status: ClubStatus;
  createdAt: string;
  updatedAt: string;
  stats: ClubStats;
}

// ============================================
// Club User Types
// ============================================

export type UserRole = "SUPER_ADMIN" | "CLUB_ADMIN" | "STAFF" | "TRAINER" | "MEMBER" |
  "PLATFORM_SUPER_ADMIN" | "PLATFORM_ADMIN" | "ACCOUNT_MANAGER" |
  "SUPPORT_LEAD" | "SUPPORT_AGENT" | "PLATFORM_VIEWER" |
  "SALES_REP" | "SUPPORT_REP" | "MARKETING";

export type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED" | "PENDING_VERIFICATION";

/**
 * User in a club.
 */
export interface ClubUser {
  id: UUID;
  email: string;
  displayName: LocalizedText;
  role: UserRole;
  status: UserStatus;
  memberId?: UUID;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User statistics for a club.
 */
export interface ClubUserStats {
  total: number;
  active: number;
  inactive: number;
  locked: number;
  byRole: Record<UserRole, number>;
}

// ============================================
// Club Employee Types
// ============================================

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "PROBATION" | "TERMINATED";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

/**
 * Employee in a club.
 */
export interface ClubEmployee {
  id: UUID;
  userId: UUID;
  email?: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  departmentId?: UUID;
  jobTitleId?: UUID;
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Employee statistics for a club.
 */
export interface ClubEmployeeStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  byEmploymentType: Record<EmploymentType, number>;
}

// ============================================
// Club Subscription Types (Member Subscriptions)
// ============================================

export type MemberSubscriptionStatus =
  "ACTIVE" | "PENDING_PAYMENT" | "FROZEN" | "CANCELLED" | "EXPIRED";

/**
 * Member subscription in a club.
 */
export interface ClubSubscription {
  id: UUID;
  memberId: UUID;
  planId: UUID;
  status: MemberSubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  classesRemaining?: number;
  daysRemaining: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Subscription statistics for a club.
 */
export interface ClubSubscriptionStats {
  total: number;
  active: number;
  frozen: number;
  expired: number;
  cancelled: number;
  pendingPayment: number;
}

// ============================================
// Club Audit Log Types
// ============================================

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "LOGIN"
  | "LOGOUT"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "BOOKING_CREATE"
  | "BOOKING_CANCEL"
  | "PAYMENT"
  | "INVOICE_ISSUE"
  | "SUBSCRIPTION_ACTIVATE"
  | "SUBSCRIPTION_FREEZE"
  | "SUBSCRIPTION_CANCEL"
  | "SUBSCRIPTION_RENEW"
  | "ACCESS_DENIED"
  | "RATE_LIMITED"
  | "IMPERSONATE_START"
  | "IMPERSONATE_END";

/**
 * Audit log entry for a club.
 */
export interface ClubAuditLog {
  id: UUID;
  action: AuditAction;
  entityType: string;
  entityId: UUID;
  userId?: UUID;
  userEmail?: string;
  description?: string;
  ipAddress?: string;
  createdAt: string;
}

// ============================================
// Request Types
// ============================================

/**
 * Reset password request.
 */
export interface ResetPasswordRequest {
  newPassword: string;
}

// ============================================
// Create Club User Request
// ============================================

export interface CreateClubUserRequest {
  email: string;
  password: string;
  displayNameEn: string;
  displayNameAr?: string;
  role: UserRole;
}

// ============================================
// Update Club User Request
// ============================================

export interface UpdateClubUserRequest {
  displayNameEn?: string;
  displayNameAr?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ============================================
// Query Params Types
// ============================================

export interface ClubDetailQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface ClubAuditLogQueryParams extends ClubDetailQueryParams {
  action?: AuditAction;
}

// ============================================
// Club Location Types
// ============================================

export type LocationStatus = "ACTIVE" | "TEMPORARILY_CLOSED" | "PERMANENTLY_CLOSED";

export type GenderPolicy = "MIXED" | "MALE_ONLY" | "FEMALE_ONLY" | "TIME_BASED";

/**
 * Location in a club.
 */
export interface ClubLocation {
  id: UUID;
  clubId: UUID;
  name: LocalizedText;
  address?: LocalizedAddress;
  phone?: string;
  email?: string;
  status: LocationStatus;
  genderPolicy: GenderPolicy;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Club Membership Plan Types
// ============================================

export type BillingPeriod =
  | "DAILY"
  | "WEEKLY"
  | "BIWEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "YEARLY"
  | "ONE_TIME";

/**
 * Membership plan in a club.
 */
export interface ClubMembershipPlan {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  membershipFee: TaxableFee;
  billingPeriod: BillingPeriod;
  durationDays?: number;
  isActive: boolean;
  subscriberCount: number;
  createdAt: string;
}

// ============================================
// Update Club Types
// ============================================

/**
 * Request to update club basic info.
 */
export interface UpdateClubRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}
