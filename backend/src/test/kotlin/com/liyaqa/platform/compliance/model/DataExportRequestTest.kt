package com.liyaqa.platform.compliance.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class DataExportRequestTest {

    private fun createRequest(
        status: DataExportRequestStatus = DataExportRequestStatus.PENDING_APPROVAL
    ): DataExportRequest {
        val request = DataExportRequest.create(
            tenantId = UUID.randomUUID(),
            requesterName = "John Doe",
            requesterEmail = "john@example.com",
            reason = "GDPR data request"
        )
        when (status) {
            DataExportRequestStatus.APPROVED -> request.approve(UUID.randomUUID())
            DataExportRequestStatus.IN_PROGRESS -> {
                request.approve(UUID.randomUUID())
                request.startProcessing()
            }
            DataExportRequestStatus.COMPLETED -> {
                request.approve(UUID.randomUUID())
                request.startProcessing()
                request.complete("https://storage.example.com/export.zip")
            }
            DataExportRequestStatus.REJECTED -> request.reject(UUID.randomUUID(), "Not valid")
            DataExportRequestStatus.FAILED -> {
                request.approve(UUID.randomUUID())
                request.startProcessing()
                request.fail()
            }
            else -> {} // PENDING_APPROVAL is default
        }
        return request
    }

    @Test
    fun `create factory sets PENDING_APPROVAL status`() {
        val request = DataExportRequest.create(
            tenantId = UUID.randomUUID(),
            requesterName = "John",
            requesterEmail = "john@test.com"
        )
        assertEquals(DataExportRequestStatus.PENDING_APPROVAL, request.status)
    }

    @Test
    fun `generateRequestNumber starts with DER-`() {
        val number = DataExportRequest.generateRequestNumber()
        assertTrue(number.startsWith("DER-"))
    }

    @Test
    fun `approve sets APPROVED, approvedBy, approvedAt`() {
        val request = createRequest()
        val approvedBy = UUID.randomUUID()
        request.approve(approvedBy)

        assertEquals(DataExportRequestStatus.APPROVED, request.status)
        assertEquals(approvedBy, request.approvedBy)
        assertNotNull(request.approvedAt)
    }

    @Test
    fun `approve throws if not PENDING_APPROVAL`() {
        val request = createRequest(DataExportRequestStatus.APPROVED)
        assertThrows(IllegalArgumentException::class.java) {
            request.approve(UUID.randomUUID())
        }
    }

    @Test
    fun `reject sets REJECTED, reason, rejectedBy`() {
        val request = createRequest()
        val rejectedBy = UUID.randomUUID()
        request.reject(rejectedBy, "Invalid request")

        assertEquals(DataExportRequestStatus.REJECTED, request.status)
        assertEquals(rejectedBy, request.rejectedBy)
        assertNotNull(request.rejectedAt)
        assertEquals("Invalid request", request.rejectionReason)
    }

    @Test
    fun `reject throws if not PENDING_APPROVAL`() {
        val request = createRequest(DataExportRequestStatus.APPROVED)
        assertThrows(IllegalArgumentException::class.java) {
            request.reject(UUID.randomUUID(), "reason")
        }
    }

    @Test
    fun `startProcessing sets IN_PROGRESS`() {
        val request = createRequest(DataExportRequestStatus.APPROVED)
        request.startProcessing()
        assertEquals(DataExportRequestStatus.IN_PROGRESS, request.status)
    }

    @Test
    fun `startProcessing throws if not APPROVED`() {
        val request = createRequest()
        assertThrows(IllegalArgumentException::class.java) {
            request.startProcessing()
        }
    }

    @Test
    fun `complete sets COMPLETED and completedAt`() {
        val request = createRequest(DataExportRequestStatus.IN_PROGRESS)
        request.complete("https://storage.example.com/export.zip")

        assertEquals(DataExportRequestStatus.COMPLETED, request.status)
        assertNotNull(request.completedAt)
        assertEquals("https://storage.example.com/export.zip", request.fileUrl)
    }

    @Test
    fun `fail sets FAILED and completedAt`() {
        val request = createRequest(DataExportRequestStatus.IN_PROGRESS)
        request.fail()

        assertEquals(DataExportRequestStatus.FAILED, request.status)
        assertNotNull(request.completedAt)
    }
}
