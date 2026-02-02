package com.liyaqa.auth.domain.ports

import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import java.util.UUID

interface OAuthProviderRepository {

    fun save(provider: OAuthProvider): OAuthProvider
    fun findById(id: UUID): java.util.Optional<OAuthProvider>
    fun findByIdOrNull(id: UUID): OAuthProvider?
    fun findAll(): List<OAuthProvider>
    fun delete(provider: OAuthProvider)

    fun findEnabledByOrganizationId(organizationId: UUID?): List<OAuthProvider>
    fun findAllByOrganizationId(organizationId: UUID?): List<OAuthProvider>
    fun findByProviderAndOrganizationId(provider: ProviderType, organizationId: UUID?): OAuthProvider?

    // Legacy methods for backwards compatibility
    fun findByOrganizationIdAndEnabledTrue(organizationId: UUID): List<OAuthProvider>
    fun findByOrganizationIdAndProviderAndEnabledTrue(organizationId: UUID, provider: ProviderType): OAuthProvider?
}
