package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.DataExportRequest
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.Optional
import java.util.UUID

interface DataExportRequestRepository {
    fun save(request: DataExportRequest): DataExportRequest
    fun findById(id: UUID): Optional<DataExportRequest>
    fun findAll(pageable: Pageable): Page<DataExportRequest>
    fun findByStatus(status: DataExportRequestStatus, pageable: Pageable): Page<DataExportRequest>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<DataExportRequest>
}
