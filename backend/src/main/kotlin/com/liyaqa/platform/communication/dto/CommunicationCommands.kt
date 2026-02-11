package com.liyaqa.platform.communication.dto

import com.liyaqa.platform.communication.model.AnnouncementType
import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.TargetAudience
import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.tenant.model.TenantStatus
import java.time.Instant
import java.util.UUID

data class CreateAnnouncementCommand(
    val title: String,
    val content: String,
    val type: AnnouncementType,
    val targetAudience: TargetAudience = TargetAudience.ALL,
    val targetTenantIds: List<UUID> = emptyList(),
    val targetPlanTier: PlanTier? = null,
    val targetStatus: TenantStatus? = null,
    val priority: Int = 3
)

data class UpdateAnnouncementCommand(
    val title: String? = null,
    val content: String? = null,
    val type: AnnouncementType? = null,
    val targetAudience: TargetAudience? = null,
    val targetTenantIds: List<UUID>? = null,
    val targetPlanTier: PlanTier? = null,
    val targetStatus: TenantStatus? = null,
    val priority: Int? = null
)

data class ScheduleAnnouncementCommand(
    val scheduledAt: Instant
)

data class CreateTemplateCommand(
    val code: String,
    val nameEn: String,
    val nameAr: String? = null,
    val subjectEn: String,
    val subjectAr: String? = null,
    val bodyEn: String,
    val bodyAr: String? = null,
    val channel: CommunicationChannel = CommunicationChannel.EMAIL,
    val variables: List<String> = emptyList()
)

data class UpdateTemplateCommand(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val subjectEn: String? = null,
    val subjectAr: String? = null,
    val bodyEn: String? = null,
    val bodyAr: String? = null,
    val channel: CommunicationChannel? = null,
    val variables: List<String>? = null,
    val isActive: Boolean? = null
)

data class SendNotificationCommand(
    val templateCode: String,
    val tenantIds: List<UUID> = emptyList(),
    val planTier: PlanTier? = null,
    val channel: CommunicationChannel = CommunicationChannel.EMAIL,
    val variables: Map<String, String> = emptyMap()
)
