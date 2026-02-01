package com.liyaqa.auth.application.services

import com.liyaqa.auth.domain.model.PasswordHistory
import com.liyaqa.auth.domain.ports.PasswordHistoryRepository
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

/**
 * Result of password validation.
 */
data class PasswordValidationResult(
    val isValid: Boolean,
    val violations: List<String> = emptyList()
) {
    companion object {
        fun valid() = PasswordValidationResult(true, emptyList())
        fun invalid(violations: List<String>) = PasswordValidationResult(false, violations)
    }
}

/**
 * Configuration for password policy rules.
 */
data class PasswordPolicyConfig(
    val minLength: Int = 8,
    val requireUppercase: Boolean = true,
    val requireLowercase: Boolean = true,
    val requireDigit: Boolean = true,
    val requireSpecialChar: Boolean = true,
    val preventPasswordReuse: Boolean = true,
    val passwordHistoryCount: Int = 5,
    val checkCommonPasswords: Boolean = true
)

/**
 * Service responsible for password policy enforcement and validation.
 *
 * Enforces:
 * - Minimum length (default 8 characters, configurable to 12+ for platform users)
 * - Character complexity (uppercase, lowercase, digit, special character)
 * - Common password dictionary check (top 10k passwords)
 * - Password history (prevent reuse of last 5 passwords)
 */
