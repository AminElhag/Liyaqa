package com.liyaqa.auth.domain.model.oauth

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import java.util.UUID

/**
 * OAuth 2.0 / OpenID Connect provider configuration.
 * Allows organizations to configure SSO with external identity providers.
 */
@Entity
@Table(name = "oauth_providers")
class OAuthProvider(
    id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id")
    val organizationId: UUID? = null,

    @Column(name = "provider", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    var provider: ProviderType,

    @Column(name = "client_id", nullable = false)
    var clientId: String,

    @Column(name = "client_secret", nullable = false, columnDefinition = "TEXT")
    var clientSecret: String, // Should be encrypted at rest

    @Column(name = "authorization_uri", length = 500)
    var authorizationUri: String? = null,

    @Column(name = "token_uri", length = 500)
    var tokenUri: String? = null,

    @Column(name = "user_info_uri", length = 500)
    var userInfoUri: String? = null,

    @Column(name = "scopes", columnDefinition = "TEXT")
    var scopes: String? = null, // JSON array of scopes

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = true,

    @Column(name = "auto_provision", nullable = false)
    var autoProvision: Boolean = false, // Auto-create users on first login

    @Column(name = "display_name", length = 100)
    var displayName: String? = null,

    @Column(name = "icon_url", length = 500)
    var iconUrl: String? = null

) : BaseEntity(id) {

    /**
     * Enables this OAuth provider.
     */
    fun enable() {
        enabled = true
    }

    /**
     * Disables this OAuth provider.
     */
    fun disable() {
        enabled = false
    }

    /**
     * Gets the redirect URI for this provider.
     * Format: {baseUrl}/api/auth/oauth/callback/{providerId}
     */
    fun getRedirectUri(baseUrl: String): String {
        return "$baseUrl/api/auth/oauth/callback/$id"
    }

    /**
     * Gets the scopes as a list.
     */
    fun getScopesList(): List<String> {
        if (scopes.isNullOrBlank()) return emptyList()
        // Simple JSON array parsing: ["scope1", "scope2"]
        return scopes!!.trim()
            .removeSurrounding("[", "]")
            .split(",")
            .map { it.trim().removeSurrounding("\"") }
            .filter { it.isNotBlank() }
    }

    /**
     * Sets the scopes from a list.
     */
    fun setScopesList(scopeList: List<String>) {
        scopes = scopeList.joinToString(",", "[", "]") { "\"$it\"" }
    }
}

/**
 * Supported OAuth provider types.
 */
enum class ProviderType {
    GOOGLE,
    MICROSOFT,
    OKTA,
    GITHUB,
    CUSTOM
}
