package com.liyaqa.platform.compliance.repository

import com.liyaqa.platform.compliance.model.ZatcaSubmission
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataZatcaSubmissionRepository : JpaRepository<ZatcaSubmission, UUID> {
    fun findByInvoiceId(invoiceId: UUID): Optional<ZatcaSubmission>
    fun findByTenantId(tenantId: UUID): List<ZatcaSubmission>
    fun findByStatus(status: ZatcaSubmissionStatus): List<ZatcaSubmission>
    fun countByStatus(status: ZatcaSubmissionStatus): Long
    fun countByTenantIdAndStatus(tenantId: UUID, status: ZatcaSubmissionStatus): Long
    fun countByTenantId(tenantId: UUID): Long

    @Query("SELECT COUNT(z) FROM ZatcaSubmission z")
    fun countAll(): Long

    @Query("SELECT DISTINCT z.tenantId FROM ZatcaSubmission z")
    fun findDistinctTenantIds(): List<UUID>

    fun findByStatusIn(statuses: List<ZatcaSubmissionStatus>, pageable: org.springframework.data.domain.Pageable): List<ZatcaSubmission>

    fun countByStatusAndCreatedAtAfter(status: ZatcaSubmissionStatus, after: Instant): Long

    @Query("""
        SELECT FUNCTION('TO_CHAR', z.createdAt, 'YYYY-MM') as month,
               z.status as status,
               COUNT(z) as cnt
        FROM ZatcaSubmission z
        WHERE z.createdAt >= :after
        GROUP BY FUNCTION('TO_CHAR', z.createdAt, 'YYYY-MM'), z.status
        ORDER BY month
    """)
    fun findMonthlyStatusCounts(after: Instant): List<Array<Any>>
}

@Repository
class JpaZatcaSubmissionRepository(
    private val springDataRepository: SpringDataZatcaSubmissionRepository
) : ZatcaSubmissionRepository {

    override fun save(submission: ZatcaSubmission): ZatcaSubmission =
        springDataRepository.save(submission)

    override fun findById(id: UUID): Optional<ZatcaSubmission> =
        springDataRepository.findById(id)

    override fun findByInvoiceId(invoiceId: UUID): Optional<ZatcaSubmission> =
        springDataRepository.findByInvoiceId(invoiceId)

    override fun findByTenantId(tenantId: UUID): List<ZatcaSubmission> =
        springDataRepository.findByTenantId(tenantId)

    override fun findByStatus(status: ZatcaSubmissionStatus): List<ZatcaSubmission> =
        springDataRepository.findByStatus(status)

    override fun countByStatus(status: ZatcaSubmissionStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByTenantIdAndStatus(tenantId: UUID, status: ZatcaSubmissionStatus): Long =
        springDataRepository.countByTenantIdAndStatus(tenantId, status)

    override fun countAll(): Long =
        springDataRepository.countAll()

    override fun countByTenantId(tenantId: UUID): Long =
        springDataRepository.countByTenantId(tenantId)

    override fun findDistinctTenantIds(): List<UUID> =
        springDataRepository.findDistinctTenantIds()

    override fun findByStatusInOrderByCreatedAtDesc(statuses: List<ZatcaSubmissionStatus>, limit: Int): List<ZatcaSubmission> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        return springDataRepository.findByStatusIn(statuses, pageable)
    }

    override fun countByStatusAndCreatedAtAfter(status: ZatcaSubmissionStatus, after: Instant): Long =
        springDataRepository.countByStatusAndCreatedAtAfter(status, after)

    fun findMonthlyStatusCounts(after: Instant): List<Array<Any>> =
        springDataRepository.findMonthlyStatusCounts(after)
}
