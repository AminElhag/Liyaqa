package com.liyaqa.platform.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.security.MessageDigest
import java.security.SecureRandom
import java.time.Instant
import java.util.UUID

/**
 * Platform passwordless login token entity.
 * Represents one-time OTP codes sent via email for passwordless authentication.
 */
@Entity
@Table(name = "platform_login_tokens")
class PlatformLoginToken(
    @Id
    @Column(name = "id")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "email", nullable = false, length = 255)
    val email: String,

    @Column(name = "code_hash", nullable = false, length = 64)
    val codeHash: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "used_at")
    var usedAt: Instant? = null,

    @Column(name = "failed_attempts", nullable = false)
    var failedAttempts: Int = 0
) {

    // ============================================
    // Validation
    // ============================================

    /**
     * Check if the token has expired.
     */
    fun isExpired(): Boolean = Instant.now().isAfter(expiresAt)

    /**
     * Check if the token has been used.
     */
    fun isUsed(): Boolean = usedAt != null

    /**
     * Check if the token is locked due to too many failed attempts.
     */
    fun isLocked(): Boolean = failedAttempts >= MAX_FAILED_ATTEMPTS

    /**
     * Check if the token is valid (not expired, not used, not locked).
     */
    fun isValid(): Boolean = !isExpired() && !isUsed() && !isLocked()

    /**
     * Verify if the provided code matches this token's hash.
     */
    fun verifyCode(code: String): Boolean {
        val providedHash = hashCode(code)
        return codeHash == providedHash
    }

    // ============================================
    // State Management
    // ============================================

    /**
     * Mark the token as used.
     */
    fun markAsUsed() {
        usedAt = Instant.now()
    }

    /**
     * Record a failed verification attempt.
     */
    fun recordFailedAttempt() {
        failedAttempts++
    }

    companion object {
        private const val CODE_LENGTH = 6
        private const val MAX_FAILED_ATTEMPTS = 5
        private const val VALIDITY_MINUTES = 10L

        /**
         * Generate a random 6-digit numeric code.
         * TEMPORARY: Returns static code for testing (SMTP blocked on DigitalOcean)
         */
        fun generateCode(): String {
            // TODO: Remove this static code once SMTP is working
            return "654321"

            // Original random code generation (commented out for testing)
            // val random = SecureRandom()
            // val code = StringBuilder()
            // repeat(CODE_LENGTH) {
            //     code.append(random.nextInt(10))
            // }
            // return code.toString()
        }

        /**
         * Hash a code using SHA-256.
         */
        fun hashCode(code: String): String {
            val digest = MessageDigest.getInstance("SHA-256")
            val hashBytes = digest.digest(code.toByteArray())
            return hashBytes.joinToString("") { "%02x".format(it) }
        }

        /**
         * Create a new login token.
         */
        fun create(email: String, code: String): PlatformLoginToken {
            val now = Instant.now()
            return PlatformLoginToken(
                email = email.lowercase(),
                codeHash = hashCode(code),
                expiresAt = now.plusSeconds(VALIDITY_MINUTES * 60),
                createdAt = now
            )
        }
    }
}
