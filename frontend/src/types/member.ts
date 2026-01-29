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

  // === AUDIT ===
  tenantId: UUID;
  createdAt?: string;
  updatedAt?: string;

  // === BACKWARD COMPATIBILITY ===
  price: Money;                   // legacy: maps to membershipFee.amount
  type?: SubscriptionType;        // legacy: based on hasUnlimitedClasses
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
