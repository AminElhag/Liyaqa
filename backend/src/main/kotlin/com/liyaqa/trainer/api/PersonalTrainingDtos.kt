package com.liyaqa.trainer.api

import com.liyaqa.trainer.application.services.AvailableSlot
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import jakarta.validation.constraints.Future
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

// ==================== REQUEST DTOs ====================

/**
 * Request to book a personal training session.
 */
data class BookPTSessionRequest(
    @field:NotNull(message = "Trainer ID is required")
    val trainerId: UUID,

    @field:NotNull(message = "Session date is required")
    @field:Future(message = "Session date must be in the future")
    val sessionDate: LocalDate,

    @field:NotNull(message = "Start time is required")
    @field:Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Start time must be in HH:mm format")
    val startTime: String,

    @field:Min(15, message = "Duration must be at least 15 minutes")
    @field:Max(180, message = "Duration cannot exceed 180 minutes")
    val durationMinutes: Int = 60,

    val locationId: UUID? = null,

    val notes: String? = null
)

/**
 * Request to reschedule a PT session.
 */
data class ReschedulePTSessionRequest(
    @field:NotNull(message = "New date is required")
    @field:Future(message = "New date must be in the future")
    val newDate: LocalDate,

    @field:NotNull(message = "New start time is required")
    @field:Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Start time must be in HH:mm format")
    val newStartTime: String,

    @field:Min(15, message = "Duration must be at least 15 minutes")
    @field:Max(180, message = "Duration cannot exceed 180 minutes")
    val newDurationMinutes: Int? = null
)

/**
 * Request to cancel a PT session.
 */
data class CancelPTSessionRequest(
    val reason: String? = null
)

/**
 * Request to update session notes.
 */
data class UpdatePTSessionNotesRequest(
    val notes: String? = null
)

/**
 * Request to update session price.
 */
data class UpdatePTSessionPriceRequest(
    @field:PositiveOrZero(message = "Price must be non-negative")
    val price: BigDecimal? = null
)

/**
 * Request to complete a session with trainer notes.
 */
data class CompletePTSessionRequest(
    val trainerNotes: String? = null
)

// ==================== RESPONSE DTOs ====================

/**
 * Full PT session response.
 */
data class PTSessionResponse(
    val id: UUID,
    val trainerId: UUID,
    val trainerName: String?,
    val memberId: UUID,
    val memberName: String?,
    val memberEmail: String?,
    val locationId: UUID?,
    val locationName: String?,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val durationMinutes: Int,
    val status: PTSessionStatus,
    val price: BigDecimal?,
    val notes: String?,
    val cancelledBy: UUID?,
    val cancellationReason: String?,
    val trainerNotes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            session: PersonalTrainingSession,
            trainerName: String? = null,
            memberName: String? = null,
            memberEmail: String? = null,
            locationName: String? = null
        ): PTSessionResponse = PTSessionResponse(
            id = session.id,
            trainerId = session.trainerId,
            trainerName = trainerName,
            memberId = session.memberId,
            memberName = memberName,
            memberEmail = memberEmail,
            locationId = session.locationId,
            locationName = locationName,
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            durationMinutes = session.durationMinutes,
            status = session.status,
            price = session.price,
            notes = session.notes,
            cancelledBy = session.cancelledBy,
            cancellationReason = session.cancellationReason,
            trainerNotes = session.trainerNotes,
            createdAt = session.createdAt,
            updatedAt = session.updatedAt
        )
    }
}

/**
 * Summary PT session response for lists.
 */
data class PTSessionSummaryResponse(
    val id: UUID,
    val trainerId: UUID,
    val trainerName: String?,
    val memberId: UUID,
    val memberName: String?,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val status: PTSessionStatus
) {
    companion object {
        fun from(
            session: PersonalTrainingSession,
            trainerName: String? = null,
            memberName: String? = null
        ): PTSessionSummaryResponse = PTSessionSummaryResponse(
            id = session.id,
            trainerId = session.trainerId,
            trainerName = trainerName,
            memberId = session.memberId,
            memberName = memberName,
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            status = session.status
        )
    }
}

/**
 * Available time slot response.
 */
data class AvailableSlotResponse(
    val date: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val isBooked: Boolean
) {
    companion object {
        fun from(slot: AvailableSlot): AvailableSlotResponse = AvailableSlotResponse(
            date = slot.date,
            startTime = slot.startTime,
            endTime = slot.endTime,
            isBooked = slot.isBooked
        )
    }
}
