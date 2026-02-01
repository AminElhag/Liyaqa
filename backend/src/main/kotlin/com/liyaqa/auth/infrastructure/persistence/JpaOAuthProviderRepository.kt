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
interface JpaOAuthProviderRepository : JpaRepository<OAuthProvider, UUID>, OAuthProviderRepository {

    @Query("SELECT p FROM OAuthProvider p WHERE p.enabled = true AND (:orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId)")
    override fun findEnabledByOrganizationId(@Param("orgId") organizationId: UUID?): List<OAuthProvider>

    @Query("SELECT p FROM OAuthProvider p WHERE :orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId")
    override fun findAllByOrganizationId(@Param("orgId") organizationId: UUID?): List<OAuthProvider>

    @Query("SELECT p FROM OAuthProvider p WHERE p.provider = :provider AND (:orgId IS NULL AND p.organizationId IS NULL OR p.organizationId = :orgId)")
    override fun findByProviderAndOrganizationId(
        @Param("provider") provider: ProviderType,
        @Param("orgId") organizationId: UUID?
    ): OAuthProvider?
}

@org.springframework.stereotype.Component
class OAuthProviderRepositoryAdapter(
    private val jpaRepository: JpaOAuthProviderRepository
) : OAuthProviderRepository by jpaRepository {
    
    override fun findByIdOrNull(id: UUID): OAuthProvider? {
        return jpaRepository.findById(id).orElse(null)
    }
}
