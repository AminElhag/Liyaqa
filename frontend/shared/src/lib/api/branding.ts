import { api } from "./client";
import type {
  BrandingConfig,
  UpdateBrandingRequest,
} from "../types/branding";

/**
 * Get branding configuration for the current tenant.
 */
export async function getBrandingConfig(): Promise<BrandingConfig> {
  return api.get("api/branding/config").json();
}

/**
 * Update branding configuration for the current tenant.
 */
export async function updateBrandingConfig(
  data: UpdateBrandingRequest
): Promise<BrandingConfig> {
  return api.put("api/branding/config", { json: data }).json();
}
