package com.liyaqa.platform.compliance.service

import com.liyaqa.platform.compliance.dto.ZatcaComplianceStatusResponse
import com.liyaqa.platform.compliance.dto.ZatcaIssueResponse
import com.liyaqa.platform.compliance.dto.ZatcaMonthlyTrendPoint
import com.liyaqa.platform.compliance.dto.ZatcaSubmissionResponse
import com.liyaqa.platform.compliance.dto.ZatcaTenantDetailResponse
import com.liyaqa.platform.compliance.dto.ZatcaTenantIssue
import com.liyaqa.platform.compliance.exception.ZatcaSubmissionNotFoundException
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import com.liyaqa.platform.compliance.repository.JpaZatcaSubmissionRepository
import com.liyaqa.platform.compliance.repository.ZatcaSubmissionRepository
import com.liyaqa.platform.tenant.model.Tenant
import com.liyaqa.platform.tenant.repository.TenantRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
class ZatcaComplianceService(
    private val submissionRepository: ZatcaSubmissionRepository,
    private val tenantRepository: TenantRepository,
    private val auditService: AuditService
) {

    private fun resolveTenantNames(tenantIds: Collection<UUID>): Map<UUID, Tenant> {
        if (tenantIds.isEmpty()) return emptyMap()
        return tenantRepository.findAllById(tenantIds.toSet()).associateBy { it.id }
    }

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
        val tenantMap = resolveTenantNames(tenantIds)

        val issuesByTenant = tenantIds.mapNotNull { tenantId ->
            val rejected = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)
            val failed = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)
            val pending = submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)

            if (rejected > 0 || failed > 0 || pending > 0) {
                val tenant = tenantMap[tenantId]
                ZatcaTenantIssue(
                    tenantId = tenantId,
                    tenantName = tenant?.facilityName,
                    tenantNameAr = tenant?.facilityNameAr,
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

    @Transactional(readOnly = true)
    fun getMonthlyTrend(months: Int = 6): List<ZatcaMonthlyTrendPoint> {
        val after = Instant.now().minus(months.toLong() * 30, ChronoUnit.DAYS)
        val jpaRepo = submissionRepository as? JpaZatcaSubmissionRepository
            ?: return emptyList()

        val rows = jpaRepo.findMonthlyStatusCounts(after)

        // Group by month: { "2025-01" -> { ACCEPTED -> 10, REJECTED -> 2, ... } }
        val grouped = mutableMapOf<String, MutableMap<ZatcaSubmissionStatus, Long>>()
        for (row in rows) {
            val month = row[0] as String
            val status = row[1] as ZatcaSubmissionStatus
            val count = (row[2] as Number).toLong()
            grouped.getOrPut(month) { mutableMapOf() }[status] = count
        }

        return grouped.entries.sortedBy { it.key }.map { (month, counts) ->
            ZatcaMonthlyTrendPoint(
                month = month,
                compliant = counts[ZatcaSubmissionStatus.ACCEPTED] ?: 0,
                failed = (counts[ZatcaSubmissionStatus.REJECTED] ?: 0) + (counts[ZatcaSubmissionStatus.FAILED] ?: 0)
            )
        }
    }

    @Transactional(readOnly = true)
    fun getRecentIssues(limit: Int = 20): List<ZatcaIssueResponse> {
        val statuses = listOf(ZatcaSubmissionStatus.REJECTED, ZatcaSubmissionStatus.FAILED)
        val submissions = submissionRepository.findByStatusInOrderByCreatedAtDesc(statuses, limit)

        val tenantMap = resolveTenantNames(submissions.map { it.tenantId })

        return submissions.map { s ->
            val tenant = tenantMap[s.tenantId]
            ZatcaIssueResponse(
                id = s.id,
                invoiceId = s.invoiceId,
                invoiceNumber = s.invoiceNumber,
                tenantId = s.tenantId,
                tenantName = tenant?.facilityName,
                tenantNameAr = tenant?.facilityNameAr,
                status = s.status,
                responseMessage = s.responseMessage,
                responseCode = s.responseCode,
                submittedAt = s.submittedAt,
                createdAt = s.createdAt
            )
        }
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
