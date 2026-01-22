package com.liyaqa.attendance.api

import com.liyaqa.attendance.domain.model.CheckInMethod
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.util.UUID

/**
 * DTOs for bulk attendance operations.
 */

/**
 * Request for bulk check-in.
 */
data class BulkCheckInRequest(
    @field:NotEmpty(message = "At least one member ID is required")
    @field:Size(max = 100, message = "Maximum 100 members per request")
    val memberIds: List<UUID>,

    val locationId: UUID,

    val checkInMethod: CheckInMethod = CheckInMethod.MANUAL,

    val notes: String? = null,

    val createdBy: UUID? = null
)

/**
 * Request for bulk check-out.
 */
data class BulkCheckOutRequest(
    @field:NotEmpty(message = "At least one member ID is required")
    @field:Size(max = 100, message = "Maximum 100 members per request")
    val memberIds: List<UUID>,

    val notes: String? = null
)
