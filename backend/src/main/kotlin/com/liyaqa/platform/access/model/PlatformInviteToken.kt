package com.liyaqa.platform.access.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "platform_invite_tokens")
class PlatformInviteToken(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "email", nullable = false)
    val email: String,

    @Column(name = "token_hash", nullable = false)
    val tokenHash: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    val type: TokenType,

    @Column(name = "platform_user_id")
    val platformUserId: UUID? = null,

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "used_at")
    var usedAt: Instant? = null,

    @Column(name = "is_used", nullable = false)
    var isUsed: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    enum class TokenType {
        INVITE,
        PASSWORD_RESET
    }

    fun isExpired(): Boolean = Instant.now().isAfter(expiresAt)

    fun isValid(): Boolean = !isUsed && !isExpired()

    fun markAsUsed() {
        isUsed = true
        usedAt = Instant.now()
        updatedAt = Instant.now()
    }

    companion object {
        fun create(
            email: String,
            tokenHash: String,
            type: TokenType,
            platformUserId: UUID? = null,
            expiresAt: Instant
        ): PlatformInviteToken {
            return PlatformInviteToken(
                email = email,
                tokenHash = tokenHash,
                type = type,
                platformUserId = platformUserId,
                expiresAt = expiresAt
            )
        }

        fun hashToken(raw: String): String {
            val digest = MessageDigest.getInstance("SHA-256")
            val hashBytes = digest.digest(raw.toByteArray())
            return hashBytes.joinToString("") { "%02x".format(it) }
        }
    }
}
