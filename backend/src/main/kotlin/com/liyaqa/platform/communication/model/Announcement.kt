package com.liyaqa.platform.communication.model

import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "announcements")
class Announcement(
    id: UUID = UUID.randomUUID(),

    @Column(name = "title", nullable = false)
    var title: String,

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    var content: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: AnnouncementType,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: AnnouncementStatus = AnnouncementStatus.DRAFT,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_audience", nullable = false)
    var targetAudience: TargetAudience = TargetAudience.ALL,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_tenant_ids", columnDefinition = "jsonb")
    var targetTenantIds: MutableList<UUID> = mutableListOf(),

    @Enumerated(EnumType.STRING)
    @Column(name = "target_plan_tier")
    var targetPlanTier: PlanTier? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "target_status")
    var targetStatus: TenantStatus? = null,

    @Column(name = "scheduled_at")
    var scheduledAt: Instant? = null,

    @Column(name = "published_at")
    var publishedAt: Instant? = null,

    @Column(name = "created_by", nullable = false)
    var createdBy: UUID,

    @Column(name = "priority", nullable = false)
    var priority: Int = 3

) : OrganizationLevelEntity(id) {

    fun publish() {
        require(status == AnnouncementStatus.DRAFT || status == AnnouncementStatus.SCHEDULED) {
            "Can only publish from DRAFT or SCHEDULED status, current: $status"
        }
        status = AnnouncementStatus.PUBLISHED
        publishedAt = Instant.now()
    }

    fun archive() {
        require(status != AnnouncementStatus.ARCHIVED) {
            "Announcement is already archived"
        }
        status = AnnouncementStatus.ARCHIVED
    }

    fun schedule(at: Instant) {
        require(status == AnnouncementStatus.DRAFT) {
            "Can only schedule from DRAFT status, current: $status"
        }
        status = AnnouncementStatus.SCHEDULED
        scheduledAt = at
    }

    companion object {
        fun create(
            title: String,
            content: String,
            type: AnnouncementType,
            targetAudience: TargetAudience = TargetAudience.ALL,
            targetTenantIds: MutableList<UUID> = mutableListOf(),
            targetPlanTier: PlanTier? = null,
            targetStatus: TenantStatus? = null,
            createdBy: UUID,
            priority: Int = 3
        ): Announcement {
            require(priority in 1..5) { "Priority must be between 1 and 5" }
            return Announcement(
                title = title,
                content = content,
                type = type,
                status = AnnouncementStatus.DRAFT,
                targetAudience = targetAudience,
                targetTenantIds = targetTenantIds,
                targetPlanTier = targetPlanTier,
                targetStatus = targetStatus,
                createdBy = createdBy,
                priority = priority
            )
        }
    }
}
