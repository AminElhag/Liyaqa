import type { UUID, LocalizedText, Money, TaxableFee } from "./api";

/**
 * Strict LocalizedText input (English required)
 */
export interface LocalizedTextInput {
  en: string;
  ar?: string | null;
}

/**
 * Flexible LocalizedText input for names (at least one language required)
 * Used for firstName and lastName where either English OR Arabic is acceptable
 */
export interface FlexibleLocalizedTextInput {
  en?: string | null;
  ar?: string | null;
}

/**
 * Member status
 */
export type MemberStatus = "ACTIVE" | "SUSPENDED" | "FROZEN" | "CANCELLED" | "PENDING";

/**
 * Gender
 */
export type Gender =
  | "MALE"
  | "FEMALE"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";

/**
 * Preferred language
 */
export type Language = "EN" | "AR";

/**
 * Member entity
 */
export interface Member {
  id: UUID;
  userId?: UUID;
  firstName: LocalizedText;
  lastName: LocalizedText;
  fullName: LocalizedText;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    formatted?: string;
  };
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  nationality?: string;
  nationalId?: string;
  registrationNotes?: string;
  preferredLanguage: Language;
  status: MemberStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create member request
 */
export interface CreateMemberRequest {
  firstName: FlexibleLocalizedTextInput;
  lastName: FlexibleLocalizedTextInput;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: LocalizedTextInput;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: LocalizedTextInput;
  nationality?: string;
  nationalId?: string;
  registrationNotes?: LocalizedTextInput;
  preferredLanguage?: Language;
}

/**
 * Update member request
 */
export interface UpdateMemberRequest {
  firstName?: FlexibleLocalizedTextInput;
  lastName?: FlexibleLocalizedTextInput;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: LocalizedTextInput;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: LocalizedTextInput;
  nationality?: string;
  nationalId?: string;
  registrationNotes?: LocalizedTextInput;
  preferredLanguage?: Language;
  status?: MemberStatus;
}

/**
 * Member search/filter params
 */
export interface MemberQueryParams {
  search?: string;
  status?: MemberStatus;
  joinedAfter?: string;
  joinedBefore?: string;
  page?: number;
  size?: number;
}

/**
 * Subscription status
 */
export type SubscriptionStatus =
  | "ACTIVE"
  | "FROZEN"
  | "CANCELLED"
  | "EXPIRED"
  | "PENDING"
  | "PENDING_PAYMENT";

/**
 * Subscription type
 */
export type SubscriptionType = "UNLIMITED" | "LIMITED";

/**
 * Billing period
 */
export type BillingPeriod = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

/**
 * Membership plan type
 */
export type MembershipPlanType = "RECURRING" | "CLASS_PACK" | "DAY_PASS" | "TRIAL";

/**
 * Membership plan status (tri-state lifecycle)
 */
export type MembershipPlanStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

// TaxableFee imported from ./api (not re-exported to avoid barrel conflict)

/**
 * Taxable fee request (for create/update)
 */
export interface TaxableFeeRequest {
  amount: number;
  currency?: string;
  taxRate?: number;
}

/**
 * Membership plan
 */
export interface MembershipPlan {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;

  // === PLAN TYPE & STATUS ===
  planType: MembershipPlanType;
  status: MembershipPlanStatus;

  // === DATE RESTRICTIONS ===
  availableFrom?: string;         // ISO date
  availableUntil?: string;        // ISO date
  isCurrentlyAvailable: boolean;  // computed
  hasDateRestriction: boolean;    // computed

  // === AGE RESTRICTIONS ===
  minimumAge?: number;
  maximumAge?: number;
  hasAgeRestriction: boolean;     // computed

  // === FEE STRUCTURE ===
  membershipFee: TaxableFee;
  administrationFee: TaxableFee;
  joinFee: TaxableFee;
  recurringTotal: Money;          // computed: membership + admin (gross)
  totalWithJoinFee: Money;        // computed: all fees (gross)

  // === BILLING & DURATION ===
  billingPeriod: BillingPeriod;
  durationDays?: number;
  effectiveDurationDays: number;  // computed from billing period if not set

  // === CLASSES ===
  maxClassesPerPeriod?: number;
  classLimit?: number;            // legacy alias for maxClassesPerPeriod
  hasUnlimitedClasses: boolean;   // computed
  classAccessLevel?: "UNLIMITED" | "LIMITED" | "NO_ACCESS";
  eligibleClassCategories?: string;  // comma-separated class categories

  // === FEATURES ===
  hasGuestPasses: boolean;
  guestPassesCount: number;
  hasLockerAccess: boolean;
  hasSaunaAccess: boolean;
  hasPoolAccess: boolean;
  freezeDaysAllowed: number;

  // === STATUS ===
  isActive: boolean;
  active?: boolean;               // legacy alias
  sortOrder: number;

  // === CONTRACT CONFIGURATION ===
  categoryId?: UUID;
  contractType?: string;          // MONTH_TO_MONTH, FIXED_TERM, etc.
  supportedTerms?: string[];      // MONTHLY, QUARTERLY, YEARLY, etc.
  defaultCommitmentMonths?: number;
  minimumCommitmentMonths?: number;
  defaultNoticePeriodDays?: number;
  earlyTerminationFeeType?: string; // NONE, FLAT, PRORATED, etc.
  earlyTerminationFeeValue?: number;
  coolingOffDays?: number;

