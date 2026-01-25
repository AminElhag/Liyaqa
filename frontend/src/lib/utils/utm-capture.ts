/**
 * UTM Parameter Capture Utility
 *
 * Captures UTM parameters from URL and stores them in sessionStorage
 * for campaign attribution on lead creation.
 */

export interface UtmParams {
  campaignSource?: string;
  campaignMedium?: string;
  campaignName?: string;
  campaignTerm?: string;
  campaignContent?: string;
}

const UTM_STORAGE_KEY = "liyaqa_utm_params";
const UTM_EXPIRY_KEY = "liyaqa_utm_expiry";
const UTM_EXPIRY_HOURS = 24; // UTM params expire after 24 hours

/**
 * Parse UTM parameters from URL search params
 */
export function parseUtmFromUrl(searchParams: URLSearchParams): UtmParams {
  return {
    campaignSource: searchParams.get("utm_source") || undefined,
    campaignMedium: searchParams.get("utm_medium") || undefined,
    campaignName: searchParams.get("utm_campaign") || undefined,
    campaignTerm: searchParams.get("utm_term") || undefined,
    campaignContent: searchParams.get("utm_content") || undefined,
  };
}

/**
 * Check if UTM params object has any values
 */
export function hasUtmParams(params: UtmParams): boolean {
  return !!(params.campaignSource || params.campaignMedium || params.campaignName);
}

/**
 * Store UTM params in sessionStorage with expiry
 */
export function storeUtmParams(params: UtmParams): void {
  if (typeof window === "undefined") return;
  if (!hasUtmParams(params)) return;

  try {
    const expiry = Date.now() + UTM_EXPIRY_HOURS * 60 * 60 * 1000;
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    sessionStorage.setItem(UTM_EXPIRY_KEY, expiry.toString());
  } catch (e) {
    // sessionStorage might be unavailable in private mode
    console.warn("Failed to store UTM params:", e);
  }
}

/**
 * Retrieve stored UTM params if not expired
 */
export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;

  try {
    const expiry = sessionStorage.getItem(UTM_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      // Expired, clear storage
      clearStoredUtmParams();
      return null;
    }

    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!stored) return null;

    return JSON.parse(stored) as UtmParams;
  } catch (e) {
    console.warn("Failed to retrieve UTM params:", e);
    return null;
  }
}

/**
 * Clear stored UTM params
 */
export function clearStoredUtmParams(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
    sessionStorage.removeItem(UTM_EXPIRY_KEY);
  } catch (e) {
    console.warn("Failed to clear UTM params:", e);
  }
}

/**
 * Capture UTM params from URL and store them
 * Call this on app initialization or page load
 */
export function captureUtmParams(searchParams: URLSearchParams): UtmParams {
  const urlParams = parseUtmFromUrl(searchParams);

  // If URL has UTM params, store them (overwriting any existing)
  if (hasUtmParams(urlParams)) {
    storeUtmParams(urlParams);
    return urlParams;
  }

  // Otherwise, return any stored params
  return getStoredUtmParams() || {};
}

/**
 * Get UTM params for form submission
 * Merges URL params with stored params (URL takes precedence)
 */
export function getUtmParamsForForm(searchParams?: URLSearchParams): UtmParams {
  const stored = getStoredUtmParams() || {};

  if (!searchParams) return stored;

  const urlParams = parseUtmFromUrl(searchParams);

  return {
    campaignSource: urlParams.campaignSource || stored.campaignSource,
    campaignMedium: urlParams.campaignMedium || stored.campaignMedium,
    campaignName: urlParams.campaignName || stored.campaignName,
    campaignTerm: urlParams.campaignTerm || stored.campaignTerm,
    campaignContent: urlParams.campaignContent || stored.campaignContent,
  };
}
