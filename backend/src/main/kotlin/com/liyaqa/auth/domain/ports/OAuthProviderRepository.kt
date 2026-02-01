package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import java.util.UUID

/**
 * Repository interface for OAuth providers.
 */
interface OAuthProviderRepository {
    /**
     * Saves an OAuth provider.
     */
    fun save(provider: OAuthProvider): OAuthProvider

    /**
     * Finds a provider by ID (nullable version of JpaRepository's findById).
     */
    fun findByIdOrNull(id: UUID): OAuthProvider?

    /**
     * Finds all enabled providers for an organization.
     */
    fun findEnabledByOrganizationId(organizationId: UUID?): List<OAuthProvider>

    /**
     * Finds all providers for an organization.
     */
    fun findAllByOrganizationId(organizationId: UUID?): List<OAuthProvider>

    /**
     * Finds a provider by type and organization.
     */
    fun findByProviderAndOrganizationId(provider: ProviderType, organizationId: UUID?): OAuthProvider?

    /**
     * Checks if a provider exists.
     */
    fun existsById(id: UUID): Boolean

    /**
     * Deletes a provider by ID.
     */
    fun deleteById(id: UUID)
}
