package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.DataExportRequest
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

interface SpringDataDataExportRequestRepository : JpaRepository<DataExportRequest, UUID> {
    fun findByStatus(status: DataExportRequestStatus, pageable: Pageable): Page<DataExportRequest>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataExportRequest>
}

@Repository
class JpaDataExportRequestRepository(
    private val springDataRepository: SpringDataDataExportRequestRepository
) : DataExportRequestRepository {

    override fun save(request: DataExportRequest): DataExportRequest =
        springDataRepository.save(request)

    override fun findById(id: UUID): Optional<DataExportRequest> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<DataExportRequest> =
        springDataRepository.findAll(pageable)

    override fun findByStatus(status: DataExportRequestStatus, pageable: Pageable): Page<DataExportRequest> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataExportRequest> =
        springDataRepository.findByTenantId(tenantId, pageable)
}
