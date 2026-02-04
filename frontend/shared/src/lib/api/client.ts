import ky, { type Options, type KyInstance, HTTPError } from "ky";
import type { ApiError } from "../../types/api";

// Storage keys
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const PLATFORM_MODE_KEY = "platformMode";

/**
 * Custom error thrown when session expires and user needs to re-login.
 * This error is handled gracefully - no error UI is shown, just redirect to login.
 */
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

// Store tokens - access token in sessionStorage, refresh token in localStorage
let accessToken: string | null = null;

// Token management functions
export function setAccessToken(token: string | null) {
  accessToken = token;
  // Also persist to sessionStorage for page refresh survival
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }
}

export function getAccessToken(): string | null {
  // Try memory first, then sessionStorage
  if (accessToken) {
    return accessToken;
  }
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
      accessToken = stored; // Restore to memory
      return stored;
    }
  }
  return null;
}

export function setRefreshToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function clearTokens() {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
}

// Tenant context
let currentTenantId: string | null = null;
let currentOrganizationId: string | null = null;
let isSuperTenant = false;

// Platform mode - when enabled, skip tenant headers for platform API calls
let isPlatformMode = false;

export function setTenantContext(
  tenantId: string | null,
  organizationId: string | null = null,
  superTenant = false
) {
  currentTenantId = tenantId;
  currentOrganizationId = organizationId;
  isSuperTenant = superTenant;
}

export function getTenantContext() {
  return {
    tenantId: currentTenantId,
    organizationId: currentOrganizationId,
    isSuperTenant,
  };
}

/**
 * Enable or disable platform mode.
 * When platform mode is enabled, tenant headers are not sent with requests.
 * Use this for platform admin users who don't belong to a specific tenant.
 * Also persists to localStorage for page refresh survival.
 */
export function setPlatformMode(enabled: boolean) {
  isPlatformMode = enabled;
  if (typeof window !== "undefined") {
    if (enabled) {
      localStorage.setItem(PLATFORM_MODE_KEY, "true");
    } else {
      localStorage.removeItem(PLATFORM_MODE_KEY);
    }
  }
}

/**
 * Check if platform mode is enabled.
 */
export function getPlatformMode(): boolean {
  return isPlatformMode;
}

/**
 * Restore platform mode from localStorage.
 * Call this on app initialization.
 */
export function restorePlatformMode(): boolean {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(PLATFORM_MODE_KEY);
    isPlatformMode = stored === "true";
    return isPlatformMode;
  }
  return false;
}

// Restore platform mode on module load (client-side only)
if (typeof window !== "undefined") {
  restorePlatformMode();
}

// Refresh token function (will be set by auth store)
let refreshTokenFn: (() => Promise<boolean>) | null = null;

export function setRefreshTokenFn(fn: () => Promise<boolean>) {
  refreshTokenFn = fn;
}

/**
 * Get the API base URL dynamically.
 * - In browser: derives from window.location.origin (same host as frontend)
 * - In SSR/build: uses environment variable or defaults to localhost
 *
 * This allows the same frontend build to work on any environment (local, staging, production)
 * without needing to rebuild with different NEXT_PUBLIC_API_URL values.
 */
function getApiBaseUrl(): string {
  // Server-side: use environment variable
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  // Client-side: derive from current location
  const { protocol, hostname, port } = window.location;

  // Local development (localhost, 127.0.0.1, or *.localhost subdomains)
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    // In local dev, frontend is on 3000, backend on 8080
    return "http://localhost:8080";
  }

  // Production/staging: API is on same host, proxied through nginx at /api
  // The frontend and backend share the same domain
  const portPart = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${hostname}${portPart}`;
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Create the ky API client with interceptors
 */
function createApiClient(): KyInstance {
  return ky.create({
    prefixUrl: API_BASE_URL,
    timeout: 30000,
    cache: "no-store", // Never cache API responses - auth safety
    hooks: {
      beforeRequest: [
        (request) => {
          // Get token (restores from sessionStorage if needed)
          const token = getAccessToken();

          console.log("[API Client] Request URL:", request.url);
          console.log("[API Client] accessToken:", token ? `${token.substring(0, 20)}...` : "null");
          console.log("[API Client] currentTenantId:", currentTenantId);
          console.log("[API Client] isPlatformMode:", isPlatformMode);

          // Add Authorization header
          if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
          }

          // Add tenant headers (skip in platform mode)
          if (!isPlatformMode) {
            if (currentTenantId) {
              request.headers.set("X-Tenant-ID", currentTenantId);
            }
            if (currentOrganizationId) {
              request.headers.set("X-Organization-ID", currentOrganizationId);
            }
            if (isSuperTenant) {
              request.headers.set("X-Super-Tenant", "true");
            }
          }

          // Set content type for JSON
          if (!request.headers.has("Content-Type")) {
            request.headers.set("Content-Type", "application/json");
          }

          console.log("[API Client] Final headers:", Object.fromEntries(request.headers.entries()));
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          // Handle 401 Unauthorized - attempt token refresh
          // Note: 403 Forbidden means permission denied (user lacks authority), not session expiry
          if (response.status === 401 && refreshTokenFn) {
            const refreshed = await refreshTokenFn();
            if (refreshed) {
              // Retry the original request with new token
              const newRequest = new Request(request, {
                headers: new Headers(request.headers),
              });
              newRequest.headers.set(
                "Authorization",
                `Bearer ${getAccessToken()}`
              );
              return ky(newRequest, options as Options);
            }
            // Refresh failed - user is being logged out
            // Throw custom error to prevent error UI from showing
            throw new SessionExpiredError();
          }
          return response;
        },
      ],
    },
  });
}

// Export the API client instance
export const api = createApiClient();

// Alias for backward compatibility
export const apiClient = api;

/**
 * Parse API error response
 */
export async function parseApiError(error: unknown): Promise<ApiError> {
  if (error instanceof HTTPError) {
    try {
      const errorResponse = await error.response.json();
      return errorResponse as ApiError;
    } catch {
      return {
        status: error.response.status,
        error: error.response.statusText,
        errorAr: error.response.statusText,
        message: "An unexpected error occurred",
        messageAr: "حدث خطأ غير متوقع",
      };
    }
  }

  // Network or other errors
  return {
    status: 0,
    error: "Network Error",
    errorAr: "خطأ في الشبكة",
    message: "Unable to connect to the server",
    messageAr: "تعذر الاتصال بالخادم",
  };
}

/**
 * Get localized error message based on current locale
 */
export function getLocalizedErrorMessage(
  error: ApiError,
  locale: string = "en"
): string {
  return locale === "ar" ? error.messageAr : error.message;
}
