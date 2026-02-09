package com.liyaqa.platform.compliance.service

import com.liyaqa.platform.compliance.dto.ZatcaComplianceStatusResponse
import com.liyaqa.platform.compliance.dto.ZatcaSubmissionResponse
import com.liyaqa.platform.compliance.dto.ZatcaTenantDetailResponse
import com.liyaqa.platform.compliance.dto.ZatcaTenantIssue
import com.liyaqa.platform.compliance.exception.ZatcaSubmissionNotFoundException
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import com.liyaqa.platform.compliance.repository.ZatcaSubmissionRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class ZatcaComplianceService(
    private val submissionRepository: ZatcaSubmissionRepository,
    private val auditService: AuditService
) {

    @Transactional(readOnly = true)
    fun getAggregatedStatus(): ZatcaComplianceStatusResponse {
        val total = submissionRepository.countAll()
        val submittedCount = submissionRepository.countByStatus(ZatcaSubmissionStatus.SUBMITTED)
        val acceptedCount = submissionRepository.countByStatus(ZatcaSubmissionStatus.ACCEPTED)
        val rejectedCount = submissionRepository.countByStatus(ZatcaSubmissionStatus.REJECTED)
        val pendingCount = submissionRepository.countByStatus(ZatcaSubmissionStatus.PENDING)
        val failedCount = submissionRepository.countByStatus(ZatcaSubmissionStatus.FAILED)

        val complianceRate = if (total > 0) (acceptedCount.toDouble() / total.toDouble()) * 100.0 else 0.0

        val tenantIds = submissionRepository.findDistinctTenantIds()
        val issuesByTenant = tenantIds.mapNotNull { tenantId ->
            val rejected = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)
            val failed = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)
            val pending = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)

            if (rejected > 0 || failed > 0 || pending > 0) {
                ZatcaTenantIssue(
                    tenantId = tenantId,
                    tenantName = null,
                    rejectedCount = rejected,
                    failedCount = failed,
                    pendingCount = pending
                )
            } else {
                null
            }
        }

        return ZatcaComplianceStatusResponse(
            totalInvoices = total,
            submittedCount = submittedCount,
            acceptedCount = acceptedCount,
            rejectedCount = rejectedCount,
            pendingCount = pendingCount,
            failedCount = failedCount,
            complianceRate = complianceRate,
            issuesByTenant = issuesByTenant
        )
    }

    @Transactional(readOnly = true)
    fun getTenantDetail(tenantId: UUID): ZatcaTenantDetailResponse {
        val submissions = submissionRepository.findByTenantId(tenantId)
        val total = submissionRepository.countByTenantId(tenantId)
        val submittedCount = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.SUBMITTED)
        val acceptedCount = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.ACCEPTED)
        val rejectedCount = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)
        val pendingCount = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)
        val failedCount = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)

        val complianceRate = if (total > 0) (acceptedCount.toDouble() / total.toDouble()) * 100.0 else 0.0

        return ZatcaTenantDetailResponse(
            tenantId = tenantId,
            totalInvoices = total,
            submittedCount = submittedCount,
            acceptedCount = acceptedCount,
            rejectedCount = rejectedCount,
            pendingCount = pendingCount,
            failedCount = failedCount,
            complianceRate = complianceRate,
            submissions = submissions.map { ZatcaSubmissionResponse.from(it) }
        )
    }

    @Transactional
    fun retrySubmission(invoiceId: UUID): ZatcaSubmissionResponse {
        val submission = submissionRepository.findByInvoiceId(invoiceId)
            .orElseThrow { ZatcaSubmissionNotFoundException(invoiceId) }

        submission.retry()
        val saved = submissionRepository.save(submission)

        auditService.logAsync(
            action = AuditAction.STATUS_CHANGE,
            entityType = "ZatcaSubmission",
            entityId = saved.id,
            description = "ZATCA submission retry for invoice: ${saved.invoiceNumber}, retry count: ${saved.retryCount}"
        )

        return ZatcaSubmissionResponse.from(saved)
    }
}
