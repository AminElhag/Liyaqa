import ky, { type KyInstance, type Options, HTTPError } from "ky";
import type { ApiError } from "@/types/api";
import { SessionExpiredError } from "./client";
import { getTenantContext, getPlatformMode, setRefreshTokenFn } from "./client";

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

let refreshTokenFn: (() => Promise<boolean>) | null = null;

export function setCookieRefreshTokenFn(fn: () => Promise<boolean>) {
  refreshTokenFn = fn;
}

function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  const { protocol, hostname, port } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    return "http://localhost:8080";
  }

  const portPart = port && port \!== "80" && port \!== "443" ? `:${port}` : "";
  return `${protocol}//${hostname}${portPart}`;
}

const API_BASE_URL = getApiBaseUrl();

function createCookieApiClient(): KyInstance {
  return ky.create({
    prefixUrl: API_BASE_URL,
    timeout: 30000,
    cache: "no-store",
    credentials: "include",
    hooks: {
      beforeRequest: [
        (request) => {
          request.headers.set("X-Auth-Mode", "cookie");

          const method = request.method.toUpperCase();
          if (["POST", "PUT", "DELETE", "PATCH"].includes(method) && csrfToken) {
            request.headers.set("X-CSRF-Token", csrfToken);
          }

          const { tenantId, organizationId, isSuperTenant } = getTenantContext();
          if (\!getPlatformMode()) {
            if (tenantId) request.headers.set("X-Tenant-ID", tenantId);
            if (organizationId) request.headers.set("X-Organization-ID", organizationId);
            if (isSuperTenant) request.headers.set("X-Super-Tenant", "true");
          }

          if (\!request.headers.has("Content-Type")) {
            request.headers.set("Content-Type", "application/json");
          }
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          if (response.status === 401 && refreshTokenFn) {
            const refreshed = await refreshTokenFn();
            if (refreshed) {
              return ky(new Request(request, { headers: new Headers(request.headers) }), options as Options);
            }
            throw new SessionExpiredError();
          }
          return response;
        },
      ],
    },
  });
}

export const cookieApi = createCookieApiClient();

export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await cookieApi.get("api/auth/csrf").json<{ csrfToken: string }>();
    csrfToken = response.csrfToken;
    return csrfToken;
  } catch (error) {
    console.error("[Cookie Client] Failed to fetch CSRF token:", error);
    return null;
  }
}

export async function parseApiError(error: unknown): Promise<ApiError> {
  if (error instanceof HTTPError) {
    try {
      return await error.response.json() as ApiError;
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

  return {
    status: 0,
    error: "Network Error",
    errorAr: "خطأ في الشبكة",
    message: "Unable to connect to the server",
    messageAr: "تعذر الاتصال بالخادم",
  };
}
