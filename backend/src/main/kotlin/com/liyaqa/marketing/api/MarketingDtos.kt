package com.liyaqa.marketing.api

import com.liyaqa.marketing.application.commands.CreateCampaignCommand
import com.liyaqa.marketing.application.commands.CreateCampaignStepCommand
import com.liyaqa.marketing.application.commands.CreateSegmentCommand
import com.liyaqa.marketing.application.commands.UpdateCampaignCommand
import com.liyaqa.marketing.application.commands.UpdateCampaignStepCommand
import com.liyaqa.marketing.application.commands.UpdateSegmentCommand
import com.liyaqa.marketing.application.services.AbTestResult
import com.liyaqa.marketing.application.services.CampaignAnalytics
import com.liyaqa.marketing.application.services.MarketingOverview
import com.liyaqa.marketing.application.services.TimelineDataPoint
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.MessageLog
import com.liyaqa.marketing.domain.model.MessageStatus
import com.liyaqa.marketing.domain.model.Segment
import com.liyaqa.marketing.domain.model.SegmentCriteria
import com.liyaqa.marketing.domain.model.SegmentType
import com.liyaqa.marketing.domain.model.TriggerConfig
import com.liyaqa.marketing.domain.model.TriggerType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==================== CAMPAIGN DTOs ====================

data class CreateCampaignRequest(
    @field:NotBlank val name: String,
    val description: String? = null,
    @field:NotNull val campaignType: CampaignType,
    @field:NotNull val triggerType: TriggerType,
    val triggerConfig: TriggerConfigDto? = null,
    val segmentId: UUID? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
) {
    fun toCommand() = CreateCampaignCommand(
        name = name,
        description = description,
        campaignType = campaignType,
        triggerType = triggerType,
        triggerConfig = triggerConfig?.toModel(),
        segmentId = segmentId,
        startDate = startDate,
        endDate = endDate
    )
}

data class UpdateCampaignRequest(
    val name: String? = null,
    val description: String? = null,
    val triggerConfig: TriggerConfigDto? = null,
    val segmentId: UUID? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
) {
    fun toCommand() = UpdateCampaignCommand(
        name = name,
        description = description,
        triggerConfig = triggerConfig?.toModel(),
        segmentId = segmentId,
        startDate = startDate,
        endDate = endDate
    )
}

data class TriggerConfigDto(
    val days: Int? = null,
    val time: String? = null,
    val excludeWeekends: Boolean? = null,
    val planIds: List<UUID>? = null
) {
    fun toModel() = TriggerConfig(
        days = days,
        time = time,
        excludeWeekends = excludeWeekends,
        planIds = planIds
    )

    companion object {
        fun from(config: TriggerConfig?) = config?.let {
            TriggerConfigDto(
                days = it.days,
                time = it.time,
                excludeWeekends = it.excludeWeekends,
                planIds = it.planIds
            )
        }
    }
}

data class CampaignResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val campaignType: CampaignType,
    val status: CampaignStatus,
    val triggerType: TriggerType,
    val triggerConfig: TriggerConfigDto?,
    val segmentId: UUID?,
    val startDate: LocalDate?,
    val endDate: LocalDate?,
    val totalEnrolled: Int,
    val totalCompleted: Int,
    val isTemplate: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(campaign: Campaign) = CampaignResponse(
            id = campaign.id,
            name = campaign.name,
            description = campaign.description,
            campaignType = campaign.campaignType,
            status = campaign.status,
            triggerType = campaign.triggerType,
            triggerConfig = TriggerConfigDto.from(campaign.triggerConfig),
            segmentId = campaign.segmentId,
            startDate = campaign.startDate,
            endDate = campaign.endDate,
            totalEnrolled = campaign.totalEnrolled,
            totalCompleted = campaign.totalCompleted,
            isTemplate = campaign.isTemplate,
            createdAt = campaign.createdAt,
            updatedAt = campaign.updatedAt
        )
    }
}

