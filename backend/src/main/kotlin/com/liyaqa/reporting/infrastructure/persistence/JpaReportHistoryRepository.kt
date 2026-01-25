package com.liyaqa.reporting.infrastructure.persistence

import com.liyaqa.reporting.domain.model.ReportHistory
import com.liyaqa.reporting.domain.model.ReportStatus
import com.liyaqa.reporting.domain.model.ReportType
import com.liyaqa.reporting.domain.ports.ReportHistoryRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

interface SpringDataReportHistoryRepository : JpaRepository<ReportHistory, UUID> {
    fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ReportHistory>
    fun findByStatus(status: ReportStatus, pageable: Pageable): Page<ReportHistory>
    fun findByScheduledReportId(scheduledReportId: UUID, pageable: Pageable): Page<ReportHistory>
    fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<ReportHistory>
}

@Repository
class JpaReportHistoryRepository(
    private val springDataRepository: SpringDataReportHistoryRepository
) : ReportHistoryRepository {

    override fun save(history: ReportHistory): ReportHistory =
        springDataRepository.save(history)

    override fun findById(id: UUID): Optional<ReportHistory> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ReportHistory> =
        springDataRepository.findAll(pageable)

    override fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ReportHistory> =
        springDataRepository.findByReportType(reportType, pageable)

    override fun findByStatus(status: ReportStatus, pageable: Pageable): Page<ReportHistory> =
        springDataRepository.findByStatus(status, pageable)

    override fun findByScheduledReportId(scheduledReportId: UUID, pageable: Pageable): Page<ReportHistory> =
        springDataRepository.findByScheduledReportId(scheduledReportId, pageable)

    override fun findByCreatedAtBetween(start: Instant, end: Instant, pageable: Pageable): Page<ReportHistory> =
        springDataRepository.findByCreatedAtBetween(start, end, pageable)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)
}
