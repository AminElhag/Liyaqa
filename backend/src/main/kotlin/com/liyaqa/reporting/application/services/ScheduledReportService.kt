package com.liyaqa.reporting.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.reporting.application.commands.CreateScheduledReportCommand
import com.liyaqa.reporting.application.commands.UpdateScheduledReportCommand
import com.liyaqa.reporting.domain.model.*
import com.liyaqa.reporting.domain.ports.ReportHistoryRepository
import com.liyaqa.reporting.domain.ports.ScheduledReportRepository
import com.liyaqa.shared.domain.TenantContext
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
@Transactional
class ScheduledReportService(
    private val scheduledReportRepository: ScheduledReportRepository,
    private val reportHistoryRepository: ReportHistoryRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(ScheduledReportService::class.java)

    fun createScheduledReport(command: CreateScheduledReportCommand, userId: UUID): ScheduledReport {
        val recipientsJson = objectMapper.writeValueAsString(command.recipients)
        val filtersJson = command.filters?.let { objectMapper.writeValueAsString(it) }

        val nextRun = calculateInitialNextRun(command.frequency)

        val report = ScheduledReport(
            name = command.name,
            nameAr = command.nameAr,
            reportType = command.reportType,
            frequency = command.frequency,
            recipients = recipientsJson,
            filters = filtersJson,
            format = command.format,
            nextRunAt = nextRun,
            createdBy = userId
        )

        logger.info("Created scheduled report: ${report.name} (${report.reportType})")
        return scheduledReportRepository.save(report)
    }

    fun updateScheduledReport(id: UUID, command: UpdateScheduledReportCommand): ScheduledReport {
        val report = scheduledReportRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scheduled report not found: $id") }

        command.name?.let { report.name = it }
        command.nameAr?.let { report.nameAr = it }
        command.frequency?.let {
            report.frequency = it
            report.nextRunAt = calculateInitialNextRun(it)
        }
        command.recipients?.let { report.recipients = objectMapper.writeValueAsString(it) }
        command.filters?.let { report.filters = objectMapper.writeValueAsString(it) }
        command.format?.let { report.format = it }
        command.enabled?.let {
            if (it) report.enable() else report.disable()
        }

        logger.info("Updated scheduled report: ${report.id}")
        return scheduledReportRepository.save(report)
    }

    @Transactional(readOnly = true)
    fun getScheduledReport(id: UUID): ScheduledReport? =
        scheduledReportRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listScheduledReports(pageable: Pageable): Page<ScheduledReport> =
        scheduledReportRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun listEnabledScheduledReports(pageable: Pageable): Page<ScheduledReport> =
        scheduledReportRepository.findByEnabled(true, pageable)

    fun deleteScheduledReport(id: UUID) {
        if (!scheduledReportRepository.existsById(id)) {
            throw NoSuchElementException("Scheduled report not found: $id")
        }
        scheduledReportRepository.deleteById(id)
        logger.info("Deleted scheduled report: $id")
    }

    fun enableScheduledReport(id: UUID): ScheduledReport {
        val report = scheduledReportRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scheduled report not found: $id") }
        report.enable()
        report.nextRunAt = calculateInitialNextRun(report.frequency)
        return scheduledReportRepository.save(report)
    }

    fun disableScheduledReport(id: UUID): ScheduledReport {
        val report = scheduledReportRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scheduled report not found: $id") }
        report.disable()
        return scheduledReportRepository.save(report)
    }

    @Transactional(readOnly = true)
    fun getDueReports(): List<ScheduledReport> =
        scheduledReportRepository.findDueReports(Instant.now())

    fun markReportExecuted(report: ScheduledReport): ScheduledReport {
        report.calculateNextRun()
        return scheduledReportRepository.save(report)
    }

    // Report History methods
    fun createReportHistory(
        reportType: ReportType,
        parameters: Map<String, Any>,
        scheduledReportId: UUID? = null,
        generatedBy: UUID? = null
    ): ReportHistory {
        val history = ReportHistory(
            scheduledReportId = scheduledReportId,
            reportType = reportType,
            parameters = objectMapper.writeValueAsString(parameters),
            generatedBy = generatedBy
        )
        return reportHistoryRepository.save(history)
    }

    fun updateReportHistoryCompleted(id: UUID, fileUrl: String, fileSize: Long): ReportHistory {
        val history = reportHistoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Report history not found: $id") }
        history.markCompleted(fileUrl, fileSize)
        return reportHistoryRepository.save(history)
    }

    fun updateReportHistoryFailed(id: UUID, errorMessage: String): ReportHistory {
        val history = reportHistoryRepository.findById(id)
            .orElseThrow { NoSuchElementException("Report history not found: $id") }
        history.markFailed(errorMessage)
        return reportHistoryRepository.save(history)
    }

    @Transactional(readOnly = true)
    fun listReportHistory(pageable: Pageable): Page<ReportHistory> =
        reportHistoryRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getReportHistory(id: UUID): ReportHistory? =
        reportHistoryRepository.findById(id).orElse(null)

    private fun calculateInitialNextRun(frequency: ReportFrequency): Instant {
        val now = Instant.now()
        return when (frequency) {
            ReportFrequency.DAILY -> now.plusSeconds(24 * 60 * 60)
            ReportFrequency.WEEKLY -> now.plusSeconds(7 * 24 * 60 * 60)
            ReportFrequency.MONTHLY -> now.plusSeconds(30 * 24 * 60 * 60)
        }
    }
}
