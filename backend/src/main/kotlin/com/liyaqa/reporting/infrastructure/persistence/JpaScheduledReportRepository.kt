package com.liyaqa.reporting.infrastructure.persistence

import com.liyaqa.reporting.domain.model.ReportType
import com.liyaqa.reporting.domain.model.ScheduledReport
import com.liyaqa.reporting.domain.ports.ScheduledReportRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.*

interface SpringDataScheduledReportRepository : JpaRepository<ScheduledReport, UUID> {
    fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ScheduledReport>
    fun findByEnabled(enabled: Boolean, pageable: Pageable): Page<ScheduledReport>

    @Query("SELECT sr FROM ScheduledReport sr WHERE sr.enabled = true AND sr.nextRunAt <= :now")
    fun findDueReports(@Param("now") now: Instant): List<ScheduledReport>
}

@Repository
class JpaScheduledReportRepository(
    private val springDataRepository: SpringDataScheduledReportRepository
) : ScheduledReportRepository {

    override fun save(report: ScheduledReport): ScheduledReport =
        springDataRepository.save(report)

    override fun findById(id: UUID): Optional<ScheduledReport> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<ScheduledReport> =
        springDataRepository.findAll(pageable)

    override fun findByReportType(reportType: ReportType, pageable: Pageable): Page<ScheduledReport> =
        springDataRepository.findByReportType(reportType, pageable)

    override fun findDueReports(now: Instant): List<ScheduledReport> =
        springDataRepository.findDueReports(now)

    override fun findByEnabled(enabled: Boolean, pageable: Pageable): Page<ScheduledReport> =
        springDataRepository.findByEnabled(enabled, pageable)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)
}
