package com.liyaqa.scheduling.api

import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.Size
import java.util.UUID

/**
 * DTOs for bulk booking operations.
 */

/**
 * Request for bulk booking creation.
 */
data class BulkCreateBookingsRequest(
    val sessionId: UUID,

    @field:NotEmpty(message = "At least one member ID is required")
    @field:Size(max = 100, message = "Maximum 100 members per request")
    val memberIds: List<UUID>,

    val notes: String? = null,

    val bookedBy: UUID? = null
)

/**
 * Request for bulk booking cancellation.
 */
data class BulkCancelBookingsRequest(
    @field:NotEmpty(message = "At least one booking ID is required")
    @field:Size(max = 100, message = "Maximum 100 bookings per request")
    val bookingIds: List<UUID>,

    val reason: String? = null
)

/**
 * Request for bulk booking check-in.
 */
data class BulkCheckInBookingsRequest(
    @field:NotEmpty(message = "At least one booking ID is required")
    @field:Size(max = 100, message = "Maximum 100 bookings per request")
    val bookingIds: List<UUID>
)
