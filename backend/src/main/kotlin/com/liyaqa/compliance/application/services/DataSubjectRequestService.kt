package com.liyaqa.compliance.application.services

import com.liyaqa.compliance.domain.model.*
import com.liyaqa.compliance.domain.ports.DataSubjectRequestRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class DataSubjectRequestService(
    private val dsrRepository: DataSubjectRequestRepository
) {
    private val logger = LoggerFactory.getLogger(DataSubjectRequestService::class.java)

    /**
     * Create a new data subject request.
     */
    fun createRequest(
        memberId: UUID? = null,
        requesterName: String,
        requesterEmail: String,
        requesterPhone: String? = null,
        requestType: DataSubjectRequestType,
        description: String? = null,
        priority: DSRPriority = DSRPriority.NORMAL
    ): DataSubjectRequest {
        val tenantId = TenantContext.getCurrentTenant().value

        val request = DataSubjectRequest(
            tenantId = tenantId,
            requestNumber = DataSubjectRequest.generateRequestNumber(),
            memberId = memberId,
            requesterName = requesterName,
            requesterEmail = requesterEmail,
            requesterPhone = requesterPhone,
            requestType = requestType,
            description = description,
            priority = priority,
            dueDate = DataSubjectRequest.calculateDueDate() // 30 days per PDPL Article 26
        )

        val saved = dsrRepository.save(request)
        logger.info("Created DSR {} for {} type={}", saved.requestNumber, requesterEmail, requestType)
        return saved
    }

    /**
     * Get a DSR by ID.
     */
    @Transactional(readOnly = true)
    fun getRequest(id: UUID): DataSubjectRequest {
        return dsrRepository.findById(id)
            .orElseThrow { NoSuchElementException("Data subject request not found: $id") }
    }

    /**
     * Get a DSR by request number.
     */
    @Transactional(readOnly = true)
    fun getRequestByNumber(requestNumber: String): DataSubjectRequest {
        val tenantId = TenantContext.getCurrentTenant().value
        return dsrRepository.findByTenantIdAndRequestNumber(tenantId, requestNumber)
            .orElseThrow { NoSuchElementException("Data subject request not found: $requestNumber") }
    }

    /**
     * Get all DSRs for the tenant.
     */
    @Transactional(readOnly = true)
    fun getRequests(pageable: Pageable): Page<DataSubjectRequest> {
        val tenantId = TenantContext.getCurrentTenant().value
        return dsrRepository.findByTenantId(tenantId, pageable)
    }

    /**
     * Get DSRs by status.
     */
    @Transactional(readOnly = true)
    fun getRequestsByStatus(status: DSRStatus, pageable: Pageable): Page<DataSubjectRequest> {
        val tenantId = TenantContext.getCurrentTenant().value
        return dsrRepository.findByTenantIdAndStatus(tenantId, status, pageable)
    }

    /**
     * Get DSRs assigned to a user.
     */
    @Transactional(readOnly = true)
    fun getRequestsAssignedTo(userId: UUID, pageable: Pageable): Page<DataSubjectRequest> {
        return dsrRepository.findByAssignedToUserId(userId, pageable)
    }

    /**
     * Get overdue DSRs.
     */
    @Transactional(readOnly = true)
    fun getOverdueRequests(): List<DataSubjectRequest> {
        val tenantId = TenantContext.getCurrentTenant().value
        return dsrRepository.findOverdueRequests(tenantId, LocalDate.now())
    }

    /**
     * Verify requester identity.
     */
    fun verifyIdentity(requestId: UUID, verifierId: UUID, method: VerificationMethod): DataSubjectRequest {
        val request = getRequest(requestId)
        request.verifyIdentity(verifierId, method)
        logger.info("Verified identity for DSR {} using {}", request.requestNumber, method)
        return dsrRepository.save(request)
    }

    /**
     * Assign DSR to a user.
     */
    fun assignRequest(requestId: UUID, userId: UUID): DataSubjectRequest {
        val request = getRequest(requestId)
        request.assignTo(userId)
        logger.info("Assigned DSR {} to user {}", request.requestNumber, userId)
        return dsrRepository.save(request)
    }

    /**
     * Start processing a DSR.
     */
    fun startProcessing(requestId: UUID): DataSubjectRequest {
        val request = getRequest(requestId)
        request.startProcessing()
        logger.info("Started processing DSR {}", request.requestNumber)
        return dsrRepository.save(request)
    }

    /**
     * Request approval for a DSR.
     */
    fun requestApproval(requestId: UUID): DataSubjectRequest {
        val request = getRequest(requestId)
        request.requestApproval()
        logger.info("DSR {} pending approval", request.requestNumber)
        return dsrRepository.save(request)
    }

    /**
     * Complete a DSR.
     */
    fun completeRequest(
        requestId: UUID,
        responseMethod: ResponseMethod,
        dataExportPath: String? = null
    ): DataSubjectRequest {
        val request = getRequest(requestId)
        request.complete(responseMethod, dataExportPath)
        logger.info("Completed DSR {} via {}", request.requestNumber, responseMethod)
        return dsrRepository.save(request)
    }

    /**
     * Reject a DSR.
     */
    fun rejectRequest(requestId: UUID, reason: String): DataSubjectRequest {
        val request = getRequest(requestId)
        request.reject(reason)
        logger.info("Rejected DSR {} - reason: {}", request.requestNumber, reason)
        return dsrRepository.save(request)
    }

    /**
     * Extend DSR deadline (allowed once per PDPL).
     */
    fun extendDeadline(requestId: UUID, newDueDate: LocalDate, reason: String): DataSubjectRequest {
        val request = getRequest(requestId)
        require(request.extendedDueDate == null) { "Deadline can only be extended once" }
        request.extendDeadline(newDueDate, reason)
        logger.info("Extended DSR {} deadline to {}", request.requestNumber, newDueDate)
        return dsrRepository.save(request)
    }

    /**
     * Add notes to a DSR.
     */
    fun addNotes(requestId: UUID, notes: String): DataSubjectRequest {
        val request = getRequest(requestId)
        request.notes = if (request.notes.isNullOrBlank()) {
            notes
        } else {
            "${request.notes}\n\n${notes}"
        }
        return dsrRepository.save(request)
    }

    /**
     * Get DSR statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): DSRStats {
        val tenantId = TenantContext.getCurrentTenant().value

        return DSRStats(
            totalRequests = dsrRepository.findByTenantId(tenantId, Pageable.unpaged()).totalElements,
            pendingRequests = dsrRepository.countByTenantIdAndStatus(tenantId, DSRStatus.RECEIVED) +
                    dsrRepository.countByTenantIdAndStatus(tenantId, DSRStatus.IN_PROGRESS),
            completedRequests = dsrRepository.countByTenantIdAndStatus(tenantId, DSRStatus.COMPLETED),
            overdueRequests = getOverdueRequests().size.toLong(),
            averageResolutionDays = 0.0 // Would need more complex query
        )
    }
}

data class DSRStats(
    val totalRequests: Long,
    val pendingRequests: Long,
    val completedRequests: Long,
    val overdueRequests: Long,
    val averageResolutionDays: Double
)
