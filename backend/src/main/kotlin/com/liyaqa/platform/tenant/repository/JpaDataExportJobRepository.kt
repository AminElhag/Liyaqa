package com.liyaqa.platform.tenant.repository

import com.liyaqa.platform.tenant.model.DataExportJob
import com.liyaqa.platform.tenant.model.DataExportStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataDataExportJobRepository : JpaRepository<DataExportJob, UUID> {
    fun findByTenantIdOrderByCreatedAtDesc(tenantId: UUID): List<DataExportJob>
    fun findByTenantIdAndStatus(tenantId: UUID, status: DataExportStatus): List<DataExportJob>
    fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<DataExportStatus>): Boolean
}

@Repository
class JpaDataExportJobRepository(
    private val springDataRepository: SpringDataDataExportJobRepository
) : DataExportJobRepository {

    override fun save(job: DataExportJob): DataExportJob =
        springDataRepository.save(job)

    override fun findById(id: UUID): Optional<DataExportJob> =
        springDataRepository.findById(id)

    override fun findByTenantId(tenantId: UUID): List<DataExportJob> =
        springDataRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)

    override fun findByTenantIdAndStatus(tenantId: UUID, status: DataExportStatus): List<DataExportJob> =
        springDataRepository.findByTenantIdAndStatus(tenantId, status)

    override fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<DataExportStatus>): Boolean =
        springDataRepository.existsByTenantIdAndStatusIn(tenantId, statuses)
}
