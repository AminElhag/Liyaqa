package com.liyaqa.platform.compliance.service

import com.liyaqa.platform.compliance.dto.DataExportRequestResponse
import com.liyaqa.platform.compliance.dto.RejectDataExportRequest
import com.liyaqa.platform.compliance.exception.DataExportRequestNotFoundException
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import com.liyaqa.platform.compliance.repository.DataExportRequestRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class DataExportRequestService(
    private val exportRequestRepository: DataExportRequestRepository,
    private val auditService: AuditService,
    private val securityService: SecurityService
) {

    @Transactional(readOnly = true)
    fun listRequests(status: DataExportRequestStatus?, pageable: Pageable): Page<DataExportRequestResponse> {
        val page = if (status != null) {
            exportRequestRepository.findByStatus(status, pageable)
        } else {
            exportRequestRepository.findAll(pageable)
        }
        return page.map { DataExportRequestResponse.from(it) }
    }

    @Transactional(readOnly = true)
    fun getRequest(id: UUID): DataExportRequestResponse {
        val request = exportRequestRepository.findById(id)
            .orElseThrow { DataExportRequestNotFoundException(id) }
        return DataExportRequestResponse.from(request)
    }

    @Transactional
    fun approveRequest(id: UUID): DataExportRequestResponse {
        val request = exportRequestRepository.findById(id)
            .orElseThrow { DataExportRequestNotFoundException(id) }

        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        request.approve(currentUserId)
        val saved = exportRequestRepository.save(request)

        auditService.logAsync(
            action = AuditAction.STATUS_CHANGE,
            entityType = "DataExportRequest",
            entityId = saved.id,
            description = "Data export request approved: ${saved.requestNumber}"
        )

        return DataExportRequestResponse.from(saved)
    }

    @Transactional
    fun rejectRequest(id: UUID, rejectRequest: RejectDataExportRequest): DataExportRequestResponse {
        val request = exportRequestRepository.findById(id)
            .orElseThrow { DataExportRequestNotFoundException(id) }

        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("No authenticated user")

        request.reject(currentUserId, rejectRequest.reason)
        val saved = exportRequestRepository.save(request)

        auditService.logAsync(
            action = AuditAction.STATUS_CHANGE,
            entityType = "DataExportRequest",
            entityId = saved.id,
            description = "Data export request rejected: ${saved.requestNumber}, reason: ${rejectRequest.reason}"
        )

        return DataExportRequestResponse.from(saved)
    }
}
