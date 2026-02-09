package com.liyaqa.platform.compliance.model

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import java.util.UUID

class ZatcaSubmissionTest {

    private fun createSubmission(zatcaHash: String? = "abc123hash"): ZatcaSubmission {
        return ZatcaSubmission.create(
            tenantId = UUID.randomUUID(),
            invoiceId = UUID.randomUUID(),
            invoiceNumber = "INV-001",
            zatcaHash = zatcaHash
        )
    }

    @Test
    fun `create factory sets PENDING status`() {
        val submission = createSubmission()
        assertEquals(ZatcaSubmissionStatus.PENDING, submission.status)
    }

    @Test
    fun `markSubmitted sets SUBMITTED and submittedAt`() {
        val submission = createSubmission()
        submission.markSubmitted()

        assertEquals(ZatcaSubmissionStatus.SUBMITTED, submission.status)
        assertNotNull(submission.submittedAt)
    }

    @Test
    fun `markAccepted sets ACCEPTED and response fields`() {
        val submission = createSubmission()
        submission.markAccepted("200", "Invoice accepted")

        assertEquals(ZatcaSubmissionStatus.ACCEPTED, submission.status)
        assertEquals("200", submission.responseCode)
        assertEquals("Invoice accepted", submission.responseMessage)
    }

    @Test
    fun `markRejected sets REJECTED and response fields`() {
        val submission = createSubmission()
        submission.markRejected("400", "Invalid hash")

        assertEquals(ZatcaSubmissionStatus.REJECTED, submission.status)
        assertEquals("400", submission.responseCode)
        assertEquals("Invalid hash", submission.responseMessage)
    }

    @Test
    fun `markFailed sets FAILED and message`() {
        val submission = createSubmission()
        submission.markFailed("Connection timeout")

        assertEquals(ZatcaSubmissionStatus.FAILED, submission.status)
        assertEquals("Connection timeout", submission.responseMessage)
    }

    @Test
    fun `retry increments retryCount and resets to PENDING`() {
        val submission = createSubmission()
        submission.markFailed("Error")
        assertEquals(0, submission.retryCount)

        submission.retry()
        assertEquals(1, submission.retryCount)
        assertEquals(ZatcaSubmissionStatus.PENDING, submission.status)
    }

    @Test
    fun `retry sets lastRetryAt`() {
        val submission = createSubmission()
        assertNull(submission.lastRetryAt)

        submission.retry()
        assertNotNull(submission.lastRetryAt)
    }

    @Test
    fun `create factory sets zatcaHash`() {
        val submission = createSubmission(zatcaHash = "myhash")
        assertEquals("myhash", submission.zatcaHash)
    }
}
