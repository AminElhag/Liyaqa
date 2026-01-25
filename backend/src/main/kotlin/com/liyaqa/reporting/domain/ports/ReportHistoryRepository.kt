package com.liyaqa.reporting.domain.ports

import com.liyaqa.reporting.domain.model.ReportHistory
import com.liyaqa.reporting.domain.model.ReportStatus
import com.liyaqa.reporting.domain.model.ReportType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.*

interface ReportHistoryRepository {
    fun save(history: ReportHistory): ReportHistory
    fun findById(id: UUID): Optional<ReportHistory>
    fun findAll(pageable: Pageable): Page<ReportHistory>
    fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ReportHistory>
    fun findByStatus(status: ReportStatus, pageable: Pageable): Page<ReportHistory>
    fun findByScheduledReportId(scheduledReportId: UUID, pageable: Pageable): Page<ReportHistory>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<ReportHistory>
    fun deleteById(id: UUID)
}
