package com.liyaqa.reporting.api

import com.liyaqa.reporting.application.commands.LtvSegment
import com.liyaqa.reporting.application.services.ChurnAnalysisService
import com.liyaqa.reporting.application.services.LtvAnalysisService
import com.liyaqa.reporting.domain.model.*
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.util.*

// ========== Request DTOs ==========

data class CreateScheduledReportRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,
    val nameAr: String? = null,

    @field:NotNull(message = "Report type is required")
    val reportType: ReportType,

    @field:NotNull(message = "Frequency is required")
    val frequency: ReportFrequency,

    @field:NotEmpty(message = "At least one recipient is required")
    val recipients: List<@Email String>,

    val filters: Map<String, Any>? = null,
    val format: ReportFormat = ReportFormat.PDF
)

data class UpdateScheduledReportRequest(
    val name: String? = null,
    val nameAr: String? = null,
    val frequency: ReportFrequency? = null,
    val recipients: List<@Email String>? = null,
    val filters: Map<String, Any>? = null,
    val format: ReportFormat? = null,
    val enabled: Boolean? = null
)

data class GenerateChurnReportRequest(
    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate,

    val planIds: List<UUID>? = null,
    val locationIds: List<UUID>? = null,
    val format: ReportFormat = ReportFormat.PDF
)

data class GenerateLtvReportRequest(
    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate,

    val segmentBy: LtvSegment = LtvSegment.PLAN,
    val format: ReportFormat = ReportFormat.PDF
)

// ========== Response DTOs ==========

data class ScheduledReportResponse(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val reportType: ReportType,
    val frequency: ReportFrequency,
    val recipients: List<String>,
    val filters: Map<String, Any>?,
    val format: ReportFormat,
    val nextRunAt: Instant,
    val lastRunAt: Instant?,
    val enabled: Boolean,
    val createdBy: UUID,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(report: ScheduledReport, objectMapper: com.fasterxml.jackson.databind.ObjectMapper): ScheduledReportResponse {
            val recipientsList = try {
                objectMapper.readValue(report.recipients, List::class.java) as List<String>
            } catch (e: Exception) {
                emptyList()
            }

            val filtersMap = report.filters?.let {
                try {
                    objectMapper.readValue(it, Map::class.java) as Map<String, Any>
                } catch (e: Exception) {
                    null
                }
            }

            return ScheduledReportResponse(
                id = report.id,
                name = report.name,
                nameAr = report.nameAr,
                reportType = report.reportType,
                frequency = report.frequency,
                recipients = recipientsList,
                filters = filtersMap,
                format = report.format,
                nextRunAt = report.nextRunAt,
                lastRunAt = report.lastRunAt,
                enabled = report.enabled,
                createdBy = report.createdBy,
                createdAt = report.createdAt,
                updatedAt = report.updatedAt
            )
        }
    }
}

data class ReportHistoryResponse(
    val id: UUID,
    val scheduledReportId: UUID?,
    val reportType: ReportType,
    val parameters: Map<String, Any>,
    val fileUrl: String?,
    val fileSize: Long?,
    val status: ReportStatus,
    val errorMessage: String?,
    val generatedBy: UUID?,
    val generatedAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(history: ReportHistory, objectMapper: com.fasterxml.jackson.databind.ObjectMapper): ReportHistoryResponse {
            val params = try {
                objectMapper.readValue(history.parameters, Map::class.java) as Map<String, Any>
            } catch (e: Exception) {
                emptyMap()
            }

            return ReportHistoryResponse(
                id = history.id,
                scheduledReportId = history.scheduledReportId,
                reportType = history.reportType,
                parameters = params,
                fileUrl = history.fileUrl,
                fileSize = history.fileSize,
                status = history.status,
                errorMessage = history.errorMessage,
                generatedBy = history.generatedBy,
                generatedAt = history.generatedAt,
                createdAt = history.createdAt
            )
        }
    }
}

data class ChurnReportResponse(
    val period: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val totalMembersStart: Long,
    val totalMembersEnd: Long,
    val newMembers: Long,
    val churnedMembers: Long,
    val churnRate: BigDecimal,
    val retentionRate: BigDecimal,
    val churnByPlan: List<ChurnByPlanResponse>,
    val churnByMonth: List<ChurnByMonthResponse>,
    val churnReasons: List<ChurnReasonResponse>
) {
    companion object {
        fun from(data: ChurnAnalysisService.ChurnReportData) = ChurnReportResponse(
            period = data.period,
            startDate = data.startDate,
            endDate = data.endDate,
            totalMembersStart = data.totalMembersStart,
            totalMembersEnd = data.totalMembersEnd,
            newMembers = data.newMembers,
            churnedMembers = data.churnedMembers,
            churnRate = data.churnRate,
            retentionRate = data.retentionRate,
            churnByPlan = data.churnByPlan.map { ChurnByPlanResponse.from(it) },
            churnByMonth = data.churnByMonth.map { ChurnByMonthResponse.from(it) },
            churnReasons = data.churnReasons.map { ChurnReasonResponse.from(it) }
        )
    }
}