data class CampaignDetailResponse(
    val campaign: CampaignResponse,
    val steps: List<CampaignStepResponse>
)

data class DuplicateCampaignRequest(
    @field:NotBlank val newName: String
)

data class CreateFromTemplateRequest(
    @field:NotBlank val name: String
)

// ==================== CAMPAIGN STEP DTOs ====================

data class CreateCampaignStepRequest(
    @field:NotBlank val name: String,
    @field:NotNull val channel: MarketingChannel,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    @field:NotBlank val bodyEn: String,
    @field:NotBlank val bodyAr: String,
    val delayDays: Int = 0,
    val delayHours: Int = 0,
    val isAbTest: Boolean = false,
    val abVariant: Char? = null,
    val abSplitPercentage: Int? = null
) {
    fun toCommand(campaignId: UUID) = CreateCampaignStepCommand(
        campaignId = campaignId,
        name = name,
        channel = channel,
        subjectEn = subjectEn,
        subjectAr = subjectAr,
        bodyEn = bodyEn,
        bodyAr = bodyAr,
        delayDays = delayDays,
        delayHours = delayHours,
        isAbTest = isAbTest,
        abVariant = abVariant,
        abSplitPercentage = abSplitPercentage
    )
}

data class UpdateCampaignStepRequest(
    val name: String? = null,
    val channel: MarketingChannel? = null,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    val bodyEn: String? = null,
    val bodyAr: String? = null,
    val delayDays: Int? = null,
    val delayHours: Int? = null
) {
    fun toCommand() = UpdateCampaignStepCommand(
        name = name,
        channel = channel,
        subjectEn = subjectEn,
        subjectAr = subjectAr,
        bodyEn = bodyEn,
        bodyAr = bodyAr,
        delayDays = delayDays,
        delayHours = delayHours
    )
}

data class CampaignStepResponse(
    val id: UUID,
    val campaignId: UUID,
    val stepNumber: Int,
    val name: String,
    val channel: MarketingChannel,
    val subjectEn: String?,
    val subjectAr: String?,
    val bodyEn: String,
    val bodyAr: String,
    val delayDays: Int,
    val delayHours: Int,
    val isAbTest: Boolean,
    val abVariant: Char?,
    val abSplitPercentage: Int?,
    val isActive: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(step: CampaignStep) = CampaignStepResponse(
            id = step.id,
            campaignId = step.campaignId,
            stepNumber = step.stepNumber,
            name = step.name,
            channel = step.channel,
            subjectEn = step.subjectEn,
            subjectAr = step.subjectAr,
            bodyEn = step.bodyEn,
            bodyAr = step.bodyAr,
            delayDays = step.delayDays,
            delayHours = step.delayHours,
            isAbTest = step.isAbTest,
            abVariant = step.abVariant,
            abSplitPercentage = step.abSplitPercentage,
            isActive = step.isActive,
            createdAt = step.createdAt
        )
    }
}

// ==================== SEGMENT DTOs ====================

data class CreateSegmentRequest(
    @field:NotBlank val name: String,
    val description: String? = null,
    @field:NotNull val segmentType: SegmentType,
    val criteria: SegmentCriteriaDto? = null
) {
    fun toCommand() = CreateSegmentCommand(
        name = name,
        description = description,
        segmentType = segmentType,
        criteria = criteria?.toModel()
    )
}

data class UpdateSegmentRequest(
    val name: String? = null,
    val description: String? = null,
    val criteria: SegmentCriteriaDto? = null
) {
    fun toCommand() = UpdateSegmentCommand(
        name = name,
        description = description,
        criteria = criteria?.toModel()
    )
}

