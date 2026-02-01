package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.MfaBackupCode
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.ports.MfaBackupCodeRepository
import com.liyaqa.auth.domain.ports.UserRepository
import com.warrenstrange.googleauth.GoogleAuthenticator
import com.warrenstrange.googleauth.GoogleAuthenticatorConfig
import com.warrenstrange.googleauth.GoogleAuthenticatorKey
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.SecureRandom
import java.util.UUID

/**
 * Response containing MFA setup information.
 */
data class MfaSetupResponse(
    val secret: String,
    val qrCodeUrl: String,
    val backupCodes: List<String>
)

/**
 * Service for managing Multi-Factor Authentication (MFA) using TOTP.
 */
@Service
@Transactional
class MfaService(
    private val userRepository: UserRepository,
    private val backupCodeRepository: MfaBackupCodeRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(MfaService::class.java)
    private val googleAuthenticator: GoogleAuthenticator
    private val secureRandom = SecureRandom()

    init {
        val config = GoogleAuthenticatorConfig.GoogleAuthenticatorConfigBuilder()
            .setTimeStepSizeInMillis(30000) // 30 seconds
            .setWindowSize(1) // Allow 1 time window before/after
            .setCodeDigits(6) // 6-digit codes
            .build()
        googleAuthenticator = GoogleAuthenticator(config)
    }

    /**
     * Initiates MFA setup for a user.
     * Generates a TOTP secret, QR code URL, and backup codes.
     * Does not enable MFA until verification is complete.
     *
     * @param userId The user ID
     * @return MfaSetupResponse with secret, QR code, and backup codes
     */
    fun setupMfa(userId: UUID): MfaSetupResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (user.mfaEnabled) {
            throw IllegalStateException("MFA is already enabled for this user")
        }

        // Generate TOTP secret
        val key: GoogleAuthenticatorKey = googleAuthenticator.createCredentials()
        val secret = key.key

        // Generate QR code URL for authenticator apps
        val qrCodeUrl = GoogleAuthenticatorQRGenerator.getOtpAuthTotpURL(
            "Liyaqa",
            user.email,
            key
        )

        // Generate 10 backup codes
        val backupCodes = generateBackupCodes(10)

        logger.info("MFA setup initiated for user: $userId")

        return MfaSetupResponse(
            secret = secret,
            qrCodeUrl = qrCodeUrl,
            backupCodes = backupCodes
        )
    }

    /**
     * Verifies MFA setup by validating a TOTP code.
     * Enables MFA and saves backup codes if the code is valid.
     *
     * @param userId The user ID
     * @param secret The TOTP secret from setup
     * @param code The 6-digit TOTP code from authenticator app
     * @param backupCodes The backup codes to save
     * @return true if verification successful and MFA enabled
     */
    fun verifyMfaSetup(userId: UUID, secret: String, code: String, backupCodes: List<String>): Boolean {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (user.mfaEnabled) {
            throw IllegalStateException("MFA is already enabled for this user")
        }

        // Verify the TOTP code
        val codeInt = code.toIntOrNull() ?: return false
        val isValid = googleAuthenticator.authorize(secret, codeInt)

        if (!isValid) {
            logger.warn("Invalid MFA setup code for user: $userId")
            return false
        }

        // Save backup codes
        val hashedBackupCodes = backupCodes.map { code ->
            MfaBackupCode(
                userId = userId,
                codeHash = passwordEncoder.encode(code)
            )
        }
        backupCodeRepository.saveAll(hashedBackupCodes)

        // Enable MFA
        user.enableMfa(secret, "") // backupCodesHash not used anymore, using separate table
        userRepository.save(user)

        logger.info("MFA enabled successfully for user: $userId")
        return true
    }

    /**
     * Verifies a TOTP code or backup code during login.
     *
     * @param userId The user ID
     * @param code The code to verify (6-digit TOTP or backup code)
     * @return true if code is valid
     */
    fun verifyMfaLogin(userId: UUID, code: String): Boolean {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (!user.mfaEnabled || user.mfaSecret == null) {
            throw IllegalStateException("MFA is not enabled for this user")
        }

        // Try TOTP code first (6 digits)
        if (code.length == 6 && code.all { it.isDigit() }) {
            val codeInt = code.toInt()
            if (googleAuthenticator.authorize(user.mfaSecret, codeInt)) {
                logger.info("TOTP code verified for user: $userId")
                return true
            }
        }

        // Try backup code (longer format)
        if (code.length >= 8) {
            val backupCodes = backupCodeRepository.findByUserId(userId)
            for (backupCode in backupCodes) {
                if (!backupCode.used && passwordEncoder.matches(code, backupCode.codeHash)) {
                    backupCode.markAsUsed()
                    backupCodeRepository.save(backupCode)
                    logger.info("Backup code used for user: $userId")
                    return true
                }
            }
        }

        logger.warn("Invalid MFA code for user: $userId")
        return false
    }

    /**
     * Disables MFA for a user after password verification.
     *
     * @param userId The user ID
     * @param password The user's current password for verification
     */
    fun disableMfa(userId: UUID, password: String) {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (!passwordEncoder.matches(password, user.passwordHash)) {
            throw IllegalArgumentException("Invalid password")
        }

        if (!user.mfaEnabled) {
            throw IllegalStateException("MFA is not enabled for this user")
        }

        // Delete all backup codes
        backupCodeRepository.deleteByUserId(userId)

        // Disable MFA
        user.disableMfa()
        userRepository.save(user)

        logger.info("MFA disabled for user: $userId")
    }

    /**
     * Regenerates backup codes for a user.
     * Deletes old codes and generates new ones.
     *
     * @param userId The user ID
     * @return List of new backup codes
     */
    fun regenerateBackupCodes(userId: UUID): List<String> {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }

        if (!user.mfaEnabled) {
            throw IllegalStateException("MFA is not enabled for this user")
        }

        // Delete old backup codes
        backupCodeRepository.deleteByUserId(userId)

        // Generate new backup codes
        val backupCodes = generateBackupCodes(10)

        // Save hashed backup codes
        val hashedBackupCodes = backupCodes.map { code ->
            MfaBackupCode(
                userId = userId,
                codeHash = passwordEncoder.encode(code)
            )
        }
        backupCodeRepository.saveAll(hashedBackupCodes)

        logger.info("Backup codes regenerated for user: $userId")
        return backupCodes
    }

    /**
     * Gets MFA status for a user.
     *
     * @param userId The user ID
     * @return true if MFA is enabled
     */
    @Transactional(readOnly = true)
    fun isMfaEnabled(userId: UUID): Boolean {
        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("User not found: $userId") }
        return user.mfaEnabled
    }

    /**
     * Gets the count of unused backup codes for a user.
     *
     * @param userId The user ID
     * @return Number of unused backup codes
     */
    @Transactional(readOnly = true)
    fun getUnusedBackupCodesCount(userId: UUID): Long {
        return backupCodeRepository.countUnusedByUserId(userId)
    }

    /**
     * Generates secure random backup codes.
     *
     * @param count Number of codes to generate
     * @return List of backup codes (format: XXXX-XXXX-XXXX)
     */
    private fun generateBackupCodes(count: Int): List<String> {
        val codes = mutableListOf<String>()
        val characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

        repeat(count) {
            val code = buildString {
                repeat(3) { group ->
                    if (group > 0) append("-")
                    repeat(4) {
                        append(characters[secureRandom.nextInt(characters.length)])
                    }
                }
            }
            codes.add(code)
        }

        return codes
    }
}
