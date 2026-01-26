package com.liyaqa.branding.infrastructure.persistence

import com.liyaqa.branding.domain.model.BrandingConfig
import com.liyaqa.branding.domain.ports.BrandingConfigRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Spring Data JPA repository interface for BrandingConfig.
 */
interface SpringDataBrandingConfigRepository : JpaRepository<BrandingConfig, UUID> {
    @Query("SELECT b FROM BrandingConfig b WHERE b.tenantId = :tenantId")
    fun findByTenantId(@Param("tenantId") tenantId: UUID): BrandingConfig?

    @Query("SELECT COUNT(b) > 0 FROM BrandingConfig b WHERE b.tenantId = :tenantId")
    fun existsByTenantId(@Param("tenantId") tenantId: UUID): Boolean
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaBrandingConfigRepository(
    private val springDataRepository: SpringDataBrandingConfigRepository
) : BrandingConfigRepository {

    override fun findByTenantId(tenantId: UUID): BrandingConfig? {
        return springDataRepository.findByTenantId(tenantId)
    }

    override fun save(config: BrandingConfig): BrandingConfig {
        return springDataRepository.save(config)
    }

    override fun existsByTenantId(tenantId: UUID): Boolean {
        return springDataRepository.existsByTenantId(tenantId)
    }
}
