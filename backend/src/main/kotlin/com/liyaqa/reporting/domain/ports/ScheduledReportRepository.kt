package com.liyaqa.reporting.domain.ports

import com.liyaqa.reporting.domain.model.ReportType
import com.liyaqa.reporting.domain.model.ScheduledReport
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface ScheduledReportRepository {
    fun save(report: ScheduledReport): ScheduledReport
    fun findById(id: UUID): Optional<ScheduledReport>
    fun findAll(pageable: Pageable): Page<ScheduledReport>
    fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ScheduledReport>
    fun findDueReports(now: Instant): List<ScheduledReport>
    fun findByEnabled(enabled: Boolean, pageable: Pageable): Page<ScheduledReport>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}
