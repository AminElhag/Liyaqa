package com.liyaqa.attendance.application.commands

import com.liyaqa.attendance.domain.model.CheckInMethod
import java.util.UUID

/**
 * Command to check in a member at a location.
 */
data class CheckInCommand(
    val memberId: UUID,
    val locationId: UUID,
    val checkInMethod: CheckInMethod = CheckInMethod.MANUAL,
    val notes: String? = null,
    val createdBy: UUID? = null
)

/**
 * Command to check out a member.
 */
data class CheckOutCommand(
    val memberId: UUID,
    val notes: String? = null
)
