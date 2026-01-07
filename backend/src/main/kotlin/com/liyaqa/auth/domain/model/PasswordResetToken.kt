package com.liyaqa.auth.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Token for password reset functionality.
 * Tokens are hashed for security and have a short expiration time.
 */
@Entity
@Table(name = "password_reset_tokens")
class PasswordResetToken(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "token_hash", nullable = false, unique = true)
    val tokenHash: String,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "used_at")
    var usedAt: Instant? = null
) {
    /**
     * Checks if the token has expired (default 1 hour).
     */
    fun isExpired(): Boolean = Instant.now().isAfter(expiresAt)

    /**
     * Checks if the token has already been used.
     */
    fun isUsed(): Boolean = usedAt != null

    /**
     * Checks if the token is still valid (not expired and not used).
     */
    fun isValid(): Boolean = !isExpired() && !isUsed()

    /**
     * Marks the token as used.
     */
    fun markUsed() {
        usedAt = Instant.now()
    }

    companion object {
        /**
         * Default expiration time for password reset tokens (1 hour).
         */
        const val DEFAULT_EXPIRATION_HOURS = 1L
    }
}
