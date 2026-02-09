package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTenantFeatureOverrideRepository : JpaRepository<TenantFeatureOverride, UUID> {
    fun findByTenantId(tenantId: UUID): List<TenantFeatureOverride>
    fun findByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String): Optional<TenantFeatureOverride>
    fun deleteByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String)
}

@Repository
class JpaTenantFeatureOverrideRepository(
    private val springDataRepository: SpringDataTenantFeatureOverrideRepository
) : TenantFeatureOverrideRepository {

    override fun save(override: TenantFeatureOverride): TenantFeatureOverride =
        springDataRepository.save(override)

    override fun findByTenantId(tenantId: UUID): List<TenantFeatureOverride> =
        springDataRepository.findByTenantId(tenantId)

    override fun findByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String): Optional<TenantFeatureOverride> =
        springDataRepository.findByTenantIdAndFeatureKey(tenantId, featureKey)

    override fun deleteByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String) =
        springDataRepository.deleteByTenantIdAndFeatureKey(tenantId, featureKey)
}
