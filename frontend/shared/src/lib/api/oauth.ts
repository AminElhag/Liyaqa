import { api } from "./client";
import type {
  OAuthProvider,
  OAuthLoginResponse,
  OAuthCallbackParams,
  LinkOAuthAccountRequest,
} from "../../types/oauth";

/**
 * OAuth API functions
 */
export const oauthApi = {
  /**
   * Fetch available OAuth providers for an organization
   * GET /api/auth/oauth/providers
   */
  async fetchOAuthProviders(organizationId?: string): Promise<OAuthProvider[]> {
    const params = organizationId ? `?organizationId=${organizationId}` : "";
    try {
      const response = await api
        .get(`api/auth/oauth/providers${params}`)
        .json<{ providers: OAuthProvider[] }>();
      return response.providers;
    } catch (error) {
      // Network errors (backend not running, CORS, etc.) — treat as "no providers"
      if (error instanceof TypeError) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Initiate OAuth login flow
   * Redirects to provider authorization page
   * GET /api/auth/oauth/authorize/{provider}
   */
  initiateOAuthLogin(provider: string, organizationId?: string): void {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams();
    if (baseUrl) params.set("baseUrl", baseUrl);
    if (organizationId) params.set("organizationId", organizationId);

    const queryString = params.toString();
    const url = queryString
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/oauth/authorize/${provider}?${queryString}`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/auth/oauth/authorize/${provider}`;

    window.location.href = url;
  },

  /**
   * Handle OAuth callback after provider redirect
   * GET /api/auth/oauth/callback
   */
  async handleOAuthCallback(params: OAuthCallbackParams): Promise<OAuthLoginResponse> {
    const queryString = new URLSearchParams({
      code: params.code,
      state: params.state,
    }).toString();

    return api
      .get(`api/auth/oauth/callback?${queryString}`)
      .json<OAuthLoginResponse>();
  },

  /**
   * Link OAuth account to existing user
   * POST /api/auth/oauth/link
   */
  async linkOAuthAccount(data: LinkOAuthAccountRequest): Promise<{ message: string }> {
    return api
      .post("api/auth/oauth/link", { json: data })
      .json<{ message: string }>();
  },

  /**
   * Unlink OAuth provider from current user account
   * POST /api/auth/oauth/unlink
   */
  async unlinkOAuthAccount(provider: string): Promise<{ message: string }> {
    return api
      .delete(`api/auth/oauth/unlink/${provider}`)
      .json<{ message: string }>();
  },
};
