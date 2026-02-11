import type { UUID } from "../api";
import type { TenantStatus } from "./announcements";

// ── Enums ──────────────────────────────────────────────────────

export type FeatureFlagCategory =
  | "MEMBER_ENGAGEMENT"
  | "MARKETING_LOYALTY"
  | "OPERATIONS"
  | "ACCOUNTS_PAYMENTS"
  | "REPORTING"
  | "INTEGRATIONS"
  | "SUPPORT";

// ── Responses ──────────────────────────────────────────────────

export interface FeatureFlagResponse {
  id: UUID;
  key: string;
  name: string;
  description: string | null;
  category: FeatureFlagCategory;
  defaultEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagsByCategoryResponse {
  category: FeatureFlagCategory;
  flags: FeatureFlagResponse[];
}

export interface TenantFeatureOverrideResponse {
  id: UUID;
  tenantId: UUID;
  featureKey: string;
  enabled: boolean;
  reason: string | null;
  overriddenBy: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveFeaturesResponse {
  tenantId: UUID;
  planId: UUID | null;
  planName: string | null;
  features: Record<string, boolean>;
  overrides: TenantFeatureOverrideResponse[];
}

export interface TenantSummaryResponse {
  id: UUID;
  facilityName: string;
  status: TenantStatus;
  contactEmail: string;
  createdAt: string;
}

// ── Requests ───────────────────────────────────────────────────

export interface UpdateFeatureFlagRequest {
  name?: string;
  description?: string;
  category?: FeatureFlagCategory;
  defaultEnabled?: boolean;
  isActive?: boolean;
}

export interface SetFeatureOverrideRequest {
  featureKey: string;
  enabled: boolean;
  reason?: string;
}
