package com.liyaqa.scheduling.infrastructure.persistence

import com.liyaqa.scheduling.domain.model.GxSettings
import com.liyaqa.scheduling.domain.ports.GxSettingsRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataGxSettingsRepository : JpaRepository<GxSettings, UUID> {
    fun findByTenantId(tenantId: UUID): Optional<GxSettings>
    fun existsByTenantId(tenantId: UUID): Boolean
}

@Repository
class JpaGxSettingsRepository(
    private val springDataRepository: SpringDataGxSettingsRepository
) : GxSettingsRepository {

    override fun save(gxSettings: GxSettings): GxSettings =
        springDataRepository.save(gxSettings)

    override fun findById(id: UUID): Optional<GxSettings> =
        springDataRepository.findById(id)

    override fun findByTenantId(tenantId: UUID): Optional<GxSettings> =
        springDataRepository.findByTenantId(tenantId)

    override fun existsByTenantId(tenantId: UUID): Boolean =
        springDataRepository.existsByTenantId(tenantId)
}
