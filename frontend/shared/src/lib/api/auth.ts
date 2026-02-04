import { api } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  PlatformLoginRequest,
  TenantInfoResponse,
  User,
  SendCodeRequest,
  SendCodeResponse,
  VerifyCodeRequest,
  PlatformAuthResponse,
} from "../../types/auth";

/**
 * Auth API endpoints
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return api.post("api/auth/login", { json: data }).json<LoginResponse>();
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    return api.post("api/auth/register", { json: data }).json<LoginResponse>();
  },

  /**
   * Refresh access token
   */
  refresh: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return api
      .post("api/auth/refresh", { json: data })
      .json<RefreshTokenResponse>();
  },

  /**
   * Logout (invalidate refresh token)
   */
  logout: async (refreshToken: string): Promise<void> => {
    await api.post("api/auth/logout", { json: { refreshToken } });
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post("api/auth/forgot-password", { json: data });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post("api/auth/reset-password", { json: data });
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post("api/auth/change-password", { json: data });
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<User> => {
    return api.get("api/me").json<User>();
  },

  /**
   * Platform login (for internal team, no tenantId required)
   */
  platformLogin: async (data: PlatformLoginRequest): Promise<LoginResponse> => {
    return api
      .post("api/platform/auth/login", { json: data })
      .json<LoginResponse>();
  },

  /**
   * Platform refresh token
   */
  platformRefresh: async (
    data: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> => {
    return api
      .post("api/platform/auth/refresh", { json: data })
      .json<RefreshTokenResponse>();
  },

  /**
   * Get current platform user profile
   */
  platformMe: async (): Promise<User> => {
    return api.get("api/platform/auth/me").json<User>();
  },

  /**
   * Get tenant info from subdomain.
   * Used to determine if tenant ID field should be shown on login.
   * Returns resolved=true with tenant details if subdomain was resolved.
   */
  getTenantInfo: async (): Promise<TenantInfoResponse> => {
    return api.get("api/auth/tenant-info").json<TenantInfoResponse>();
  },

  /**
   * Send passwordless login code (platform users only)
   */
  sendPlatformLoginCode: async (
    data: SendCodeRequest
  ): Promise<SendCodeResponse> => {
    return api
      .post("api/platform/auth/send-code", { json: data })
      .json<SendCodeResponse>();
  },

  /**
   * Verify passwordless login code (platform users only)
   */
  verifyPlatformLoginCode: async (
    data: VerifyCodeRequest
  ): Promise<PlatformAuthResponse> => {
    return api
      .post("api/platform/auth/verify-code", { json: data })
      .json<PlatformAuthResponse>();
  },
};
