package com.liyaqa.reporting.application.commands

import com.liyaqa.reporting.domain.model.ReportFormat
import com.liyaqa.reporting.domain.model.ReportFrequency
import com.liyaqa.reporting.domain.model.ReportType
import java.time.LocalDate
import java.util.*

data class CreateScheduledReportCommand(
    val name: String,
    val nameAr: String? = null,
    val reportType: ReportType,
    val frequency: ReportFrequency,
    val recipients: List<String>,
    val filters: Map<String, Any>? = null,
    val format: ReportFormat = ReportFormat.PDF
)

data class UpdateScheduledReportCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val frequency: ReportFrequency? = null,
    val recipients: List<String>? = null,
    val filters: Map<String, Any>? = null,
    val format: ReportFormat? = null,
    val enabled: Boolean? = null
)

data class GenerateReportCommand(
    val reportType: ReportType,
    val format: ReportFormat = ReportFormat.PDF,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val filters: Map<String, Any>? = null
)

data class ChurnReportFilters(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val planIds: List<UUID>? = null,
    val locationIds: List<UUID>? = null
)

data class LtvReportFilters(
    val startDate: LocalDate,
    val endDate: LocalDate,
    val segmentBy: LtvSegment = LtvSegment.PLAN
)

enum class LtvSegment {
    PLAN,
    LOCATION,
    JOIN_MONTH,
    GENDER
}

data class RetentionCohortFilters(
    val startMonth: LocalDate,
    val endMonth: LocalDate,
    val cohortSize: Int = 6 // Number of months
)
