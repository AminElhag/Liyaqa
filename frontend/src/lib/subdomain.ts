/**
 * Subdomain utilities for tenant resolution.
 * Enables subdomain-based multi-tenancy (e.g., fitness-gym.liyaqa.com).
 */

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "liyaqa.com";
const DEV_HOSTS = ["localhost", "127.0.0.1"];

/**
 * Extracts subdomain from the current window location.
 * Returns null if:
 * - Running on server (no window)
 * - No subdomain present
 * - Subdomain is "www"
 */
export function extractSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname.toLowerCase();
  const baseDomain = BASE_DOMAIN.toLowerCase();

  // Check for query param first (works everywhere for testing)
  const params = new URLSearchParams(window.location.search);
  const querySubdomain = params.get("subdomain");
  if (querySubdomain) return querySubdomain;

  // Skip subdomain detection for pure localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  // Extract subdomain from hostname using configured base domain
  const baseParts = baseDomain.split(".");
  const hostParts = hostname.split(".");

  if (hostParts.length > baseParts.length) {
    // Verify the base domain matches
    const hostBaseParts = hostParts.slice(-baseParts.length);
    const baseMatches = hostBaseParts.every(
      (part, i) => part === baseParts[i]
    );

    if (baseMatches) {
      const subdomain = hostParts.slice(0, -baseParts.length).join(".");
      if (subdomain && subdomain !== "www") {
        return subdomain;
      }
    }
  }

  return null;
}

/**
 * Checks if the current page is accessed via a subdomain.
 */
export function isSubdomainAccess(): boolean {
  return extractSubdomain() !== null;
}

/**
 * Builds the full subdomain URL for a given slug.
 * @param slug The subdomain slug (e.g., "fitness-gym")
 * @param baseDomain Optional base domain override
 * @returns Full URL (e.g., "https://fitness-gym.liyaqa.com")
 */
export function buildSubdomainUrl(
  slug: string,
  baseDomain: string = BASE_DOMAIN
): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${slug}.${baseDomain}`;
}

/**
 * Validates a slug format.
 * Must be 3-63 lowercase alphanumeric characters with hyphens.
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 63) return false;
  const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return slugRegex.test(slug) && !slug.includes("--");
}

/**
 * Reserved slugs that cannot be used as subdomains.
 */
export const RESERVED_SLUGS = new Set([
  "api",
  "www",
  "admin",
  "platform",
  "app",
  "mail",
  "ftp",
  "docs",
  "help",
  "support",
  "status",
  "blog",
  "demo",
  "staging",
  "test",
  "dev",
  "static",
  "assets",
  "cdn",
  "media",
  "images",
  "files",
  "download",
  "login",
  "register",
  "auth",
  "oauth",
  "signup",
  "signin",
  "dashboard",
  "billing",
  "payment",
  "checkout",
  "cart",
  "account",
  "settings",
  "mobile",
  "m",
  "web",
]);

/**
 * Checks if a slug is reserved and cannot be used.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Generates a URL-friendly slug from a name.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .slice(0, 63); // Max length
}
