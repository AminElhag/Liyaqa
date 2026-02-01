package com.liyaqa.auth.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "refresh_tokens")
class RefreshToken(
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

    @Column(name = "absolute_expires_at", nullable = false)
    val absoluteExpiresAt: Instant,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null,

    @Column(name = "device_info")
    val deviceInfo: String? = null
) {
    /**
     * Checks if the token has expired.
     */
    fun isExpired(): Boolean = Instant.now().isAfter(expiresAt)

    /**
     * Checks if the absolute session timeout has been exceeded.
     * This enforces a maximum session duration regardless of token refreshes.
     */
    fun isAbsoluteExpired(): Boolean = Instant.now().isAfter(absoluteExpiresAt)

    /**
     * Checks if the token has been revoked.
     */
    fun isRevoked(): Boolean = revokedAt != null

    /**
     * Checks if the token is still valid (not expired, not absolute expired, and not revoked).
     */
    fun isValid(): Boolean = !isExpired() && !isAbsoluteExpired() && !isRevoked()

    /**
     * Revokes this refresh token.
     */
    fun revoke() {
        revokedAt = Instant.now()
    }
}