data class ChurnByPlanResponse(
    val planId: UUID,
    val planName: String,
    val totalMembers: Long,
    val churnedMembers: Long,
    val churnRate: BigDecimal
) {
    companion object {
        fun from(data: ChurnAnalysisService.ChurnByPlan) = ChurnByPlanResponse(
            planId = data.planId,
            planName = data.planName,
            totalMembers = data.totalMembers,
            churnedMembers = data.churnedMembers,
            churnRate = data.churnRate
        )
    }
}

data class ChurnByMonthResponse(
    val month: String,
    val churnedMembers: Long,
    val churnRate: BigDecimal
) {
    companion object {
        fun from(data: ChurnAnalysisService.ChurnByMonth) = ChurnByMonthResponse(
            month = data.month.toString(),
            churnedMembers = data.churnedMembers,
            churnRate = data.churnRate
        )
    }
}

data class ChurnReasonResponse(
    val reason: String,
    val reasonAr: String,
    val count: Long,
    val percentage: BigDecimal
) {
    companion object {
        fun from(data: ChurnAnalysisService.ChurnReason) = ChurnReasonResponse(
            reason = data.reason,
            reasonAr = data.reasonAr,
            count = data.count,
            percentage = data.percentage
        )
    }
}

data class LtvReportResponse(
    val period: String,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val totalMembers: Long,
    val averageLtv: BigDecimal,
    val medianLtv: BigDecimal,
    val totalRevenue: BigDecimal,
    val averageLifespanMonths: BigDecimal,
    val ltvBySegment: List<LtvBySegmentResponse>,
    val ltvDistribution: List<LtvBucketResponse>,
    val topMembers: List<MemberLtvResponse>
) {
    companion object {
        fun from(data: LtvAnalysisService.LtvReportData) = LtvReportResponse(
            period = data.period,
            startDate = data.startDate,
            endDate = data.endDate,
            totalMembers = data.totalMembers,
            averageLtv = data.averageLtv,
            medianLtv = data.medianLtv,
            totalRevenue = data.totalRevenue,
            averageLifespanMonths = data.averageLifespanMonths,
            ltvBySegment = data.ltvBySegment.map { LtvBySegmentResponse.from(it) },
            ltvDistribution = data.ltvDistribution.map { LtvBucketResponse.from(it) },
            topMembers = data.topMembers.map { MemberLtvResponse.from(it) }
        )
    }
}

data class LtvBySegmentResponse(
    val segmentId: String,
    val segmentName: String,
    val segmentNameAr: String?,
    val memberCount: Long,
    val averageLtv: BigDecimal,
    val totalRevenue: BigDecimal
) {
    companion object {
        fun from(data: LtvAnalysisService.LtvBySegment) = LtvBySegmentResponse(
            segmentId = data.segmentId,
            segmentName = data.segmentName,
            segmentNameAr = data.segmentNameAr,
            memberCount = data.memberCount,
            averageLtv = data.averageLtv,
            totalRevenue = data.totalRevenue
        )
    }
}

data class LtvBucketResponse(
    val rangeMin: BigDecimal,
    val rangeMax: BigDecimal,
    val label: String,
    val count: Long,
    val percentage: BigDecimal
) {
    companion object {
        fun from(data: LtvAnalysisService.LtvBucket) = LtvBucketResponse(
            rangeMin = data.rangeMin,
            rangeMax = data.rangeMax,
            label = data.label,
            count = data.count,
            percentage = data.percentage
        )
    }
}

data class MemberLtvResponse(
    val memberId: UUID,
    val memberName: String,
    val ltv: BigDecimal,
    val lifespanMonths: Int,
    val transactionCount: Int
) {
    companion object {
        fun from(data: LtvAnalysisService.MemberLtv) = MemberLtvResponse(
            memberId = data.memberId,
            memberName = data.memberName,
            ltv = data.ltv,
            lifespanMonths = data.lifespanMonths,
            transactionCount = data.transactionCount
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
