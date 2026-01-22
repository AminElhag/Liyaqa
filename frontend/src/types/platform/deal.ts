import type { UUID, LocalizedText, Money } from "../api";

/**
 * Status of a sales deal in the pipeline.
 */
export type DealStatus =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

/**
 * Source of a sales deal.
 */
export type DealSource =
  | "WEBSITE"
  | "REFERRAL"
  | "COLD_CALL"
  | "MARKETING_CAMPAIGN"
  | "EVENT"
  | "PARTNER"
  | "OTHER";

/**
 * Full deal response with all details.
 */
export interface Deal {
  id: UUID;
  title: LocalizedText;
  status: DealStatus;
  source: DealSource;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  estimatedValue: Money;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  interestedPlanId?: UUID;
  salesRepId: UUID;
  convertedOrganizationId?: UUID;
  convertedSubscriptionId?: UUID;
  notes?: LocalizedText;
  lostReason?: LocalizedText;

  // Calculated fields
  isOpen: boolean;
  isWon: boolean;
  isLost: boolean;
  canAdvance: boolean;
  nextStage?: DealStatus;
  weightedValue: Money;
  daysToClose?: number;
  isOverdue: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified deal response for listings.
 */
export interface DealSummary {
  id: UUID;
  title: LocalizedText;
  status: DealStatus;
  source: DealSource;
  companyName?: string;
  estimatedValue: Money;
  probability: number;
  expectedCloseDate?: string;
  salesRepId: UUID;
  isOverdue: boolean;
}

/**
 * Response for deal pipeline statistics.
 */
export interface DealStats {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  byStatus: Record<DealStatus, number>;
  bySource: Record<DealSource, number>;
  totalPipelineValue: Money;
  weightedPipelineValue: Money;
  wonValue: Money;
  averageDealSize: Money;
  winRate: number;
}

/**
 * Response for sales rep deal statistics.
 */
export interface SalesRepDealStats {
  salesRepId: UUID;
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: Money;
  wonValue: Money;
  winRate: number;
}

/**
 * Response for deal conversion result.
 */
export interface DealConversionResult {
  deal: Deal;
  organizationId: UUID;
  organizationName: LocalizedText;
  clubId: UUID;
  clubName: LocalizedText;
  adminUserId: UUID;
  adminEmail: string;
  subscriptionId?: UUID;
  subscriptionStatus?: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateDealRequest {
  titleEn: string;
  titleAr?: string;
  source?: DealSource;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  companyName?: string;
  estimatedValueAmount?: number;
  estimatedValueCurrency?: string;
  probability?: number;
  expectedCloseDate?: string;
  interestedPlanId?: UUID;
  salesRepId: UUID;
  notesEn?: string;
  notesAr?: string;
}

export interface UpdateDealRequest {
  titleEn?: string;
  titleAr?: string;
  source?: DealSource;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyName?: string;
  estimatedValueAmount?: number;
  estimatedValueCurrency?: string;
  probability?: number;
  expectedCloseDate?: string;
  interestedPlanId?: UUID;
  notesEn?: string;
  notesAr?: string;
}

export interface ConvertDealRequest {
  // Organization details
  organizationNameEn: string;
  organizationNameAr?: string;
  organizationTradeNameEn?: string;
  organizationTradeNameAr?: string;
  organizationType?: OrganizationType;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationWebsite?: string;
  vatRegistrationNumber?: string;
  commercialRegistrationNumber?: string;

  // First club details
  clubNameEn: string;
  clubNameAr?: string;
  clubDescriptionEn?: string;
  clubDescriptionAr?: string;

  // Admin user details
  adminEmail: string;
  adminPassword: string;
  adminDisplayNameEn: string;
  adminDisplayNameAr?: string;

  // Subscription details (optional)
  clientPlanId?: UUID;
  agreedPriceAmount?: number;
  agreedPriceCurrency?: string;
  billingCycle?: BillingCycle;
  contractMonths?: number;
  startWithTrial?: boolean;
  trialDays?: number;
  discountPercentage?: number;
}

export interface LoseDealRequest {
  reasonEn: string;
  reasonAr?: string;
}

export interface ReassignDealRequest {
  newSalesRepId: UUID;
}

// Import shared types
import type { OrganizationType } from "../organization";
import type { BillingCycle } from "./client-plan";

// Query params
export interface DealQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: DealStatus;
  source?: DealSource;
  salesRepId?: UUID;
  search?: string;
}
