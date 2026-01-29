package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.ActivityType
import com.liyaqa.membership.domain.model.MemberActivity
import java.time.Instant
import java.util.UUID

data class MemberActivityResponse(
    val id: UUID,
    val memberId: UUID,
    val activityType: ActivityType,
    val title: String,
    val description: String?,
    val metadata: Map<String, Any>?,
    val performedByUserId: UUID?,
    val performedByName: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(activity: MemberActivity): MemberActivityResponse = MemberActivityResponse(
            id = activity.id,
            memberId = activity.memberId,
            activityType = activity.activityType,
            title = activity.title,
            description = activity.description,
            metadata = activity.metadata,
            performedByUserId = activity.performedByUserId,
            performedByName = activity.performedByName,
            createdAt = activity.createdAt
        )
    }
}

data class ActivityTimelineResponse(
    val activities: List<MemberActivityResponse>,
    val totalElements: Long,
    val totalPages: Int,
    val page: Int,
    val size: Int,
    val hasMore: Boolean
)

data class ActivitySummaryResponse(
    val totalActivities: Long,
    val recentActivities: List<MemberActivityResponse>,
    val activityCounts: Map<ActivityType, Long>,
    val lastActivity: MemberActivityResponse?
)

data class CreateActivityRequest(
    val activityType: ActivityType,
    val title: String,
    val description: String? = null,
    val metadata: Map<String, Any>? = null
)

data class ActivityTypeCount(
    val type: ActivityType,
    val count: Long
)
