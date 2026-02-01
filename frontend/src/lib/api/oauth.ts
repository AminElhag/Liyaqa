import { apiClient } from './client';

/**
 * OAuth provider information
 */
export interface OAuthProvider {
  id: string;
  provider: string;
  displayName: string | null;
  iconUrl: string | null;
  enabled: boolean;
}

/**
 * OAuth providers list response
 */
export interface OAuthProvidersResponse {
  providers: OAuthProvider[];
}

/**
 * Request for linking OAuth provider
 */
export interface LinkOAuthRequest {
  providerId: string;
  oauthUserId: string;
}

/**
 * OAuth API functions
 */
export const oauthApi = {
  /**
   * Get list of enabled OAuth providers for an organization
   */
  async getProviders(organizationId?: string): Promise<OAuthProvider[]> {
    const params = organizationId ? `?organizationId=${organizationId}` : '';
    const response = await apiClient.get(`/auth/oauth/providers${params}`).json<OAuthProvidersResponse>();
    return response.providers;
  },

  /**
   * Initiate OAuth authorization flow (redirects to provider)
   * @param providerId OAuth provider ID
   * @param baseUrl Optional base URL for redirect (defaults to current origin)
   */
  initiateOAuth(providerId: string, baseUrl?: string): void {
    const params = baseUrl ? `?baseUrl=${encodeURIComponent(baseUrl)}` : '';
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/oauth/authorize/${providerId}${params}`;
    window.location.href = url;
  },

  /**
   * Link OAuth provider to current user account
   */
  async linkProvider(request: LinkOAuthRequest): Promise<{ message: string }> {
    return apiClient.post('/auth/oauth/link', { json: request }).json<{ message: string }>();
  },

  /**
   * Unlink OAuth provider from current user account
   */
  async unlinkProvider(): Promise<{ message: string }> {
    return apiClient.post('/auth/oauth/unlink').json<{ message: string }>();
  },
};
