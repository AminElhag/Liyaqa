package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import com.liyaqa.auth.domain.ports.OAuthProviderRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataOAuthProviderRepository : JpaRepository<OAuthProvider, UUID> {

    @Query("SELECT p FROM OAuthProvider p WHERE p.enabled = true AND (:orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId)")
    fun findEnabledByOrganizationId(@Param("orgId") organizationId: UUID?): List<OAuthProvider>

    @Query("SELECT p FROM OAuthProvider p WHERE :orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId")
    fun findAllByOrganizationId(@Param("orgId") organizationId: UUID?): List<OAuthProvider>

    @Query("SELECT p FROM OAuthProvider p WHERE p.provider = :provider AND (:orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId)")
    fun findByProviderAndOrganizationId(
        @Param("provider") provider: ProviderType,
        @Param("orgId") organizationId: UUID?
    ): OAuthProvider?

    @Query("SELECT p FROM OAuthProvider p WHERE p.organizationId = :orgId AND p.enabled = true")
    fun findByOrganizationIdAndEnabledTrue(@Param("orgId") organizationId: UUID): List<OAuthProvider>

    @Query("SELECT p FROM OAuthProvider p WHERE p.organizationId = :orgId AND p.provider = :provider AND p.enabled = true")
    fun findByOrganizationIdAndProviderAndEnabledTrue(
        @Param("orgId") organizationId: UUID,
        @Param("provider") provider: ProviderType
    ): OAuthProvider?
}

@Repository
class JpaOAuthProviderRepository(
    private val springDataRepository: SpringDataOAuthProviderRepository
) : OAuthProviderRepository {

    override fun save(provider: OAuthProvider): OAuthProvider =
        springDataRepository.save(provider)

    override fun findById(id: UUID): java.util.Optional<OAuthProvider> =
        springDataRepository.findById(id)

    override fun findByIdOrNull(id: UUID): OAuthProvider? =
        springDataRepository.findById(id).orElse(null)

    override fun findAll(): List<OAuthProvider> =
        springDataRepository.findAll()

    override fun delete(provider: OAuthProvider) =
        springDataRepository.delete(provider)

    override fun findEnabledByOrganizationId(organizationId: UUID?): List<OAuthProvider> =
        springDataRepository.findEnabledByOrganizationId(organizationId)

    override fun findAllByOrganizationId(organizationId: UUID?): List<OAuthProvider> =
        springDataRepository.findAllByOrganizationId(organizationId)

    override fun findByProviderAndOrganizationId(provider: ProviderType, organizationId: UUID?): OAuthProvider? =
        springDataRepository.findByProviderAndOrganizationId(provider, organizationId)

    override fun findByOrganizationIdAndEnabledTrue(organizationId: UUID): List<OAuthProvider> =
        springDataRepository.findByOrganizationIdAndEnabledTrue(organizationId)

    override fun findByOrganizationIdAndProviderAndEnabledTrue(organizationId: UUID, provider: ProviderType): OAuthProvider? =
        springDataRepository.findByOrganizationIdAndProviderAndEnabledTrue(organizationId, provider)
}