  // === PT ACCESS ===
  ptAccessLevel?: "UNLIMITED" | "LIMITED" | "NO_ACCESS";
  maxPtSessionsPerPeriod?: number;
  ptSessionsIncluded?: number;

  // === CLASS PACK FIELDS ===
  sessionCount?: number;
  expiryDays?: number;

  // === TRIAL CONVERSION ===
  convertsToPlanId?: UUID;

  // === AUDIT ===
  tenantId: UUID;
  createdAt?: string;
  updatedAt?: string;

  // === BACKWARD COMPATIBILITY ===
  price: Money;                   // legacy: maps to membershipFee.amount
  type?: SubscriptionType;        // legacy: based on hasUnlimitedClasses
}

/**
 * Plan statistics
 */
export interface PlanStats {
  totalPlans: number;
  activePlans: number;
  draftPlans: number;
  archivedPlans: number;
}

/**
 * Subscription
 */
export interface Subscription {
  id: UUID;
  memberId: UUID;
  planId: UUID;
  planName?: LocalizedText;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paidAmount?: Money;
  classesRemaining?: number;
  guestPassesRemaining: number;
  freezeDaysRemaining: number;
  frozenAt?: string;
  notes?: string;
  active: boolean;
  daysRemaining: number;
  invoiceId?: UUID;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cancel subscription with reason request
 */
export type CancelReasonCategory =
  | "FINANCIAL"
  | "RELOCATION"
  | "HEALTH"
  | "DISSATISFACTION"
  | "USAGE"
  | "OTHER";

export interface CancelSubscriptionRequest {
  reason?: string;
  reasonCategory?: CancelReasonCategory;
  immediate?: boolean;
}

/**
 * Transfer subscription request
 */
export interface TransferSubscriptionRequest {
  targetMemberId: UUID;
  reason?: string;
}

/**
 * Renew subscription request
 */
export interface RenewSubscriptionRequest {
  newEndDate?: string;
  paidAmount?: number;
  paidCurrency?: string;
}

/**
 * Member activity type — matches backend ActivityType enum (38 values)
 */
export type MemberActivityType =
  // Status
  | "STATUS_CHANGED"
  // Subscription lifecycle
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_RENEWED"
  | "SUBSCRIPTION_FROZEN"
  | "SUBSCRIPTION_UNFROZEN"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_UPGRADED"
  | "SUBSCRIPTION_DOWNGRADED"
  // Profile
  | "PROFILE_UPDATED"
  | "PHOTO_UPDATED"
  | "HEALTH_INFO_UPDATED"
  | "PREFERENCES_UPDATED"
  // Financial
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "REFUND_ISSUED"
  | "WALLET_CREDITED"
  | "WALLET_DEBITED"
  | "INVOICE_CREATED"
  // Access
  | "CHECK_IN"
  | "CHECK_OUT"
  // Communication
  | "EMAIL_SENT"
  | "SMS_SENT"
  | "WHATSAPP_SENT"
  | "CALL_LOGGED"
  // Staff
  | "NOTE_ADDED"
  | "TASK_CREATED"
  | "TASK_COMPLETED"
  | "DOCUMENT_UPLOADED"
  // Contract
  | "CONTRACT_SIGNED"
  | "CONTRACT_TERMINATED"
  // Onboarding
  | "ONBOARDING_STEP_COMPLETED"
  | "ONBOARDING_COMPLETED"
  // Referral
  | "REFERRAL_MADE"
  | "REFERRAL_REWARD_EARNED"
  // Viewing
  | "PROFILE_VIEWED"
  // System
  | "SYSTEM_ACTION"
  | "MEMBER_CREATED"
  | "AGREEMENT_SIGNED";

/**
 * Member activity category for UI grouping
 */
export type MemberActivityCategory =
  | "membership"
  | "profile"
  | "financial"
  | "access"
  | "communication"
  | "staff"
  | "system";

/**
 * Member activity — matches backend MemberActivityResponse
 */
export interface MemberActivity {
  id: UUID;
  memberId: UUID;
  activityType: MemberActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  performedByUserId?: UUID;
  performedByName?: string;
  createdAt: string;
}

/**
 * Query params for member activities
 */
export interface MemberActivityQueryParams {
  types?: MemberActivityType[];
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

/**
 * Membership history event type
 */
export type MembershipHistoryEventType =
  | "CREATED"
  | "FROZEN"
  | "UNFROZEN"
  | "CANCELLED"
  | "RENEWED"
  | "TRANSFERRED_OUT"
  | "TRANSFERRED_IN"
  | "PAYMENT_COMPLETED"
  | "EDITED";

/**
 * Membership history event
 */
export interface MembershipHistoryEvent {
  id: UUID;
  subscriptionId: UUID;
  eventType: MembershipHistoryEventType;
  timestamp: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create subscription request
 */
export interface CreateSubscriptionRequest {
  memberId: UUID;
  planId: UUID;
  startDate?: string;
  autoRenew?: boolean;
  paidAmount?: number;
  paidCurrency?: string;
  notes?: string;
}
