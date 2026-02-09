package com.liyaqa.platform.compliance.service

import com.liyaqa.platform.compliance.dto.RejectDataExportRequest
import com.liyaqa.platform.compliance.exception.DataExportRequestNotFoundException
import com.liyaqa.platform.compliance.model.DataExportRequest
import com.liyaqa.platform.compliance.model.DataExportRequestStatus
import com.liyaqa.platform.compliance.repository.DataExportRequestRepository
import com.liyaqa.shared.domain.AuditAction
import com.liyaqa.shared.infrastructure.audit.AuditService
import com.liyaqa.shared.infrastructure.security.SecurityService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
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
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataExportRequestServiceTest {

    @Mock
    private lateinit var exportRequestRepository: DataExportRequestRepository

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var securityService: SecurityService

    private lateinit var service: DataExportRequestService
    private val currentUserId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        service = DataExportRequestService(exportRequestRepository, auditService, securityService)
        whenever(securityService.getCurrentUserId()) doReturn currentUserId
    }

    private fun createTestRequest(
        status: DataExportRequestStatus = DataExportRequestStatus.PENDING_APPROVAL
    ): DataExportRequest {
        val request = DataExportRequest.create(
            tenantId = UUID.randomUUID(),
            requesterName = "John Doe",
            requesterEmail = "john@example.com",
            reason = "Data request"
        )
        when (status) {
            DataExportRequestStatus.APPROVED -> request.approve(UUID.randomUUID())
            DataExportRequestStatus.REJECTED -> request.reject(UUID.randomUUID(), "reason")
            else -> {}
        }
        return request
    }

    // ============================================
    // List
    // ============================================

    @Test
    fun `listRequests with status filter returns filtered`() {
        val pageable = PageRequest.of(0, 10)
        val requests = listOf(createTestRequest())
        val page = PageImpl(requests, pageable, 1)

        whenever(exportRequestRepository.findByStatus(DataExportRequestStatus.PENDING_APPROVAL, pageable)) doReturn page

        val result = service.listRequests(DataExportRequestStatus.PENDING_APPROVAL, pageable)
        assertEquals(1, result.content.size)
    }

    @Test
    fun `listRequests without filter returns all`() {
        val pageable = PageRequest.of(0, 10)
        val requests = listOf(createTestRequest(), createTestRequest())
        val page = PageImpl(requests, pageable, 2)

        whenever(exportRequestRepository.findAll(pageable)) doReturn page

        val result = service.listRequests(null, pageable)
        assertEquals(2, result.content.size)
    }

    // ============================================
    // Get
    // ============================================

    @Test
    fun `getRequest returns response`() {
        val request = createTestRequest()
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)

        val result = service.getRequest(request.id)
        assertEquals(request.id, result.id)
    }

    @Test
    fun `getRequest throws DataExportRequestNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(exportRequestRepository.findById(id)) doReturn Optional.empty()

        assertThrows(DataExportRequestNotFoundException::class.java) {
            service.getRequest(id)
        }
    }

    // ============================================
    // Approve
    // ============================================

    @Test
    fun `approveRequest sets APPROVED and approvedBy`() {
        val request = createTestRequest()
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)
        whenever(exportRequestRepository.save(any<DataExportRequest>())) .thenAnswer { it.arguments[0] }

        val result = service.approveRequest(request.id)

        assertEquals(DataExportRequestStatus.APPROVED, result.status)
        assertEquals(currentUserId, result.approvedBy)
        assertNotNull(result.approvedAt)
    }

    @Test
    fun `approveRequest throws for non-PENDING`() {
        val request = createTestRequest(DataExportRequestStatus.APPROVED)
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)

        assertThrows(IllegalArgumentException::class.java) {
            service.approveRequest(request.id)
        }
    }

    @Test
    fun `approveRequest calls audit STATUS_CHANGE`() {
        val request = createTestRequest()
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)
        whenever(exportRequestRepository.save(any<DataExportRequest>())) .thenAnswer { it.arguments[0] }

        service.approveRequest(request.id)

        verify(auditService).logAsync(
            action = eq(AuditAction.STATUS_CHANGE),
            entityType = eq("DataExportRequest"),
            entityId = eq(request.id),
            description = anyOrNull(),
            oldValue = anyOrNull(),
            newValue = anyOrNull()
        )
    }

    // ============================================
    // Reject
    // ============================================

    @Test
    fun `rejectRequest sets REJECTED with reason`() {
        val request = createTestRequest()
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)
        whenever(exportRequestRepository.save(any<DataExportRequest>())) .thenAnswer { it.arguments[0] }

        val result = service.rejectRequest(request.id, RejectDataExportRequest("Invalid request"))

        assertEquals(DataExportRequestStatus.REJECTED, result.status)
        assertEquals("Invalid request", result.rejectionReason)
        assertEquals(currentUserId, result.rejectedBy)
    }

    @Test
    fun `rejectRequest throws for non-PENDING`() {
        val request = createTestRequest(DataExportRequestStatus.APPROVED)
        whenever(exportRequestRepository.findById(request.id)) doReturn Optional.of(request)

        assertThrows(IllegalArgumentException::class.java) {
            service.rejectRequest(request.id, RejectDataExportRequest("reason"))
        }
    }

    @Test
    fun `rejectRequest throws DataExportRequestNotFoundException`() {
        val id = UUID.randomUUID()
        whenever(exportRequestRepository.findById(id)) doReturn Optional.empty()

        assertThrows(DataExportRequestNotFoundException::class.java) {
            service.rejectRequest(id, RejectDataExportRequest("reason"))
        }
    }
}
