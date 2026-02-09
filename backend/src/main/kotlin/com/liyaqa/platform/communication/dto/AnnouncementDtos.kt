package com.liyaqa.platform.communication.dto

import com.liyaqa.platform.communication.model.Announcement
import com.liyaqa.platform.communication.model.AnnouncementStatus
import com.liyaqa.platform.communication.model.AnnouncementType
import com.liyaqa.platform.communication.model.TargetAudience
import com.liyaqa.platform.subscription.model.PlanTier
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class CreateAnnouncementRequest(
    @field:NotBlank
    val title: String,
    @field:NotBlank
    val content: String,
    val type: AnnouncementType,
    val targetAudience: TargetAudience = TargetAudience.ALL,
    val targetTenantIds: List<UUID> = emptyList(),
    val targetPlanTier: PlanTier? = null,
    @field:Min(1) @field:Max(5)
    val priority: Int = 3
) {
    fun toCommand() = CreateAnnouncementCommand(
        title = title,
        content = content,
        type = type,
        targetAudience = targetAudience,
        targetTenantIds = targetTenantIds,
        targetPlanTier = targetPlanTier,
        priority = priority
    )
}

data class UpdateAnnouncementRequest(
    val title: String? = null,
    val content: String? = null,
    val type: AnnouncementType? = null,
    val targetAudience: TargetAudience? = null,
    val targetTenantIds: List<UUID>? = null,
    val targetPlanTier: PlanTier? = null,
    @field:Min(1) @field:Max(5)
    val priority: Int? = null
) {
    fun toCommand() = UpdateAnnouncementCommand(
        title = title,
        content = content,
        type = type,
        targetAudience = targetAudience,
        targetTenantIds = targetTenantIds,
        targetPlanTier = targetPlanTier,
        priority = priority
    )
}

data class ScheduleAnnouncementRequest(
    val scheduledAt: Instant
)

data class AnnouncementResponse(
    val id: UUID,
    val title: String,
    val content: String,
    val type: AnnouncementType,
    val status: AnnouncementStatus,
    val targetAudience: TargetAudience,
    val targetTenantIds: List<UUID>,
    val targetPlanTier: PlanTier?,
    val scheduledAt: Instant?,
    val publishedAt: Instant?,
    val createdBy: UUID,
    val priority: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(a: Announcement) = AnnouncementResponse(
            id = a.id,
            title = a.title,
            content = a.content,
            type = a.type,
            status = a.status,
            targetAudience = a.targetAudience,
            targetTenantIds = a.targetTenantIds.toList(),
            targetPlanTier = a.targetPlanTier,
            scheduledAt = a.scheduledAt,
            publishedAt = a.publishedAt,
            createdBy = a.createdBy,
            priority = a.priority,
            createdAt = a.createdAt,
            updatedAt = a.updatedAt
        )
    }
}
