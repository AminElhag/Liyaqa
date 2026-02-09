package com.liyaqa.platform.tenant.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "data_export_jobs")
class DataExportJob(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DataExportStatus = DataExportStatus.PENDING,

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false)
    val format: DataExportFormat = DataExportFormat.JSON,

    @Column(name = "requested_by", nullable = false)
    val requestedBy: UUID,

    @Column(name = "started_at")
    var startedAt: Instant? = null,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "file_url")
    var fileUrl: String? = null,

    @Column(name = "file_size_bytes")
    var fileSizeBytes: Long? = null,

    @Column(name = "error_message")
    var errorMessage: String? = null,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null

) : OrganizationLevelEntity(id) {

    fun start() {
        status = DataExportStatus.IN_PROGRESS
        startedAt = Instant.now()
    }

    fun complete(fileUrl: String, fileSizeBytes: Long) {
        status = DataExportStatus.COMPLETED
        this.fileUrl = fileUrl
        this.fileSizeBytes = fileSizeBytes
        completedAt = Instant.now()
        expiresAt = Instant.now().plusSeconds(30L * 24 * 60 * 60) // 30 days
    }

    fun fail(errorMessage: String) {
        status = DataExportStatus.FAILED
        this.errorMessage = errorMessage
        completedAt = Instant.now()
    }

    fun isExpired(): Boolean {
        return expiresAt != null && Instant.now().isAfter(expiresAt)
    }

    companion object {
        fun create(
            tenantId: UUID,
            format: DataExportFormat,
            requestedBy: UUID
        ): DataExportJob {
            return DataExportJob(
                tenantId = tenantId,
                format = format,
                requestedBy = requestedBy
            )
        }
    }
}
