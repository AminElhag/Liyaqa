package com.liyaqa.reporting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "report_history")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ReportHistory(
    id: UUID = UUID.randomUUID(),

    @Column(name = "scheduled_report_id")
    val scheduledReportId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 50)
    val reportType: ReportType,

    @Column(name = "parameters", nullable = false, columnDefinition = "TEXT")
    val parameters: String, // JSON

    @Column(name = "file_url")
    var fileUrl: String? = null,

    @Column(name = "file_size")
    var fileSize: Long? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: ReportStatus = ReportStatus.PENDING,

    @Column(name = "error_message")
    var errorMessage: String? = null,

    @Column(name = "generated_by")
    val generatedBy: UUID? = null,

    @Column(name = "generated_at")
    var generatedAt: Instant? = null
) : BaseEntity(id) {

    fun markProcessing() {
        status = ReportStatus.PROCESSING
    }

    fun markCompleted(fileUrl: String, fileSize: Long) {
        this.status = ReportStatus.COMPLETED
        this.fileUrl = fileUrl
        this.fileSize = fileSize
        this.generatedAt = Instant.now()
    }

    fun markFailed(errorMessage: String) {
        this.status = ReportStatus.FAILED
        this.errorMessage = errorMessage
        this.generatedAt = Instant.now()
    }
}
