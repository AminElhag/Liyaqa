package com.liyaqa.wearables.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.*

/**
 * Represents a member's connection to a wearable platform.
 * Stores OAuth tokens and sync status.
 */
@Entity
@Table(
    name = "member_wearable_connections",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["tenant_id", "member_id", "platform_id"])
    ]
)
class MemberWearableConnection(
    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "platform_id", nullable = false)
    val platformId: UUID,

    @Column(name = "external_user_id")
    var externalUserId: String? = null,

    @Column(name = "external_username")
    var externalUsername: String? = null,

    @Column(name = "oauth_access_token_encrypted")
    var oauthAccessTokenEncrypted: String? = null,

    @Column(name = "oauth_refresh_token_encrypted")
    var oauthRefreshTokenEncrypted: String? = null,

    @Column(name = "token_expires_at")
    var tokenExpiresAt: Instant? = null,

    @Column(name = "sync_enabled", nullable = false)
    var syncEnabled: Boolean = true,

    @Column(name = "last_sync_at")
    var lastSyncAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "last_sync_status")
    var lastSyncStatus: SyncStatus? = null
) : BaseEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "platform_id", insertable = false, updatable = false)
    var platform: WearablePlatform? = null

    fun isTokenExpired(): Boolean {
        return tokenExpiresAt?.isBefore(Instant.now()) ?: true
    }

    fun hasValidTokens(): Boolean {
        return oauthAccessTokenEncrypted != null && !isTokenExpired()
    }

    fun updateSyncStatus(status: SyncStatus) {
        lastSyncAt = Instant.now()
        lastSyncStatus = status
    }

    fun updateTokens(accessToken: String, refreshToken: String?, expiresAt: Instant?) {
        oauthAccessTokenEncrypted = accessToken
        refreshToken?.let { oauthRefreshTokenEncrypted = it }
        tokenExpiresAt = expiresAt
    }

    fun disconnect() {
        oauthAccessTokenEncrypted = null
        oauthRefreshTokenEncrypted = null
        tokenExpiresAt = null
        syncEnabled = false
    }
}