@Service
class PasswordPolicyService(
    private val passwordHistoryRepository: PasswordHistoryRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(PasswordPolicyService::class.java)

    // Top 100 most common passwords (subset of top 10k for performance)
    // In production, this should be loaded from a file or database
    private val commonPasswords = setOf(
        "password", "123456", "12345678", "qwerty", "abc123", "monkey", "1234567",
        "letmein", "trustno1", "dragon", "baseball", "111111", "iloveyou", "master",
        "sunshine", "ashley", "bailey", "passw0rd", "shadow", "123123", "654321",
        "superman", "qazwsx", "michael", "football", "welcome", "jesus", "ninja",
        "mustang", "password1", "123456789", "adobe123", "admin", "1234567890",
        "photoshop", "1234", "12345", "password123", "welcome123", "admin123",
        "root", "toor", "pass", "test", "guest", "oracle", "changeme", "123",
        "login", "temp", "temppass", "qwerty123", "password1!", "P@ssw0rd", "P@ssword",
        "Pass123", "Admin123", "Welcome1", "Password!", "Test123", "User123"
    )

    /**
     * Validates a password against the policy rules.
     *
     * @param password The password to validate
     * @param config The policy configuration to use
     * @return ValidationResult with isValid flag and list of violations
     */
    fun validatePassword(
        password: String,
        config: PasswordPolicyConfig = PasswordPolicyConfig()
    ): PasswordValidationResult {
        val violations = mutableListOf<String>()

        // Check minimum length
        if (password.length < config.minLength) {
            violations.add("Password must be at least ${config.minLength} characters long")
        }

        // Check for uppercase letter
        if (config.requireUppercase && !password.any { it.isUpperCase() }) {
            violations.add("Password must contain at least one uppercase letter")
        }

        // Check for lowercase letter
        if (config.requireLowercase && !password.any { it.isLowerCase() }) {
            violations.add("Password must contain at least one lowercase letter")
        }

        // Check for digit
        if (config.requireDigit && !password.any { it.isDigit() }) {
            violations.add("Password must contain at least one number")
        }

        // Check for special character
        if (config.requireSpecialChar && !password.any { !it.isLetterOrDigit() }) {
            violations.add("Password must contain at least one special character (!@#$%^&* etc.)")
        }

        // Check against common passwords
        if (config.checkCommonPasswords && isCommonPassword(password)) {
            violations.add("Password is too common. Please choose a more unique password")
        }

        return if (violations.isEmpty()) {
            PasswordValidationResult.valid()
        } else {
            PasswordValidationResult.invalid(violations)
        }
    }

    /**
     * Validates a password and checks against password history.
     *
     * @param password The new password to validate
     * @param userId The user ID to check password history for
     * @param config The policy configuration to use
     * @return ValidationResult with isValid flag and list of violations
     */
    fun validatePasswordWithHistory(
        password: String,
        userId: UUID,
        config: PasswordPolicyConfig = PasswordPolicyConfig()
    ): PasswordValidationResult {
        val result = validatePassword(password, config)

        if (!result.isValid) {
            return result
        }

        // Check password history if enabled
        if (config.preventPasswordReuse) {
            val isReused = isPasswordReused(password, userId, config.passwordHistoryCount)
            if (isReused) {
                return PasswordValidationResult.invalid(
                    listOf("Password has been used recently. Please choose a different password")
                )
            }
        }

        return PasswordValidationResult.valid()
    }

    /**
     * Records a password in the user's password history.
     * Automatically cleans up old history entries beyond the configured limit.
     *
     * @param userId The user ID
     * @param passwordHash The hashed password to record
     * @param config The policy configuration
     */
    fun recordPasswordInHistory(
        userId: UUID,
        passwordHash: String,
        config: PasswordPolicyConfig = PasswordPolicyConfig()
    ) {
        val historyEntry = PasswordHistory(
            userId = userId,
            passwordHash = passwordHash,
            createdAt = Instant.now()
        )

        passwordHistoryRepository.save(historyEntry)

        // Clean up old history entries
        cleanupPasswordHistory(userId, config.passwordHistoryCount)

        logger.debug("Recorded password in history for user: $userId")
    }

    /**
     * Checks if a password has been used recently by the user.
     *
     * @param password The plain text password to check
     * @param userId The user ID
     * @param historyCount Number of previous passwords to check
     * @return true if password was used recently, false otherwise
     */
    private fun isPasswordReused(password: String, userId: UUID, historyCount: Int): Boolean {
        val recentPasswords = passwordHistoryRepository.findRecentByUserId(userId, historyCount)

        return recentPasswords.any { history ->
            passwordEncoder.matches(password, history.passwordHash)
        }
    }

    /**
     * Cleans up password history keeping only the most recent entries.
     *
     * @param userId The user ID
     * @param keepCount Number of recent passwords to keep
     */
    private fun cleanupPasswordHistory(userId: UUID, keepCount: Int) {
        val allHistory = passwordHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId)

        if (allHistory.size > keepCount) {
            val toDelete = allHistory.drop(keepCount)
            passwordHistoryRepository.deleteAll(toDelete)
            logger.debug("Cleaned up ${toDelete.size} old password history entries for user: $userId")
        }
    }

    /**
     * Checks if a password is in the common passwords list.
     * Performs case-insensitive comparison.
     *
     * @param password The password to check
     * @return true if password is common, false otherwise
     */
    private fun isCommonPassword(password: String): Boolean {
        return commonPasswords.contains(password.lowercase())
    }

    /**
     * Gets the password policy configuration for a specific user type.
     * Platform users have stricter requirements.
     *
     * @param isPlatformUser Whether this is a platform user
     * @return PasswordPolicyConfig with appropriate settings
     */
    fun getPolicyForUser(isPlatformUser: Boolean): PasswordPolicyConfig {
        return if (isPlatformUser) {
            // Stricter policy for platform users
            PasswordPolicyConfig(
                minLength = 12,
                requireUppercase = true,
                requireLowercase = true,
                requireDigit = true,
                requireSpecialChar = true,
                preventPasswordReuse = true,
                passwordHistoryCount = 5,
                checkCommonPasswords = true
            )
        } else {
            // Standard policy for regular users
            PasswordPolicyConfig(
                minLength = 8,
                requireUppercase = true,
                requireLowercase = true,
                requireDigit = true,
                requireSpecialChar = true,
                preventPasswordReuse = true,
                passwordHistoryCount = 5,
                checkCommonPasswords = true
            )
        }
    }

    /**
     * Calculates password strength score (0-100).
     * Used for frontend password strength indicator.
     *
     * @param password The password to evaluate
     * @return Strength score from 0 (very weak) to 100 (very strong)
     */
    fun calculatePasswordStrength(password: String): Int {
        var score = 0

        // Length score (up to 40 points)
        score += when {
            password.length >= 16 -> 40
            password.length >= 12 -> 30
            password.length >= 8 -> 20
            else -> password.length * 2
        }

        // Complexity score (up to 40 points)
        if (password.any { it.isUpperCase() }) score += 10
        if (password.any { it.isLowerCase() }) score += 10
        if (password.any { it.isDigit() }) score += 10
        if (password.any { !it.isLetterOrDigit() }) score += 10

        // Variety score (up to 20 points)
        val uniqueChars = password.toSet().size
        score += when {
            uniqueChars >= 12 -> 20
            uniqueChars >= 8 -> 15
            uniqueChars >= 6 -> 10
            else -> 5
        }

        // Penalty for common passwords
        if (isCommonPassword(password)) {
            score = (score * 0.3).toInt() // 70% penalty
        }

        return score.coerceIn(0, 100)
    }
}
