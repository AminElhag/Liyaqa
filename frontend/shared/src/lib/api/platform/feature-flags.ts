import { api } from "../client";
import type {
  FeatureFlagResponse,
  FeatureFlagsByCategoryResponse,
  TenantFeatureOverrideResponse,
  EffectiveFeaturesResponse,
  UpdateFeatureFlagRequest,
  SetFeatureOverrideRequest,
  TenantSummaryResponse,
} from "../../../types/platform/feature-flags";
import type { PaginatedResponse } from "../../../types/api";

const BASE_URL = "api/v1/platform/subscriptions/feature-flags";
const TENANTS_URL = "api/v1/platform/tenants";

/** GET /api/v1/platform/subscriptions/feature-flags → flags grouped by category */
export async function getFeatureFlags(): Promise<FeatureFlagsByCategoryResponse[]> {
  return api.get(BASE_URL).json<FeatureFlagsByCategoryResponse[]>();
}

/** PUT /api/v1/platform/subscriptions/feature-flags/{key} → update a flag */
export async function updateFeatureFlag(
  key: string,
  data: UpdateFeatureFlagRequest
): Promise<FeatureFlagResponse> {
  return api.put(`${BASE_URL}/${key}`, { json: data }).json<FeatureFlagResponse>();
}

/** GET .../tenants/{tenantId}/effective → effective features for a tenant */
export async function getEffectiveFeatures(
  tenantId: string
): Promise<EffectiveFeaturesResponse> {
  return api.get(`${BASE_URL}/tenants/${tenantId}/effective`).json<EffectiveFeaturesResponse>();
}

/** PUT .../tenants/{tenantId}/overrides → set/update an override */
export async function setTenantOverride(
  tenantId: string,
  data: SetFeatureOverrideRequest
): Promise<TenantFeatureOverrideResponse> {
  return api
    .put(`${BASE_URL}/tenants/${tenantId}/overrides`, { json: data })
    .json<TenantFeatureOverrideResponse>();
}

/** DELETE .../tenants/{tenantId}/overrides/{featureKey} → remove override */
export async function removeTenantOverride(
  tenantId: string,
  featureKey: string
): Promise<void> {
  await api.delete(`${BASE_URL}/tenants/${tenantId}/overrides/${featureKey}`);
}

/** GET .../tenants/{tenantId}/overrides → list all overrides for tenant */
export async function getTenantOverrides(
  tenantId: string
): Promise<TenantFeatureOverrideResponse[]> {
  return api
    .get(`${BASE_URL}/tenants/${tenantId}/overrides`)
    .json<TenantFeatureOverrideResponse[]>();
}

/** GET /api/v1/platform/tenants?size={size}&status=ACTIVE → list active tenants */
export async function getTenants(
  size: number = 100
): Promise<PaginatedResponse<TenantSummaryResponse>> {
  return api
    .get(TENANTS_URL, { searchParams: { size, status: "ACTIVE" } })
    .json<PaginatedResponse<TenantSummaryResponse>>();
}
