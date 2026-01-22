package com.liyaqa.membership.api

import com.liyaqa.membership.domain.model.MemberStatus
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.util.UUID

/**
 * DTOs for bulk member operations.
 */

/**
 * Action to perform on members in bulk.
 */
enum class BulkMemberAction {
    SUSPEND,
    ACTIVATE,
    FREEZE,
    UNFREEZE,
    CANCEL
}

/**
 * Request for bulk member status change.
 */
data class BulkMemberStatusRequest(
    @field:NotEmpty(message = "At least one member ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 members per request")
    val memberIds: List<UUID>,

    val action: BulkMemberAction,

    val reason: String? = null,

    val sendNotifications: Boolean = true
)

/**
 * Request for bulk member deletion.
 */
data class BulkMemberDeleteRequest(
    @field:NotEmpty(message = "At least one member ID is required")
    @field:Size(max = 1000, message = "Maximum 1000 members per request")
    val memberIds: List<UUID>,

    val reason: String? = null
)
