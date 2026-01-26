package com.liyaqa.branding.domain.ports

import com.liyaqa.branding.domain.model.BrandingConfig
import java.util.UUID

/**
 * Port (interface) for branding configuration persistence.
 * Implementations are in the infrastructure layer.
 */
interface BrandingConfigRepository {
    /**
     * Find branding config by tenant ID.
     */
    fun findByTenantId(tenantId: UUID): BrandingConfig?

    /**
     * Save branding config.
     */
    fun save(config: BrandingConfig): BrandingConfig

    /**
     * Check if branding config exists for tenant.
     */
    fun existsByTenantId(tenantId: UUID): Boolean
}
