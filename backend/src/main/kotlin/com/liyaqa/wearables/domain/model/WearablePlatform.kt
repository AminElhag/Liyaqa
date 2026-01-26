package com.liyaqa.wearables.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

/**
 * Wearable platform definition (seed data, non-tenant specific).
 * Represents supported wearable platforms like Fitbit, Garmin, etc.
 */
@Entity
@Table(name = "wearable_platforms")
class WearablePlatform(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, unique = true)
    val name: String,

    @Column(name = "display_name", nullable = false)
    var displayName: String,

    @Column(name = "api_base_url")
    var apiBaseUrl: String? = null,

    @Column(name = "oauth_auth_url")
    var oauthAuthUrl: String? = null,

    @Column(name = "oauth_token_url")
    var oauthTokenUrl: String? = null,

    @Column(name = "oauth_scopes")
    var oauthScopes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false)
    val authType: WearableAuthType = WearableAuthType.OAUTH2,

    @Column(name = "documentation_url")
    var documentationUrl: String? = null,

    @Column(name = "logo_url")
    var logoUrl: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    fun supportsOAuth(): Boolean = authType == WearableAuthType.OAUTH2

    fun requiresDeviceSDK(): Boolean = authType == WearableAuthType.DEVICE_SDK
}
