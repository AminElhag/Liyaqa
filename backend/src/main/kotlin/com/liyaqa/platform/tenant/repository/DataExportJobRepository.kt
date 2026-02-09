package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.DataExportJob
import com.liyaqa.platform.tenant.model.DataExportStatus
import java.util.Optional
import java.util.UUID

interface DataExportJobRepository {
    fun save(job: DataExportJob): DataExportJob
    fun findById(id: UUID): Optional<DataExportJob>
    fun findByTenantId(tenantId: UUID): List<DataExportJob>
    fun findByTenantIdAndStatus(tenantId: UUID, status: DataExportStatus): List<DataExportJob>
    fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<DataExportStatus>): Boolean
}