data class SegmentCriteriaDto(
    val memberStatuses: List<String>? = null,
    val subscriptionStatuses: List<String>? = null,
    val planIds: List<UUID>? = null,
    val inactiveDays: Int? = null,
    val joinedAfterDays: Int? = null,
    val expiringWithinDays: Int? = null,
    val expiredWithinDays: Int? = null,
    val hasActiveSubscription: Boolean? = null,
    val gender: String? = null,
    val minAge: Int? = null,
    val maxAge: Int? = null,
    val tags: List<String>? = null,
    val excludeMemberIds: List<UUID>? = null
) {
    fun toModel() = SegmentCriteria(
        memberStatuses = memberStatuses,
        subscriptionStatuses = subscriptionStatuses,
        planIds = planIds,
        inactiveDays = inactiveDays,
        joinedAfterDays = joinedAfterDays,
        expiringWithinDays = expiringWithinDays,
        expiredWithinDays = expiredWithinDays,
        hasActiveSubscription = hasActiveSubscription,
        gender = gender,
        minAge = minAge,
        maxAge = maxAge,
        tags = tags,
        excludeMemberIds = excludeMemberIds
    )

    companion object {
        fun from(criteria: SegmentCriteria?) = criteria?.let {
            SegmentCriteriaDto(
                memberStatuses = it.memberStatuses,
                subscriptionStatuses = it.subscriptionStatuses,
                planIds = it.planIds,
                inactiveDays = it.inactiveDays,
                joinedAfterDays = it.joinedAfterDays,
                expiringWithinDays = it.expiringWithinDays,
                expiredWithinDays = it.expiredWithinDays,
                hasActiveSubscription = it.hasActiveSubscription,
                gender = it.gender,
                minAge = it.minAge,
                maxAge = it.maxAge,
                tags = it.tags,
                excludeMemberIds = it.excludeMemberIds
            )
        }
    }
}

data class SegmentResponse(
    val id: UUID,
    val name: String,
    val description: String?,
    val segmentType: SegmentType,
    val criteria: SegmentCriteriaDto?,
    val memberCount: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(segment: Segment) = SegmentResponse(
            id = segment.id,
            name = segment.name,
            description = segment.description,
            segmentType = segment.segmentType,
            criteria = SegmentCriteriaDto.from(segment.criteria),
            memberCount = segment.memberCount,
            isActive = segment.isActive,
            createdAt = segment.createdAt,
            updatedAt = segment.updatedAt
        )
    }
}

data class AddSegmentMembersRequest(
    val memberIds: List<UUID>
)

// ==================== ENROLLMENT DTOs ====================

data class EnrollmentResponse(
    val id: UUID,
    val campaignId: UUID,
    val memberId: UUID,
    val status: EnrollmentStatus,
    val currentStep: Int,
    val enrolledAt: Instant,
    val completedAt: Instant?,
    val cancelledAt: Instant?,
    val nextStepDueAt: Instant?,
    val abGroup: Char?
) {
    companion object {
        fun from(enrollment: CampaignEnrollment) = EnrollmentResponse(
            id = enrollment.id,
            campaignId = enrollment.campaignId,
            memberId = enrollment.memberId,
            status = enrollment.status,
            currentStep = enrollment.currentStep,
            enrolledAt = enrollment.enrolledAt,
            completedAt = enrollment.completedAt,
            cancelledAt = enrollment.cancelledAt,
            nextStepDueAt = enrollment.nextStepDueAt,
            abGroup = enrollment.abGroup
        )
    }
}

data class EnrollMembersRequest(
    val memberIds: List<UUID>
)

// ==================== MESSAGE LOG DTOs ====================

data class MessageLogResponse(
    val id: UUID,
    val campaignId: UUID,
    val stepId: UUID,
    val memberId: UUID,
    val channel: MarketingChannel,
    val status: MessageStatus,
    val sentAt: Instant?,
    val deliveredAt: Instant?,
    val openedAt: Instant?,
    val clickedAt: Instant?,
    val failedAt: Instant?,
    val errorMessage: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(log: MessageLog) = MessageLogResponse(
            id = log.id,
            campaignId = log.campaignId,
            stepId = log.stepId,
            memberId = log.memberId,
            channel = log.channel,
            status = log.status,
            sentAt = log.sentAt,
            deliveredAt = log.deliveredAt,
            openedAt = log.openedAt,
            clickedAt = log.clickedAt,
            failedAt = log.failedAt,
            errorMessage = log.errorMessage,
            createdAt = log.createdAt
        )
    }
}

