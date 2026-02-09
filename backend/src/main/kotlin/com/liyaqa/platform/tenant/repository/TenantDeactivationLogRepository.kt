package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.TenantDeactivationLog
import java.util.Optional
import java.util.UUID

interface TenantDeactivationLogRepository {
    fun save(log: TenantDeactivationLog): TenantDeactivationLog
    fun findByTenantId(tenantId: UUID): List<TenantDeactivationLog>
    fun findLatestByTenantId(tenantId: UUID): Optional<TenantDeactivationLog>
}
