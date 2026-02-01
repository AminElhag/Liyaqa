package com.liyaqa.auth.api

/**
 * Request to verify MFA setup.
 */
data class VerifyMfaSetupRequest(
    val secret: String,
    val code: String,
    val backupCodes: List<String>
)

/**
 * Request to verify MFA during login.
 */
data class VerifyMfaLoginRequest(
    val code: String
)

/**
 * Request to verify MFA and complete login (includes userId from MFA required response).
 */
data class MfaLoginVerifyRequest(
    val userId: java.util.UUID,
    val code: String,
    val deviceInfo: String? = null
)

/**
 * Request to disable MFA.
 */
data class DisableMfaRequest(
    val password: String
)

/**
 * Response containing MFA status.
 */
data class MfaStatusResponse(
    val enabled: Boolean,
    val unusedBackupCodesCount: Long
)

/**
 * Response containing MFA setup information.
 */
data class MfaSetupResponseDto(
    val secret: String,
    val qrCodeUrl: String,
    val backupCodes: List<String>
)

/**
 * Response containing regenerated backup codes.
 */
data class BackupCodesResponse(
    val backupCodes: List<String>,
    val count: Int
)
