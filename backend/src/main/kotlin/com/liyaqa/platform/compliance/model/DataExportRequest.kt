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
@Table(name = "data_export_requests")
class DataExportRequest(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "request_number", nullable = false, unique = true)
    val requestNumber: String,

    @Column(name = "requester_name", nullable = false)
    val requesterName: String,

    @Column(name = "requester_email", nullable = false)
    val requesterEmail: String,

    @Column(name = "reason")
    var reason: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DataExportRequestStatus = DataExportRequestStatus.PENDING_APPROVAL,

    @Column(name = "approved_by")
    var approvedBy: UUID? = null,

    @Column(name = "approved_at")
    var approvedAt: Instant? = null,

    @Column(name = "rejected_by")
    var rejectedBy: UUID? = null,

    @Column(name = "rejected_at")
    var rejectedAt: Instant? = null,

    @Column(name = "rejection_reason")
    var rejectionReason: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "export_job_id")
    var exportJobId: UUID? = null,

    @Column(name = "file_url")
    var fileUrl: String? = null

) : OrganizationLevelEntity(id) {

    fun approve(approvedBy: UUID) {
        require(status == DataExportRequestStatus.PENDING_APPROVAL) {
            "Request must be PENDING_APPROVAL to approve, current status: $status"
        }
        this.status = DataExportRequestStatus.APPROVED
        this.approvedBy = approvedBy
        this.approvedAt = Instant.now()
    }

    fun reject(rejectedBy: UUID, reason: String) {
        require(status == DataExportRequestStatus.PENDING_APPROVAL) {
            "Request must be PENDING_APPROVAL to reject, current status: $status"
        }
        this.status = DataExportRequestStatus.REJECTED
        this.rejectedBy = rejectedBy
        this.rejectedAt = Instant.now()
        this.rejectionReason = reason
    }

    fun startProcessing() {
        require(status == DataExportRequestStatus.APPROVED) {
            "Request must be APPROVED to start processing, current status: $status"
        }
        this.status = DataExportRequestStatus.IN_PROGRESS
    }

    fun complete(fileUrl: String) {
        this.status = DataExportRequestStatus.COMPLETED
        this.fileUrl = fileUrl
        this.completedAt = Instant.now()
    }

    fun fail() {
        this.status = DataExportRequestStatus.FAILED
        this.completedAt = Instant.now()
    }

    companion object {
        fun create(
            tenantId: UUID,
            requesterName: String,
            requesterEmail: String,
            reason: String? = null
        ): DataExportRequest {
            return DataExportRequest(
                tenantId = tenantId,
                requestNumber = generateRequestNumber(),
                requesterName = requesterName,
                requesterEmail = requesterEmail,
                reason = reason
            )
        }

        fun generateRequestNumber(): String {
            val timestamp = System.currentTimeMillis()
            val random = (1000..9999).random()
            return "DER-$timestamp-$random"
        }
    }
}
