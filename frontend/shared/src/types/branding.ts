import type { UUID } from "./api";

/**
 * Feature flags for white-label apps.
 */
export interface BrandingFeatures {
  classes: boolean;
  facilities: boolean;
  loyalty: boolean;
  wearables: boolean;
  payments: boolean;
}

/**
 * Branding configuration response.
 */
export interface BrandingConfig {
  id: UUID;
  tenantId: UUID;

  // App Identity
  appName: string;
  appNameAr: string | null;

  // Colors
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  secondaryDarkColor: string;
  accentColor: string;

  // Logos
  logoLightUrl: string | null;
  logoDarkUrl: string | null;

  // Feature Flags
  featureClasses: boolean;
  featureFacilities: boolean;
  featureLoyalty: boolean;
  featureWearables: boolean;
  featurePayments: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Mobile branding response (lightweight).
 */
export interface MobileBrandingResponse {
  appName: string;
  appNameAr: string | null;

  // Colors
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  secondaryDarkColor: string;
  accentColor: string;

  // Logos
  logoLightUrl: string | null;
  logoDarkUrl: string | null;

  // Feature Flags
  features: BrandingFeatures;
}

/**
 * Request to update branding configuration.
 */
export interface UpdateBrandingRequest {
  // App Identity
  appName: string;
  appNameAr?: string | null;

  // Colors
  primaryColor: string;
  primaryDarkColor: string;
  secondaryColor: string;
  secondaryDarkColor: string;
  accentColor: string;

  // Logos
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;

  // Feature Flags
  featureClasses?: boolean;
  featureFacilities?: boolean;
  featureLoyalty?: boolean;
  featureWearables?: boolean;
  featurePayments?: boolean;
}
