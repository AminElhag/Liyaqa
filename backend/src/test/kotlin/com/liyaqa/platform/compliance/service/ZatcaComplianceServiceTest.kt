package com.liyaqa.platform.compliance.service

import com.liyaqa.platform.compliance.exception.ZatcaSubmissionNotFoundException
import com.liyaqa.platform.compliance.model.ZatcaSubmission
import com.liyaqa.platform.compliance.model.ZatcaSubmissionStatus
import com.liyaqa.platform.compliance.repository.ZatcaSubmissionRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ZatcaComplianceServiceTest {

    @Mock
    private lateinit var submissionRepository: ZatcaSubmissionRepository

    @Mock
    private lateinit var auditService: AuditService

    private lateinit var service: ZatcaComplianceService

    @BeforeEach
    fun setUp() {
        service = ZatcaComplianceService(submissionRepository, auditService)
    }

    private fun createSubmission(
        tenantId: UUID = UUID.randomUUID(),
        status: ZatcaSubmissionStatus = ZatcaSubmissionStatus.PENDING
    ): ZatcaSubmission {
        val submission = ZatcaSubmission.create(
            tenantId = tenantId,
            invoiceId = UUID.randomUUID(),
            invoiceNumber = "INV-${System.nanoTime()}",
            zatcaHash = "hash123"
        )
        when (status) {
            ZatcaSubmissionStatus.SUBMITTED -> submission.markSubmitted()
            ZatcaSubmissionStatus.ACCEPTED -> submission.markAccepted("200", "OK")
            ZatcaSubmissionStatus.REJECTED -> submission.markRejected("400", "Bad")
            ZatcaSubmissionStatus.FAILED -> submission.markFailed("Error")
            else -> {}
        }
        return submission
    }

    // ============================================
    // Aggregated Status
    // ============================================

    @Test
    fun `getAggregatedStatus returns correct counts`() {
        whenever(submissionRepository.countAll()) doReturn 100L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.SUBMITTED)) doReturn 10L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.ACCEPTED)) doReturn 70L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.REJECTED)) doReturn 5L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.PENDING)) doReturn 10L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.FAILED)) doReturn 5L
        whenever(submissionRepository.findDistinctTenantIds()) doReturn emptyList()

        val result = service.getAggregatedStatus()

        assertEquals(100L, result.totalInvoices)
        assertEquals(10L, result.submittedCount)
        assertEquals(70L, result.acceptedCount)
        assertEquals(5L, result.rejectedCount)
        assertEquals(10L, result.pendingCount)
        assertEquals(5L, result.failedCount)
    }

    @Test
    fun `getAggregatedStatus calculates compliance rate correctly`() {
        whenever(submissionRepository.countAll()) doReturn 100L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.SUBMITTED)) doReturn 0L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.ACCEPTED)) doReturn 80L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.REJECTED)) doReturn 10L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.PENDING)) doReturn 5L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.FAILED)) doReturn 5L
        whenever(submissionRepository.findDistinctTenantIds()) doReturn emptyList()

        val result = service.getAggregatedStatus()
        assertEquals(80.0, result.complianceRate, 0.01)
    }

    @Test
    fun `getAggregatedStatus with zero invoices returns 0 rate`() {
        whenever(submissionRepository.countAll()) doReturn 0L
        whenever(submissionRepository.countByStatus(any())) doReturn 0L
        whenever(submissionRepository.findDistinctTenantIds()) doReturn emptyList()

        val result = service.getAggregatedStatus()
        assertEquals(0.0, result.complianceRate, 0.01)
    }

    @Test
    fun `getAggregatedStatus includes tenants with issues`() {
        val tenantId = UUID.randomUUID()
        whenever(submissionRepository.countAll()) doReturn 10L
        whenever(submissionRepository.countByStatus(any())) doReturn 0L
        whenever(submissionRepository.countByStatus(ZatcaSubmissionStatus.REJECTED)) doReturn 2L
        whenever(submissionRepository.findDistinctTenantIds()) doReturn listOf(tenantId)
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)) doReturn 2L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)) doReturn 0L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)) doReturn 0L

        val result = service.getAggregatedStatus()
        assertEquals(1, result.issuesByTenant.size)
        assertEquals(tenantId, result.issuesByTenant[0].tenantId)
        assertEquals(2L, result.issuesByTenant[0].rejectedCount)
    }

    @Test
    fun `getAggregatedStatus excludes tenants with no issues`() {
        val tenantId = UUID.randomUUID()
        whenever(submissionRepository.countAll()) doReturn 10L
        whenever(submissionRepository.countByStatus(any())) doReturn 0L
        whenever(submissionRepository.findDistinctTenantIds()) doReturn listOf(tenantId)
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)) doReturn 0L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)) doReturn 0L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)) doReturn 0L

        val result = service.getAggregatedStatus()
        assertTrue(result.issuesByTenant.isEmpty())
    }

    // ============================================
    // Tenant Detail
    // ============================================

    @Test
    fun `getTenantDetail returns correct counts`() {
        val tenantId = UUID.randomUUID()
        whenever(submissionRepository.findByTenantId(tenantId)) doReturn emptyList()
        whenever(submissionRepository.countByTenantId(tenantId)) doReturn 50L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.SUBMITTED)) doReturn 5L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.ACCEPTED)) doReturn 40L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.REJECTED)) doReturn 2L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.PENDING)) doReturn 1L
        whenever(submissionRepository.countByTenantIdAndStatus(tenantId, ZatcaSubmissionStatus.FAILED)) doReturn 2L

        val result = service.getTenantDetail(tenantId)

        assertEquals(tenantId, result.tenantId)
        assertEquals(50L, result.totalInvoices)
        assertEquals(40L, result.acceptedCount)
        assertEquals(80.0, result.complianceRate, 0.01)
    }

    @Test
    fun `getTenantDetail includes submission list`() {
        val tenantId = UUID.randomUUID()
        val submissions = listOf(createSubmission(tenantId), createSubmission(tenantId))
        whenever(submissionRepository.findByTenantId(tenantId)) doReturn submissions
        whenever(submissionRepository.countByTenantId(tenantId)) doReturn 2L
        whenever(submissionRepository.countByTenantIdAndStatus(eq(tenantId), any())) doReturn 0L

        val result = service.getTenantDetail(tenantId)
        assertEquals(2, result.submissions.size)
    }

    // ============================================
    // Retry
    // ============================================

    @Test
    fun `retrySubmission increments retryCount and resets status`() {
        val submission = createSubmission(status = ZatcaSubmissionStatus.FAILED)
        whenever(submissionRepository.findByInvoiceId(submission.invoiceId)) doReturn Optional.of(submission)
        whenever(submissionRepository.save(any<ZatcaSubmission>())) .thenAnswer { it.arguments[0] }

        val result = service.retrySubmission(submission.invoiceId)

        assertEquals(1, result.retryCount)
        assertEquals(ZatcaSubmissionStatus.PENDING, result.status)
    }

    @Test
    fun `retrySubmission throws ZatcaSubmissionNotFoundException`() {
        val invoiceId = UUID.randomUUID()
        whenever(submissionRepository.findByInvoiceId(invoiceId)) doReturn Optional.empty()

        assertThrows(ZatcaSubmissionNotFoundException::class.java) {
            service.retrySubmission(invoiceId)
        }
    }

    @Test
    fun `retrySubmission calls audit with STATUS_CHANGE`() {
        val submission = createSubmission(status = ZatcaSubmissionStatus.FAILED)
        whenever(submissionRepository.findByInvoiceId(submission.invoiceId)) doReturn Optional.of(submission)
        whenever(submissionRepository.save(any<ZatcaSubmission>())) .thenAnswer { it.arguments[0] }

        service.retrySubmission(submission.invoiceId)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("ZatcaSubmission"),
            entityId = any(),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }
}
