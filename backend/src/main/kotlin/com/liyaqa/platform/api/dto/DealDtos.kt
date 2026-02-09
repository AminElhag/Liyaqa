package com.liyaqa.platform.api.dto

import com.liyaqa.platform.application.commands.ChangeStageCommand
import com.liyaqa.platform.application.commands.CreateDealActivityCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.application.services.DealMetrics
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealActivity
import com.liyaqa.platform.domain.model.DealActivityType
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ============================================
// Request DTOs
// ============================================

data class DealCreateRequest(
    val facilityName: String? = null,

    @field:NotBlank(message = "Contact name is required")
    val contactName: String,

    @field:NotBlank(message = "Contact email is required")
    @field:Email(message = "Invalid email format")
    val contactEmail: String,

    val contactPhone: String? = null,

    val source: DealSource = DealSource.WEBSITE,

    val notes: String? = null,

    val assignedToId: UUID? = null,

    @field:PositiveOrZero(message = "Estimated value must be zero or positive")
    val estimatedValue: BigDecimal? = null,

    val currency: String? = "SAR",

    val expectedCloseDate: LocalDate? = null
) {
    fun toCommand() = CreateDealCommand(
        facilityName = facilityName,
        contactName = contactName,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        source = source,
        notes = notes,
        assignedToId = assignedToId,
        estimatedValue = estimatedValue,
        currency = currency ?: "SAR",
        expectedCloseDate = expectedCloseDate
    )
}

data class DealUpdateRequest(
    val facilityName: String? = null,
    val contactName: String? = null,

    @field:Email(message = "Invalid email format")
    val contactEmail: String? = null,

    val contactPhone: String? = null,
    val notes: String? = null,

    @field:PositiveOrZero(message = "Estimated value must be zero or positive")
    val estimatedValue: BigDecimal? = null,

    val expectedCloseDate: LocalDate? = null
) {
    fun toCommand() = UpdateDealCommand(
        facilityName = facilityName,
        contactName = contactName,
        contactEmail = contactEmail,
        contactPhone = contactPhone,
        notes = notes,
        estimatedValue = estimatedValue,
        expectedCloseDate = expectedCloseDate
    )
}

data class ChangeStageRequest(
    val stage: DealStage,
    val reason: String? = null
) {
    fun toCommand() = ChangeStageCommand(
        newStage = stage,
        reason = reason
    )
}

data class CreateDealActivityRequest(
    val type: DealActivityType,

    @field:NotBlank(message = "Content is required")
    val content: String
) {
    fun toCommand() = CreateDealActivityCommand(
        type = type,
        content = content
    )
}

// ============================================
// Response DTOs
// ============================================

data class DealResponse(
    val id: UUID,
    val facilityName: String?,
    val contactName: String,
    val contactEmail: String,
    val contactPhone: String?,
    @JsonProperty("status")
    val stage: DealStage,
    val source: DealSource,
    val notes: String?,
    val assignedTo: PlatformUserSummary?,
    val estimatedValue: BigDecimal,
    val currency: String,
    val expectedCloseDate: LocalDate?,
    val closedAt: LocalDate?,
    val lostReason: String?,
    val createdAt: Instant,
    val updatedAt: Instant,
    val activities: List<DealActivityResponse>?
) {
    companion object {
        fun from(deal: Deal, activities: List<DealActivity>? = null) = DealResponse(
            id = deal.id,
            facilityName = deal.facilityName,
            contactName = deal.contactName,
            contactEmail = deal.contactEmail,
            contactPhone = deal.contactPhone,
            stage = deal.stage,
            source = deal.source,
            notes = deal.notes,
            assignedTo = try {
                PlatformUserSummary(
                    id = deal.assignedTo.id,
                    displayName = deal.assignedTo.displayName.en,
                    email = deal.assignedTo.email
                )
            } catch (_: Exception) { null },
            estimatedValue = deal.estimatedValue,
            currency = deal.currency,
            expectedCloseDate = deal.expectedCloseDate,
            closedAt = deal.closedAt,
            lostReason = deal.lostReason,
            createdAt = deal.createdAt,
            updatedAt = deal.updatedAt,
            activities = activities?.map { DealActivityResponse.from(it) }
        )
    }
}

data class DealSummaryResponse(
    val id: UUID,
    val facilityName: String?,
    val contactName: String,
    @JsonProperty("status")
    val stage: DealStage,
    val estimatedValue: BigDecimal,
    val expectedCloseDate: LocalDate?
) {
    companion object {
        fun from(deal: Deal) = DealSummaryResponse(
            id = deal.id,
            facilityName = deal.facilityName,
            contactName = deal.contactName,
            stage = deal.stage,
            estimatedValue = deal.estimatedValue,
            expectedCloseDate = deal.expectedCloseDate
        )
    }
}

data class DealActivityResponse(
    val id: UUID,
    val type: DealActivityType,
    val content: String,
    val createdBy: UUID,
    val createdAt: Instant
) {
    companion object {
        fun from(activity: DealActivity) = DealActivityResponse(
            id = activity.id,
            type = activity.type,
            content = activity.content,
            createdBy = activity.createdBy,
            createdAt = activity.createdAt
        )
    }
}

data class DealPipelineResponse(
    val counts: Map<DealStage, Long>
)

data class DealMetricsResponse(
    val totalDeals: Long,
    val openDeals: Long,
    val wonDeals: Long,
    val lostDeals: Long,
    val conversionRate: Double,
    val avgDealValue: BigDecimal,
    val avgDaysToClose: Double,
    val stageDistribution: Map<DealStage, Long>
) {
    companion object {
        fun from(metrics: DealMetrics) = DealMetricsResponse(
            totalDeals = metrics.totalDeals,
            openDeals = metrics.openDeals,
            wonDeals = metrics.wonDeals,
            lostDeals = metrics.lostDeals,
            conversionRate = metrics.conversionRate,
            avgDealValue = metrics.avgDealValue,
            avgDaysToClose = metrics.avgDaysToClose,
            stageDistribution = metrics.stageDistribution
        )
    }
}

data class PlatformUserSummary(
    val id: UUID,
    val displayName: String,
    val email: String
)
