import api from '@/api/client'
import type {
  SendCodeRequest,
  SendCodeResponse,
  VerifyCodeRequest,
  PlatformAuthResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
} from '@/types'

const BASE_URL = 'api/platform/auth'

/**
 * Send passwordless login code to email.
 */
export async function sendCode(data: SendCodeRequest): Promise<SendCodeResponse> {
  return api.post<SendCodeResponse>(`${BASE_URL}/send-code`, data).then((r) => r.data)
}

/**
 * Verify the login code and get tokens.
 */
export async function verifyCode(data: VerifyCodeRequest): Promise<PlatformAuthResponse> {
  return api.post<PlatformAuthResponse>(`${BASE_URL}/verify-code`, data).then((r) => r.data)
}

/**
 * Refresh access token using refresh token.
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return api.post<RefreshTokenResponse>(`${BASE_URL}/refresh`, data).then((r) => r.data)
}

/**
 * Get current authenticated user.
 */
export async function getMe(): Promise<User> {
  return api.get<User>(`${BASE_URL}/me`).then((r) => r.data)
}

/**
 * Logout and invalidate refresh token.
 */
export async function logout(data: { refreshToken: string }): Promise<void> {
  await api.post(`${BASE_URL}/logout`, data)
}
