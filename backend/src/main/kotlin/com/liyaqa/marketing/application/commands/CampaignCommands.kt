package com.liyaqa.marketing.application.commands

import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.TriggerConfig
import com.liyaqa.marketing.domain.model.TriggerType
import java.time.LocalDate
import java.util.UUID

/**
 * Command to create a new marketing campaign.
 */
data class CreateCampaignCommand(
    val name: String,
    val description: String? = null,
    val campaignType: CampaignType,
    val triggerType: TriggerType,
    val triggerConfig: TriggerConfig? = null,
    val segmentId: UUID? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
)

/**
 * Command to update an existing campaign.
 */
data class UpdateCampaignCommand(
    val name: String? = null,
    val description: String? = null,
    val triggerConfig: TriggerConfig? = null,
    val segmentId: UUID? = null,
    val startDate: LocalDate? = null,
    val endDate: LocalDate? = null
)

/**
 * Command to create a campaign step.
 */
data class CreateCampaignStepCommand(
    val campaignId: UUID,
    val name: String,
    val channel: MarketingChannel,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    val bodyEn: String,
    val bodyAr: String,
    val delayDays: Int = 0,
    val delayHours: Int = 0,
    val isAbTest: Boolean = false,
    val abVariant: Char? = null,
    val abSplitPercentage: Int? = null
)

/**
 * Command to update a campaign step.
 */
data class UpdateCampaignStepCommand(
    val name: String? = null,
    val channel: MarketingChannel? = null,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    val bodyEn: String? = null,
    val bodyAr: String? = null,
    val delayDays: Int? = null,
    val delayHours: Int? = null
)

/**
 * Command to duplicate a campaign.
 */
data class DuplicateCampaignCommand(
    val sourceCampaignId: UUID,
    val newName: String
)

/**
 * Command to enroll a member in a campaign.
 */
data class EnrollMemberCommand(
    val campaignId: UUID,
    val memberId: UUID,
    val triggerReferenceId: UUID? = null,
    val triggerReferenceType: String? = null
)

/**
 * Command to test a campaign step.
 */
data class TestCampaignStepCommand(
    val stepId: UUID,
    val testEmail: String? = null,
    val testPhone: String? = null
)
