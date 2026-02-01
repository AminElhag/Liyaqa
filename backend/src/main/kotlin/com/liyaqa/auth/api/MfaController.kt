package com.liyaqa.auth.api

import com.liyaqa.auth.application.services.MfaService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for Multi-Factor Authentication (MFA) operations.
 */
@RestController
@RequestMapping("/api/auth/mfa")
@Tag(name = "MFA", description = "Multi-Factor Authentication endpoints")
class MfaController(
    private val mfaService: MfaService
) {

    @PostMapping("/setup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Initiate MFA setup", description = "Generates TOTP secret, QR code, and backup codes for MFA setup")
    fun setupMfa(authentication: Authentication): ResponseEntity<MfaSetupResponseDto> {
        val userId = UUID.fromString(authentication.name)
        val response = mfaService.setupMfa(userId)

        return ResponseEntity.ok(
            MfaSetupResponseDto(
                secret = response.secret,
                qrCodeUrl = response.qrCodeUrl,
                backupCodes = response.backupCodes
            )
        )
    }

    @PostMapping("/verify-setup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Verify and complete MFA setup", description = "Verifies TOTP code and enables MFA")
    fun verifyMfaSetup(
        authentication: Authentication,
        @RequestBody request: VerifyMfaSetupRequest
    ): ResponseEntity<Map<String, Any>> {
        val userId = UUID.fromString(authentication.name)
        val success = mfaService.verifyMfaSetup(userId, request.secret, request.code, request.backupCodes)

        return if (success) {
            ResponseEntity.ok(mapOf("message" to "MFA enabled successfully"))
        } else {
            ResponseEntity.badRequest().body(mapOf("error" to "Invalid verification code"))
        }
    }

    @PostMapping("/disable")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Disable MFA", description = "Disables MFA after password verification")
    fun disableMfa(
        authentication: Authentication,
        @RequestBody request: DisableMfaRequest
    ): ResponseEntity<Map<String, String>> {
        val userId = UUID.fromString(authentication.name)
        mfaService.disableMfa(userId, request.password)

        return ResponseEntity.ok(mapOf("message" to "MFA disabled successfully"))
    }

    @PostMapping("/regenerate-backup")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Regenerate backup codes", description = "Generates new backup codes and invalidates old ones")
    fun regenerateBackupCodes(authentication: Authentication): ResponseEntity<BackupCodesResponse> {
        val userId = UUID.fromString(authentication.name)
        val backupCodes = mfaService.regenerateBackupCodes(userId)

        return ResponseEntity.ok(
            BackupCodesResponse(
                backupCodes = backupCodes,
                count = backupCodes.size
            )
        )
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get MFA status", description = "Returns MFA status and backup codes count")
    fun getMfaStatus(authentication: Authentication): ResponseEntity<MfaStatusResponse> {
        val userId = UUID.fromString(authentication.name)
        val enabled = mfaService.isMfaEnabled(userId)
        val unusedBackupCodesCount = if (enabled) {
            mfaService.getUnusedBackupCodesCount(userId)
        } else {
            0L
        }

        return ResponseEntity.ok(
            MfaStatusResponse(
                enabled = enabled,
                unusedBackupCodesCount = unusedBackupCodesCount
            )
        )
    }
}
