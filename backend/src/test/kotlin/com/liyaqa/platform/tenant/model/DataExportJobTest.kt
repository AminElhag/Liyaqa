package com.liyaqa.platform.tenant.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import java.util.UUID

class DataExportJobTest {

    private val tenantId = UUID.randomUUID()
    private val requestedBy = UUID.randomUUID()

    @Test
    fun `start sets status to IN_PROGRESS and startedAt`() {
        val job = DataExportJob.create(tenantId, DataExportFormat.JSON, requestedBy)
        assertEquals(DataExportStatus.PENDING, job.status)
        assertNull(job.startedAt)

        job.start()

        assertEquals(DataExportStatus.IN_PROGRESS, job.status)
        assertNotNull(job.startedAt)
    }

    @Test
    fun `complete sets fileUrl, fileSizeBytes, completedAt, and expiresAt`() {
        val job = DataExportJob.create(tenantId, DataExportFormat.CSV, requestedBy)
        job.start()

        val fileUrl = "https://storage.example.com/exports/tenant-data.csv"
        val fileSizeBytes = 1024L * 1024 * 50 // 50 MB

        job.complete(fileUrl, fileSizeBytes)

        assertEquals(DataExportStatus.COMPLETED, job.status)
        assertEquals(fileUrl, job.fileUrl)
        assertEquals(fileSizeBytes, job.fileSizeBytes)
        assertNotNull(job.completedAt)
        assertNotNull(job.expiresAt)
        assertTrue(job.expiresAt!!.isAfter(job.completedAt))
    }

    @Test
    fun `fail sets errorMessage and status to FAILED`() {
        val job = DataExportJob.create(tenantId, DataExportFormat.JSON, requestedBy)
        job.start()

        val errorMessage = "Storage quota exceeded"

        job.fail(errorMessage)

        assertEquals(DataExportStatus.FAILED, job.status)
        assertEquals(errorMessage, job.errorMessage)
        assertNotNull(job.completedAt)
        assertNull(job.fileUrl)
        assertNull(job.expiresAt)
    }

    @Test
    fun `isExpired returns false when expiresAt is null`() {
        val job = DataExportJob.create(tenantId, DataExportFormat.JSON, requestedBy)
        assertFalse(job.isExpired())
    }

    @Test
    fun `create factory method sets correct defaults`() {
        val job = DataExportJob.create(tenantId, DataExportFormat.CSV, requestedBy)

        assertEquals(tenantId, job.tenantId)
        assertEquals(DataExportFormat.CSV, job.format)
        assertEquals(requestedBy, job.requestedBy)
        assertEquals(DataExportStatus.PENDING, job.status)
        assertNull(job.startedAt)
        assertNull(job.completedAt)
        assertNull(job.fileUrl)
        assertNull(job.fileSizeBytes)
        assertNull(job.errorMessage)
        assertNull(job.expiresAt)
    }
}
