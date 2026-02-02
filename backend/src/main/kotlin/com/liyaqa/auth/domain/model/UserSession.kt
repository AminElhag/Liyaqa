package com.liyaqa.auth.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.CreationTimestamp
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "user_sessions", indexes = [
    Index(name = "idx_user_sessions_user", columnList = "user_id"),
    Index(name = "idx_user_sessions_active", columnList = "user_id, is_active"),
    Index(name = "idx_user_sessions_session_id", columnList = "session_id")
])
data class UserSession(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "session_id", nullable = false, unique = true)
    val sessionId: UUID = UUID.randomUUID(),

    @Column(name = "access_token_hash", length = 64)
    val accessTokenHash: String? = null,

    @Column(name = "device_name", length = 100)
    val deviceName: String? = null,

    @Column(name = "os", length = 50)
    val os: String? = null,

    @Column(name = "browser", length = 50)
    val browser: String? = null,

    @Column(name = "ip_address", length = 45)
    val ipAddress: String,

    @Column(name = "country", length = 2)
    val country: String? = null,

    @Column(name = "city", length = 100)
    val city: String? = null,

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "last_active_at", nullable = false)
    var lastActiveAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "revoked_at")
    var revokedAt: Instant? = null
) {
    fun revoke() {
        isActive = false
        revokedAt = Instant.now()
    }

    fun updateActivity() {
        lastActiveAt = Instant.now()
    }

    fun isExpired(): Boolean {
        return Instant.now().isAfter(expiresAt)
    }
}
