package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.TenantDeactivationLog
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataTenantDeactivationLogRepository : JpaRepository<TenantDeactivationLog, UUID> {
    fun findByTenantIdOrderByCreatedAtDesc(tenantId: UUID): List<TenantDeactivationLog>
    fun findFirstByTenantIdOrderByCreatedAtDesc(tenantId: UUID): Optional<TenantDeactivationLog>
}

@Repository
class JpaTenantDeactivationLogRepository(
    private val springDataRepository: SpringDataTenantDeactivationLogRepository
) : TenantDeactivationLogRepository {

    override fun save(log: TenantDeactivationLog): TenantDeactivationLog =
        springDataRepository.save(log)

    override fun findByTenantId(tenantId: UUID): List<TenantDeactivationLog> =
        springDataRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)

    override fun findLatestByTenantId(tenantId: UUID): Optional<TenantDeactivationLog> =
        springDataRepository.findFirstByTenantIdOrderByCreatedAtDesc(tenantId)
}
