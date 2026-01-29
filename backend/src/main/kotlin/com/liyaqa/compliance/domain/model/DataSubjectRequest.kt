package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Data Subject Request (DSR) for PDPL Articles 15-23 compliance.
 * Handles access, rectification, erasure, portability, restriction, and objection requests.
 */
@Entity
@Table(name = "data_subject_requests")
class DataSubjectRequest(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "request_number", nullable = false)
    val requestNumber: String,

    @Column(name = "member_id")
    var memberId: UUID? = null,

    @Column(name = "requester_name", nullable = false)
    var requesterName: String,

    @Column(name = "requester_email", nullable = false)
    var requesterEmail: String,

    @Column(name = "requester_phone")
    var requesterPhone: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false)
    var requestType: DataSubjectRequestType,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "identity_verified")
    var identityVerified: Boolean = false,

    @Column(name = "identity_verified_at")
    var identityVerifiedAt: Instant? = null,

    @Column(name = "identity_verified_by")
    var identityVerifiedBy: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method")
    var verificationMethod: VerificationMethod? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DSRStatus = DSRStatus.RECEIVED,

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    var priority: DSRPriority = DSRPriority.NORMAL,

    @Column(name = "assigned_to_user_id")
    var assignedToUserId: UUID? = null,

    @Column(name = "received_at", nullable = false)
    val receivedAt: Instant = Instant.now(),

    @Column(name = "due_date", nullable = false)
    var dueDate: LocalDate, // PDPL Article 26: 30 days

    @Column(name = "extended_due_date")
    var extendedDueDate: LocalDate? = null,

    @Column(name = "extension_reason", columnDefinition = "TEXT")
    var extensionReason: String? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    var rejectionReason: String? = null,

    @Column(name = "response_sent_at")
    var responseSentAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "response_method")
    var responseMethod: ResponseMethod? = null,

    @Column(name = "data_exported_path")
    var dataExportedPath: String? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var entityVersion: Long = 0
) {
    companion object {
        /**
         * Generate a request number.
         */
        fun generateRequestNumber(): String {
            val timestamp = System.currentTimeMillis()
            return "DSR-${timestamp}-${(1000..9999).random()}"
        }

        /**
         * Calculate due date (30 days from now per PDPL Article 26).
         */
        fun calculateDueDate(): LocalDate {
            return LocalDate.now().plusDays(30)
        }
    }

    /**
     * Verify identity.
     */
    fun verifyIdentity(verifierId: UUID, method: VerificationMethod) {
        identityVerified = true
        identityVerifiedAt = Instant.now()
        identityVerifiedBy = verifierId
        verificationMethod = method
        if (status == DSRStatus.IDENTITY_PENDING) {
            status = DSRStatus.IN_PROGRESS
        }
        updatedAt = Instant.now()
    }

    /**
     * Assign to user.
     */
    fun assignTo(userId: UUID) {
        assignedToUserId = userId
        updatedAt = Instant.now()
    }

    /**
     * Start processing.
     */
    fun startProcessing() {
        require(identityVerified) { "Identity must be verified before processing" }
        status = DSRStatus.IN_PROGRESS
        updatedAt = Instant.now()
    }

    /**
     * Request approval.
     */
    fun requestApproval() {
        status = DSRStatus.PENDING_APPROVAL
        updatedAt = Instant.now()
    }

    /**
     * Complete the request.
     */
    fun complete(responseMethod: ResponseMethod, dataPath: String? = null) {
        status = DSRStatus.COMPLETED
        completedAt = Instant.now()
        responseSentAt = Instant.now()
        this.responseMethod = responseMethod
        dataExportedPath = dataPath
        updatedAt = Instant.now()
    }

    /**
     * Reject the request.
     */
    fun reject(reason: String) {
        status = DSRStatus.REJECTED
        rejectionReason = reason
        completedAt = Instant.now()
        updatedAt = Instant.now()
    }

    /**
     * Extend deadline.
     */
    fun extendDeadline(newDueDate: LocalDate, reason: String) {
        status = DSRStatus.EXTENDED
        extendedDueDate = newDueDate
        extensionReason = reason
        updatedAt = Instant.now()
    }

    /**
     * Check if overdue.
     */
    fun isOverdue(): Boolean {
        val effectiveDueDate = extendedDueDate ?: dueDate
        return effectiveDueDate.isBefore(LocalDate.now()) &&
                status !in listOf(DSRStatus.COMPLETED, DSRStatus.REJECTED)
    }

    /**
     * Get days until due.
     */
    fun getDaysUntilDue(): Long {
        val effectiveDueDate = extendedDueDate ?: dueDate
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), effectiveDueDate)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is DataSubjectRequest) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
