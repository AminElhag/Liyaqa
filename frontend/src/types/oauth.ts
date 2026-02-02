import type { User } from "./auth";

/**
 * OAuth provider types
 */
export enum ProviderType {
  GOOGLE = "GOOGLE",
  MICROSOFT = "MICROSOFT",
  OKTA = "OKTA",
  GITHUB = "GITHUB",
  CUSTOM = "CUSTOM",
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  id: string;
  provider: ProviderType | string;
  displayName?: string | null;
  iconUrl?: string | null;
  enabled: boolean;
}

/**
 * OAuth login response
 */
export interface OAuthLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * OAuth callback parameters
 */
export interface OAuthCallbackParams {
  code: string;
  state: string;
}

/**
 * OAuth link account request
 */
export interface LinkOAuthAccountRequest {
  provider: string;
  code: string;
  state: string;
}
