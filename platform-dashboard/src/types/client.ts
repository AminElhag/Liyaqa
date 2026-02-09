import type { UUID, LocalizedText } from "./api";
import type { OrganizationType, OrganizationStatus, ClubStatus } from "./organization";
import type { BillingCycle } from "./client-plan";

/**
 * Client (Organization) response for platform view.
 */
export interface Client {
  id: UUID;
  name: LocalizedText;
  tradeName?: LocalizedText;
  organizationType: OrganizationType;
  email?: string;
  phone?: string;
  website?: string;
  vatRegistrationNumber?: string;
  commercialRegistrationNumber?: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client club response.
 */
export interface ClientClub {
  id: UUID;
  organizationId: UUID;
  name: LocalizedText;
  description?: LocalizedText;
  slug?: string;
  status: ClubStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Onboarding result response.
 */
export interface OnboardingResult {
  organization: Client;
  club: ClientClub;
  adminUserId: UUID;
  adminEmail: string;
  subscriptionId?: UUID;
  subdomainUrl?: string;
}

/**
 * Admin user response.
 */
export interface AdminUser {
  id: UUID;
  email: string;
  displayName: LocalizedText;
  createdAt: string;
}

/**
 * Client statistics.
 */
export interface ClientStats {
  total: number;
  pending: number;
  active: number;
  suspended: number;
  closed: number;
}

// ============================================
// Request Types
// ============================================

export interface OnboardClientRequest {
  // Organization
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

  // Club
  clubNameEn: string;
  clubNameAr?: string;
  clubDescriptionEn?: string;
  clubDescriptionAr?: string;
  clubSlug?: string;

  // Admin User
  adminEmail: string;
  adminPassword: string;
  adminDisplayNameEn: string;
  adminDisplayNameAr?: string;

  // Subscription (optional)
  clientPlanId?: UUID;
  agreedPriceAmount?: number;
  agreedPriceCurrency?: string;
  billingCycle?: BillingCycle;
  contractMonths?: number;
  startWithTrial?: boolean;
  trialDays?: number;
  discountPercentage?: number;

  // Sales attribution
  salesRepId?: UUID;
  dealId?: UUID;
}

export interface SetupAdminRequest {
  clubId: UUID;
  adminEmail: string;
  adminPassword: string;
  adminDisplayNameEn: string;
  adminDisplayNameAr?: string;
}

export interface CreateClientClubRequest {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

// Query params
export interface ClientQueryParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  status?: OrganizationStatus;
  search?: string;
}
