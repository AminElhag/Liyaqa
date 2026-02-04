import type { UUID, LocalizedText, Money } from "../api";
import type { BillingCycle } from "./client-plan";

/**
 * Status of a client subscription to the Liyaqa platform.
 */
export type ClientSubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

/**
 * Full client subscription response.
 */
export interface ClientSubscription {
  id: UUID;
  organizationId: UUID;
  clientPlanId: UUID;
  status: ClientSubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndsAt?: string;
  agreedPrice: Money;
  effectiveMonthlyPrice: Money;
  discountPercentage?: number;
  contractMonths: number;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  salesRepId?: UUID;
  dealId?: UUID;
  notes?: LocalizedText;

  // Calculated fields
  isActive: boolean;
  isInTrial: boolean;
  isExpired: boolean;
  remainingDays: number;
  remainingTrialDays?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified subscription response for listings.
 */
export interface ClientSubscriptionSummary {
  id: UUID;
  organizationId: UUID;
  clientPlanId: UUID;
  status: ClientSubscriptionStatus;
  startDate: string;
  endDate: string;
  agreedPrice: Money;
  remainingDays: number;
  // Optional enriched fields for display
  organizationName?: LocalizedText;
  planName?: LocalizedText;
}

/**
 * Response for subscription statistics.
 */
export interface SubscriptionStats {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  cancelled: number;
  expired: number;
}

// ============================================
// Request Types
// ============================================

export interface CreateClientSubscriptionRequest {
  organizationId: UUID;
  clientPlanId: UUID;
  agreedPriceAmount: number;
  agreedPriceCurrency?: string;
  billingCycle?: BillingCycle;
  contractMonths?: number;
  startWithTrial?: boolean;
  trialDays?: number;
  discountPercentage?: number;
  autoRenew?: boolean;
  salesRepId?: UUID;
  dealId?: UUID;
  notesEn?: string;
  notesAr?: string;
}

export interface UpdateClientSubscriptionRequest {
  agreedPriceAmount?: number;
  agreedPriceCurrency?: string;
  billingCycle?: BillingCycle;
  discountPercentage?: number;
  autoRenew?: boolean;
  notesEn?: string;
  notesAr?: string;
}

export interface ChangeSubscriptionPlanRequest {
  newPlanId: UUID;
  newAgreedPriceAmount: number;
  newAgreedPriceCurrency?: string;
  newContractMonths?: number;
}

export interface RenewSubscriptionRequest {
  newEndDate: string;
  newAgreedPriceAmount?: number;
  newAgreedPriceCurrency?: string;
}

// Query params
export interface ClientSubscriptionQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: ClientSubscriptionStatus;
  organizationId?: UUID;
}
