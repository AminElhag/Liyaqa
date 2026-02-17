package com.liyaqa.scheduling.domain.ports

import com.liyaqa.scheduling.domain.model.GxSettings
import java.util.Optional
import java.util.UUID

interface GxSettingsRepository {
    fun save(gxSettings: GxSettings): GxSettings
    fun findById(id: UUID): Optional<GxSettings>
    fun findByTenantId(tenantId: UUID): Optional<GxSettings>
    fun existsByTenantId(tenantId: UUID): Boolean
}
