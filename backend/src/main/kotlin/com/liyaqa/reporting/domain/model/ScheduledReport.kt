package com.liyaqa.reporting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "scheduled_reports")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ScheduledReport(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "name_ar", length = 100)
    var nameAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false, length = 50)
    val reportType: ReportType,

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false, length = 20)
    var frequency: ReportFrequency,

    @Column(name = "recipients", nullable = false, columnDefinition = "TEXT")
    var recipients: String, // JSON array of emails

    @Column(name = "filters", columnDefinition = "TEXT")
    var filters: String? = null, // JSON filters

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false, length = 10)
    var format: ReportFormat = ReportFormat.PDF,

    @Column(name = "next_run_at", nullable = false)
    var nextRunAt: Instant,

    @Column(name = "last_run_at")
    var lastRunAt: Instant? = null,

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = true,

    @Column(name = "created_by", nullable = false)
    val createdBy: UUID
) : BaseEntity(id) {

    fun calculateNextRun(): Instant {
        val now = Instant.now()
        nextRunAt = when (frequency) {
            ReportFrequency.DAILY -> now.plusSeconds(24 * 60 * 60)
            ReportFrequency.WEEKLY -> now.plusSeconds(7 * 24 * 60 * 60)
            ReportFrequency.MONTHLY -> now.plusSeconds(30 * 24 * 60 * 60)
        }
        lastRunAt = now
        return nextRunAt
    }

    fun disable() {
        enabled = false
    }

    fun enable() {
        enabled = true
    }
}
