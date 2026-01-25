package com.liyaqa.marketing.application.commands

import com.liyaqa.marketing.domain.model.SegmentCriteria
import com.liyaqa.marketing.domain.model.SegmentType
import java.util.UUID

/**
 * Command to create a new segment.
 */
data class CreateSegmentCommand(
    val name: String,
    val description: String? = null,
    val segmentType: SegmentType,
    val criteria: SegmentCriteria? = null
)

/**
 * Command to update a segment.
 */
data class UpdateSegmentCommand(
    val name: String? = null,
    val description: String? = null,
    val criteria: SegmentCriteria? = null
)

/**
 * Command to add members to a static segment.
 */
data class AddSegmentMembersCommand(
    val segmentId: UUID,
    val memberIds: List<UUID>
)

/**
 * Command to remove a member from a static segment.
 */
data class RemoveSegmentMemberCommand(
    val segmentId: UUID,
    val memberId: UUID
)
