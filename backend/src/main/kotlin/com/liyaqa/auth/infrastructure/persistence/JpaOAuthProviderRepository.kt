package com.liyaqa.auth.infrastructure.persistence

import com.liyaqa.auth.domain.model.oauth.OAuthProvider
import com.liyaqa.auth.domain.model.oauth.ProviderType
import com.liyaqa.auth.domain.ports.OAuthProviderRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
interface JpaOAuthProviderRepository : JpaRepository<OAuthProvider, UUID> {

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

@org.springframework.stereotype.Component
class OAuthProviderRepositoryAdapter(
    private val jpaRepository: JpaOAuthProviderRepository
) : OAuthProviderRepository {

    override fun save(provider: OAuthProvider): OAuthProvider =
        jpaRepository.save(provider)

    override fun findById(id: UUID): java.util.Optional<OAuthProvider> =
        jpaRepository.findById(id)

    override fun findByIdOrNull(id: UUID): OAuthProvider? =
        jpaRepository.findById(id).orElse(null)

    override fun findAll(): List<OAuthProvider> =
        jpaRepository.findAll()

    override fun delete(provider: OAuthProvider) =
        jpaRepository.delete(provider)

    override fun findEnabledByOrganizationId(organizationId: UUID?): List<OAuthProvider> =
        jpaRepository.findEnabledByOrganizationId(organizationId)

    override fun findAllByOrganizationId(organizationId: UUID?): List<OAuthProvider> =
        jpaRepository.findAllByOrganizationId(organizationId)

    override fun findByProviderAndOrganizationId(provider: ProviderType, organizationId: UUID?): OAuthProvider? =
        jpaRepository.findByProviderAndOrganizationId(provider, organizationId)

    override fun findByOrganizationIdAndEnabledTrue(organizationId: UUID): List<OAuthProvider> =
        jpaRepository.findByOrganizationIdAndEnabledTrue(organizationId)

    override fun findByOrganizationIdAndProviderAndEnabledTrue(organizationId: UUID, provider: ProviderType): OAuthProvider? =
        jpaRepository.findByOrganizationIdAndProviderAndEnabledTrue(organizationId, provider)
}
