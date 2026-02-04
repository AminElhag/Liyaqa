import { apiClient } from "./client"
import type { LoginResponse } from "../types/auth"

/**
 * MFA setup response containing secret, QR code, and backup codes
 */
export interface MfaSetupResponse {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

/**
 * MFA status response
 */
export interface MfaStatusResponse {
  enabled: boolean
  unusedBackupCodesCount: number
}

/**
 * Backup codes response
 */
export interface BackupCodesResponse {
  backupCodes: string[]
  count: number
}

/**
 * Request to verify MFA setup
 */
export interface VerifyMfaSetupRequest {
  secret: string
  code: string
  backupCodes: string[]
}

/**
 * Request to disable MFA
 */
export interface DisableMfaRequest {
  password: string
}

/**
 * Request to verify MFA during login
 */
export interface MfaLoginVerifyRequest {
  userId: string
  code: string
  deviceInfo?: string
}

/**
 * MFA API client
 */
export const mfaApi = {
  /**
   * Initiate MFA setup - generates TOTP secret, QR code, and backup codes
   */
  async setupMfa(): Promise<MfaSetupResponse> {
    return apiClient.post("/auth/mfa/setup", {}).json<MfaSetupResponse>()
  },

  /**
   * Verify TOTP code and complete MFA setup
   */
  async verifySetup(request: VerifyMfaSetupRequest): Promise<{ message: string }> {
    return apiClient.post("/auth/mfa/verify-setup", { json: request }).json<{ message: string }>()
  },

  /**
   * Disable MFA (requires password verification)
   */
  async disableMfa(password: string): Promise<{ message: string }> {
    return apiClient.post("/auth/mfa/disable", {
      json: { password },
    }).json<{ message: string }>()
  },

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<BackupCodesResponse> {
    return apiClient.post("/auth/mfa/regenerate-backup", {}).json<BackupCodesResponse>()
  },

  /**
   * Get MFA status
   */
  async getStatus(): Promise<MfaStatusResponse> {
    return apiClient.get("/auth/mfa/status").json<MfaStatusResponse>()
  },

  /**
   * Verify MFA code during login and complete authentication
   */
  async verifyLogin(request: MfaLoginVerifyRequest): Promise<LoginResponse> {
    return apiClient.post("/auth/mfa/verify-login", { json: request }).json<LoginResponse>()
  },
}
