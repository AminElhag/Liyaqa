package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Generated compliance report.
 */
@Entity
@Table(name = "compliance_reports")
class ComplianceReport(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "framework_id")
    val framework: ComplianceFramework? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    val reportType: ReportType,

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "report_period_start")
    var reportPeriodStart: LocalDate? = null,

    @Column(name = "report_period_end")
    var reportPeriodEnd: LocalDate? = null,

    @Column(name = "generated_by", nullable = false)
    val generatedBy: UUID,

    @Column(name = "generated_at")
    var generatedAt: Instant? = null,

    @Column(name = "file_path")
    var filePath: String? = null,

    @Column(name = "file_name")
    var fileName: String? = null,

    @Column(name = "file_size")
    var fileSize: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "format")
    var format: ReportFormat = ReportFormat.PDF,

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    var status: ReportStatus = ReportStatus.GENERATING,

    @Column(name = "error_message", columnDefinition = "TEXT")
    var errorMessage: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    /**
     * Mark report as generated successfully.
     */
    fun markGenerated(path: String, name: String, size: Long) {
        status = ReportStatus.GENERATED
        filePath = path
        fileName = name
        fileSize = size
        generatedAt = Instant.now()
    }

    /**
     * Mark report generation as failed.
     */
    fun markFailed(error: String) {
        status = ReportStatus.FAILED
        errorMessage = error
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ComplianceReport) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
