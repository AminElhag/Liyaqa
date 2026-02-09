import type { UUID } from "./api";

/**
 * Status of a sales deal in the pipeline.
 */
export type DealStatus =
  | "LEAD"
  | "CONTACTED"
  | "DEMO_SCHEDULED"
  | "DEMO_DONE"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "CHURNED";

/** Stages that are considered "open" (not terminal). */
export const OPEN_STAGES: DealStatus[] = [
  "LEAD", "CONTACTED", "DEMO_SCHEDULED", "DEMO_DONE", "PROPOSAL_SENT", "NEGOTIATION",
];

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
 * Assigned platform user summary.
 */
export interface DealAssignee {
  id: UUID;
  displayName: string;
  email: string;
}

/**
 * Deal activity entry.
 */
export interface DealActivity {
  id: UUID;
  type: string;
  content: string;
  createdBy: UUID;
  createdAt: string;
}

/**
 * Full deal response matching backend DealResponse.
 */
export interface Deal {
  id: UUID;
  facilityName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  status: DealStatus;
  source: DealSource;
  notes?: string;
  assignedTo?: DealAssignee;
  estimatedValue: number;
  currency: string;
  expectedCloseDate?: string;
  closedAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
  activities?: DealActivity[];
}

/**
 * Simplified deal response matching backend DealSummaryResponse.
 */
export interface DealSummary {
  id: UUID;
  facilityName?: string;
  contactName: string;
  status: DealStatus;
  estimatedValue: number;
  expectedCloseDate?: string;
}

/**
 * Response for deal pipeline counts.
 */
export interface DealPipelineResponse {
  counts: Record<DealStatus, number>;
}

/**
 * Response for deal metrics matching backend DealMetricsResponse.
 */
export interface DealStats {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  avgDealValue: number;
  avgDaysToClose: number;
  stageDistribution: Record<DealStatus, number>;
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
  pipelineValue: number;
  wonValue: number;
  winRate: number;
}

/**
 * Response for deal conversion result.
 */
export interface DealConversionResult {
  deal: Deal;
  organizationId: UUID;
  organizationName: string;
  clubId: UUID;
  clubName: string;
  adminUserId: UUID;
  adminEmail: string;
  subscriptionId?: UUID;
  subscriptionStatus?: string;
}

// ============================================
// Request Types
// ============================================

export interface CreateDealRequest {
  facilityName?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  source?: DealSource;
  notes?: string;
  assignedToId?: UUID;
  estimatedValue?: number;
  currency?: string;
  expectedCloseDate?: string;
}

export interface UpdateDealRequest {
  facilityName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  estimatedValue?: number;
  expectedCloseDate?: string;
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

export interface ChangeStageRequest {
  stage: DealStatus;
  reason?: string;
}

export interface LoseDealRequest {
  reasonEn: string;
  reasonAr?: string;
}

export interface ReassignDealRequest {
  newSalesRepId: UUID;
}

// Import shared types
import type { OrganizationType } from "./organization";
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
