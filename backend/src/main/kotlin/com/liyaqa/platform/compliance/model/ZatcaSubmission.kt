package com.liyaqa.platform.compliance.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "zatca_submissions")
class ZatcaSubmission(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "invoice_id", nullable = false)
    val invoiceId: UUID,

    @Column(name = "invoice_number", nullable = false)
    val invoiceNumber: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ZatcaSubmissionStatus = ZatcaSubmissionStatus.PENDING,

    @Column(name = "submitted_at")
    var submittedAt: Instant? = null,

    @Column(name = "response_code")
    var responseCode: String? = null,

    @Column(name = "response_message")
    var responseMessage: String? = null,

    @Column(name = "retry_count")
    var retryCount: Int = 0,

    @Column(name = "last_retry_at")
    var lastRetryAt: Instant? = null,

    @Column(name = "zatca_hash")
    var zatcaHash: String? = null

) : OrganizationLevelEntity(id) {

    fun markSubmitted() {
        this.status = ZatcaSubmissionStatus.SUBMITTED
        this.submittedAt = Instant.now()
    }

    fun markAccepted(code: String?, message: String?) {
        this.status = ZatcaSubmissionStatus.ACCEPTED
        this.responseCode = code
        this.responseMessage = message
    }

    fun markRejected(code: String?, message: String?) {
        this.status = ZatcaSubmissionStatus.REJECTED
        this.responseCode = code
        this.responseMessage = message
    }

    fun markFailed(message: String?) {
        this.status = ZatcaSubmissionStatus.FAILED
        this.responseMessage = message
    }

    fun retry() {
        this.retryCount++
        this.lastRetryAt = Instant.now()
        this.status = ZatcaSubmissionStatus.PENDING
    }

    companion object {
        fun create(
            tenantId: UUID,
            invoiceId: UUID,
            invoiceNumber: String,
            zatcaHash: String? = null
        ): ZatcaSubmission {
            return ZatcaSubmission(
                tenantId = tenantId,
                invoiceId = invoiceId,
                invoiceNumber = invoiceNumber,
                zatcaHash = zatcaHash
            )
        }
    }
}
