import type { UUID, LocalizedText, PaginatedResponse } from "./api";

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
export type PointsTransactionType = "EARN" | "REDEEM" | "EXPIRE" | "ADJUSTMENT";
export type PointsSource =
  | "ATTENDANCE"
  | "REFERRAL"
  | "PURCHASE"
  | "MANUAL"
  | "PROMOTION"
  | "BIRTHDAY"
  | "SIGNUP_BONUS";

export interface MemberPoints {
  id: UUID;
  memberId: UUID;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: LoyaltyTier;
  pointsToNextTier: number | null;
  nextTier: LoyaltyTier | null;
  redemptionValue: number;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PointsTransaction {
  id: UUID;
  memberId: UUID;
  type: PointsTransactionType;
  points: number;
  source: PointsSource;
  referenceType: string | null;
  referenceId: UUID | null;
  description: LocalizedText | null;
  balanceAfter: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface LoyaltyConfig {
  id: UUID;
  enabled: boolean;
  pointsPerCheckin: number;
  pointsPerReferral: number;
  pointsPerSarSpent: number;
  redemptionRateSar: number;
  bronzeThreshold: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  pointsExpiryMonths: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  memberId: UUID;
  pointsBalance: number;
  lifetimeEarned: number;
  tier: LoyaltyTier;
}

// Request types
export interface EarnPointsRequest {
  points: number;
  source: PointsSource;
  referenceType?: string;
  referenceId?: UUID;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface RedeemPointsRequest {
  points: number;
  source?: PointsSource;
  referenceType?: string;
  referenceId?: UUID;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface AdjustPointsRequest {
  points: number;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface UpdateLoyaltyConfigRequest {
  enabled?: boolean;
  pointsPerCheckin?: number;
  pointsPerReferral?: number;
  pointsPerSarSpent?: number;
  redemptionRateSar?: number;
  bronzeThreshold?: number;
  silverThreshold?: number;
  goldThreshold?: number;
  platinumThreshold?: number;
  pointsExpiryMonths?: number;
}

// Query params
export interface PointsTransactionQueryParams {
  page?: number;
  size?: number;
}

export interface LeaderboardQueryParams {
  limit?: number;
}

export interface MembersByTierQueryParams {
  tier: LoyaltyTier;
  page?: number;
  size?: number;
}

// Paginated response types
export type PaginatedPointsTransactions = PaginatedResponse<PointsTransaction>;
export type PaginatedMemberPoints = PaginatedResponse<MemberPoints>;