// ==================== ANALYTICS DTOs ====================

data class MarketingOverviewResponse(
    val activeCampaigns: Long,
    val draftCampaigns: Long,
    val pausedCampaigns: Long,
    val messagesSentLast30Days: Long,
    val deliveryRate: Double,
    val openRate: Double,
    val clickRate: Double
) {
    companion object {
        fun from(overview: MarketingOverview) = MarketingOverviewResponse(
            activeCampaigns = overview.activeCampaigns,
            draftCampaigns = overview.draftCampaigns,
            pausedCampaigns = overview.pausedCampaigns,
            messagesSentLast30Days = overview.messagesSentLast30Days,
            deliveryRate = overview.deliveryRate,
            openRate = overview.openRate,
            clickRate = overview.clickRate
        )
    }
}

data class CampaignAnalyticsResponse(
    val campaignId: UUID,
    val campaignName: String,
    val status: CampaignStatus,
    val totalEnrolled: Long,
    val activeEnrollments: Long,
    val completedEnrollments: Long,
    val completionRate: Double,
    val totalMessages: Long,
    val sentMessages: Long,
    val deliveredMessages: Long,
    val failedMessages: Long,
    val openedMessages: Long,
    val clickedMessages: Long,
    val deliveryRate: Double,
    val openRate: Double,
    val clickRate: Double
) {
    companion object {
        fun from(analytics: CampaignAnalytics) = CampaignAnalyticsResponse(
            campaignId = analytics.campaignId,
            campaignName = analytics.campaignName,
            status = analytics.status,
            totalEnrolled = analytics.totalEnrolled,
            activeEnrollments = analytics.activeEnrollments,
            completedEnrollments = analytics.completedEnrollments,
            completionRate = analytics.completionRate,
            totalMessages = analytics.messageStats.total,
            sentMessages = analytics.messageStats.sent,
            deliveredMessages = analytics.messageStats.delivered,
            failedMessages = analytics.messageStats.failed,
            openedMessages = analytics.messageStats.opened,
            clickedMessages = analytics.messageStats.clicked,
            deliveryRate = analytics.messageStats.deliveryRate,
            openRate = analytics.messageStats.openRate,
            clickRate = analytics.messageStats.clickRate
        )
    }
}

data class AbTestResultResponse(
    val stepNumber: Int,
    val stepName: String,
    val variants: List<AbTestVariantResponse>,
    val winner: Char?
) {
    companion object {
        fun from(result: AbTestResult) = AbTestResultResponse(
            stepNumber = result.stepNumber,
            stepName = result.stepName,
            variants = result.variants.map { AbTestVariantResponse.from(it) },
            winner = result.winner
        )
    }
}

data class AbTestVariantResponse(
    val variant: Char,
    val stepId: UUID,
    val sent: Long,
    val delivered: Long,
    val opened: Long,
    val clicked: Long,
    val openRate: Double,
    val clickRate: Double
) {
    companion object {
        fun from(stats: com.liyaqa.marketing.application.services.AbTestVariantStats) = AbTestVariantResponse(
            variant = stats.variant,
            stepId = stats.stepId,
            sent = stats.sent,
            delivered = stats.delivered,
            opened = stats.opened,
            clicked = stats.clicked,
            openRate = stats.openRate,
            clickRate = stats.clickRate
        )
    }
}

data class TimelineDataPointResponse(
    val date: LocalDate,
    val sent: Long,
    val delivered: Long,
    val opened: Long,
    val clicked: Long
) {
    companion object {
        fun from(point: TimelineDataPoint) = TimelineDataPointResponse(
            date = point.date,
            sent = point.sent,
            delivered = point.delivered,
            opened = point.opened,
            clicked = point.clicked
        )
    }
}

// ==================== TEST DTOs ====================

data class TestCampaignStepRequest(
    val testEmail: String? = null,
    val testPhone: String? = null
)
