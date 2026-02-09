package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.TenantFeatureOverride
import java.util.Optional
import java.util.UUID

interface TenantFeatureOverrideRepository {
    fun save(override: TenantFeatureOverride): TenantFeatureOverride
    fun findByTenantId(tenantId: UUID): List<TenantFeatureOverride>
    fun findByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String): Optional<TenantFeatureOverride>
    fun deleteByTenantIdAndFeatureKey(tenantId: UUID, featureKey: String)
}
