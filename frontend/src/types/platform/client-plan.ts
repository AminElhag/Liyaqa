import type { UUID, LocalizedText, Money } from "../api";

/**
 * Billing cycle for client subscriptions.
 */
export type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

/**
 * Full client plan response.
 */
export interface ClientPlan {
  id: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  monthlyPrice: Money;
  annualPrice: Money;
  billingCycle: BillingCycle;

  // Usage limits
  maxClubs: number;
  maxLocationsPerClub: number;
  maxMembers: number;
  maxStaffUsers: number;

  // Feature flags
  hasAdvancedReporting: boolean;
  hasApiAccess: boolean;
  hasPrioritySupport: boolean;
  hasWhiteLabeling: boolean;
  hasCustomIntegrations: boolean;

  // Status
  isActive: boolean;
  sortOrder: number;

  // Calculated fields
  annualSavingsAmount: number;
  effectiveMonthlyPriceAnnual: Money;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified plan response for listings.
 */
export interface ClientPlanSummary {
  id: UUID;
  name: LocalizedText;
  monthlyPrice: Money;
  annualPrice: Money;
  isActive: boolean;
}

// ============================================
// Request Types
// ============================================

export interface CreateClientPlanRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  monthlyPriceAmount: number;
  monthlyPriceCurrency?: string;
  annualPriceAmount: number;
  annualPriceCurrency?: string;
  billingCycle?: BillingCycle;
  maxClubs?: number;
  maxLocationsPerClub?: number;
  maxMembers?: number;
  maxStaffUsers?: number;
  hasAdvancedReporting?: boolean;
  hasApiAccess?: boolean;
  hasPrioritySupport?: boolean;
  hasWhiteLabeling?: boolean;
  hasCustomIntegrations?: boolean;
  sortOrder?: number;
}

export interface UpdateClientPlanRequest {
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  monthlyPriceAmount?: number;
  monthlyPriceCurrency?: string;
  annualPriceAmount?: number;
  annualPriceCurrency?: string;
  billingCycle?: BillingCycle;
  maxClubs?: number;
  maxLocationsPerClub?: number;
  maxMembers?: number;
  maxStaffUsers?: number;
  hasAdvancedReporting?: boolean;
  hasApiAccess?: boolean;
  hasPrioritySupport?: boolean;
  hasWhiteLabeling?: boolean;
  hasCustomIntegrations?: boolean;
  sortOrder?: number;
}

// Query params
export interface ClientPlanQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  isActive?: boolean;
}
