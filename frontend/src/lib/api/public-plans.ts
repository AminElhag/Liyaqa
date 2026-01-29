import ky from "ky";
import type { PublicClientPlan } from "@/types/public-plans";

/**
 * Get the API base URL for public endpoints.
 * Public endpoints don't require authentication.
 */
function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  const { protocol, hostname, port } = window.location;

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost")) {
    return "http://localhost:8080";
  }

  const portPart = port && port !== "80" && port !== "443" ? `:${port}` : "";
  return `${protocol}//${hostname}${portPart}`;
}

/**
 * Public API client - no authentication required.
 */
const publicApi = ky.create({
  prefixUrl: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Fetch all active client plans for public pricing display.
 */
export async function getPublicPlans(): Promise<PublicClientPlan[]> {
  return publicApi.get("api/public/plans").json<PublicClientPlan[]>();
}
