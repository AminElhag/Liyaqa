package com.liyaqa.equipment.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "equipment_provider_configs")
class EquipmentProviderConfig(
    @Column(name = "provider_id", nullable = false)
    val providerId: UUID,

    @Column(name = "api_key_encrypted")
    var apiKeyEncrypted: String? = null,

    @Column(name = "api_secret_encrypted")
    var apiSecretEncrypted: String? = null,

    @Column(name = "oauth_client_id")
    var oauthClientId: String? = null,

    @Column(name = "oauth_client_secret_encrypted")
    var oauthClientSecretEncrypted: String? = null,

    @Column(name = "oauth_access_token_encrypted")
    var oauthAccessTokenEncrypted: String? = null,

    @Column(name = "oauth_refresh_token_encrypted")
    var oauthRefreshTokenEncrypted: String? = null,

    @Column(name = "oauth_token_expires_at")
    var oauthTokenExpiresAt: Instant? = null,

    @Column(name = "webhook_secret_encrypted")
    var webhookSecretEncrypted: String? = null,

    @Column(name = "custom_config")
    var customConfig: String = "{}",

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "last_sync_at")
    var lastSyncAt: Instant? = null,

    @Column(name = "sync_enabled", nullable = false)
    var syncEnabled: Boolean = true,

    @Column(name = "sync_interval_minutes", nullable = false)
    var syncIntervalMinutes: Int = 60
) : BaseEntity() {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", insertable = false, updatable = false)
    var provider: EquipmentProvider? = null

    fun isTokenExpired(): Boolean {
        return oauthTokenExpiresAt?.isBefore(Instant.now()) ?: true
    }

    fun updateSyncTime() {
        lastSyncAt = Instant.now()
    }
}
