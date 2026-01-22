package com.liyaqa.scheduling.api

import com.liyaqa.scheduling.application.commands.CancelBookingCommand
import com.liyaqa.scheduling.application.commands.CreateBookingCommand
import com.liyaqa.scheduling.application.commands.CreateClassScheduleCommand
import com.liyaqa.scheduling.application.commands.CreateClassSessionCommand
import com.liyaqa.scheduling.application.commands.CreateGymClassCommand
import com.liyaqa.scheduling.application.commands.GenerateSessionsCommand
import com.liyaqa.scheduling.application.commands.UpdateClassScheduleCommand
import com.liyaqa.scheduling.application.commands.UpdateClassSessionCommand
import com.liyaqa.scheduling.application.commands.UpdateGymClassCommand
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSchedule
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.DifficultyLevel
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.fasterxml.jackson.annotation.JsonAlias
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

// ==================== COMMON RESPONSE DTOS ====================

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

// ==================== GYM CLASS DTOS ====================

/**
 * Request to create a new gym class.
 * Accepts both frontend format (LocalizedText objects) and flat string format for backwards compatibility.
 */
data class CreateGymClassRequest(
    // Accept LocalizedText object format: { "en": "...", "ar": "..." }
    val name: LocalizedText? = null,

    // Also accept flat string format for backwards compatibility
    val nameEn: String? = null,
    val nameAr: String? = null,

    // Accept LocalizedText object format for description
    val description: LocalizedText? = null,

    // Also accept flat string format for backwards compatibility
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,

    // Made optional - will auto-resolve from tenant if not provided
    val locationId: UUID? = null,

    @JsonAlias("trainerId")
    val defaultTrainerId: UUID? = null,

    val classType: ClassType? = null,
    val difficultyLevel: DifficultyLevel? = null,

    @field:Positive(message = "Duration must be positive")
    val durationMinutes: Int? = null,

    // Accept both "capacity" and "maxCapacity"
    @JsonAlias("capacity")
    @field:Positive(message = "Capacity must be positive")
    val maxCapacity: Int? = null,

    val waitlistEnabled: Boolean? = null,

    @field:PositiveOrZero(message = "Waitlist size must be zero or positive")
    val maxWaitlistSize: Int? = null,

    val requiresSubscription: Boolean? = null,
    val deductsClassFromPlan: Boolean? = null,
    val colorCode: String? = null,
    val imageUrl: String? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null,

    // Accept schedules array - will be created after class
    val schedules: List<ScheduleInput>? = null
) {
    fun toCommand(): CreateGymClassCommand {
        // Resolve name: prefer LocalizedText object, fallback to flat strings
        val resolvedName = name ?: run {
            val en = nameEn
            if (en.isNullOrBlank()) {
                throw IllegalArgumentException("Class name is required. Provide either 'name' object or 'nameEn' string.")
            }
            LocalizedText(en = en, ar = nameAr)
        }

        // Resolve description: prefer LocalizedText object, fallback to flat strings
        val resolvedDescription = description ?: if (!descriptionEn.isNullOrBlank()) {
            LocalizedText(en = descriptionEn, ar = descriptionAr)
        } else null

        return CreateGymClassCommand(
            name = resolvedName,
            description = resolvedDescription,
            locationId = locationId,  // May be null, service will resolve from tenant
            defaultTrainerId = defaultTrainerId,
            classType = classType ?: ClassType.GROUP_FITNESS,
            difficultyLevel = difficultyLevel ?: DifficultyLevel.ALL_LEVELS,
            durationMinutes = durationMinutes ?: 60,
            maxCapacity = maxCapacity ?: 20,
            waitlistEnabled = waitlistEnabled ?: true,
            maxWaitlistSize = maxWaitlistSize ?: 5,
            requiresSubscription = requiresSubscription ?: true,
            deductsClassFromPlan = deductsClassFromPlan ?: true,
            colorCode = colorCode,
            imageUrl = imageUrl,
            sortOrder = sortOrder ?: 0
        )
    }
}

/**
 * Schedule input for creating schedules inline with class creation.
 */
data class ScheduleInput(
    val dayOfWeek: DayOfWeek,
    val startTime: String,
    val endTime: String
)

data class UpdateGymClassRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    val locationId: UUID? = null,
    val defaultTrainerId: UUID? = null,
    val classType: ClassType? = null,
    val difficultyLevel: DifficultyLevel? = null,

    @field:Positive(message = "Duration must be positive")
    val durationMinutes: Int? = null,

    @field:Positive(message = "Capacity must be positive")
    val maxCapacity: Int? = null,

    val waitlistEnabled: Boolean? = null,

    @field:PositiveOrZero(message = "Waitlist size must be zero or positive")
    val maxWaitlistSize: Int? = null,

    val requiresSubscription: Boolean? = null,
    val deductsClassFromPlan: Boolean? = null,
    val colorCode: String? = null,
    val imageUrl: String? = null,

    @field:PositiveOrZero(message = "Sort order must be zero or positive")
    val sortOrder: Int? = null
) {
    fun toCommand(): UpdateGymClassCommand {
        val name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null
        val description = if (descriptionEn != null) LocalizedText(en = descriptionEn, ar = descriptionAr) else null

        return UpdateGymClassCommand(
            name = name,
            description = description,
            locationId = locationId,
            defaultTrainerId = defaultTrainerId,
            classType = classType,
            difficultyLevel = difficultyLevel,
            durationMinutes = durationMinutes,
            maxCapacity = maxCapacity,
            waitlistEnabled = waitlistEnabled,
            maxWaitlistSize = maxWaitlistSize,
            requiresSubscription = requiresSubscription,
            deductsClassFromPlan = deductsClassFromPlan,
            colorCode = colorCode,
            imageUrl = imageUrl,
            sortOrder = sortOrder
        )
    }
}

data class GymClassResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val locationId: UUID,
    val defaultTrainerId: UUID?,
    val classType: ClassType,
    val difficultyLevel: DifficultyLevel,
    val durationMinutes: Int,
    val maxCapacity: Int,
    val waitlistEnabled: Boolean,
    val maxWaitlistSize: Int,
    val requiresSubscription: Boolean,
    val deductsClassFromPlan: Boolean,
    val colorCode: String?,
    val imageUrl: String?,
    val status: GymClassStatus,
    val sortOrder: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(gymClass: GymClass) = GymClassResponse(
            id = gymClass.id,
            name = LocalizedTextResponse.from(gymClass.name),
            description = LocalizedTextResponse.fromNullable(gymClass.description),
            locationId = gymClass.locationId,
            defaultTrainerId = gymClass.defaultTrainerId,
            classType = gymClass.classType,
            difficultyLevel = gymClass.difficultyLevel,
            durationMinutes = gymClass.durationMinutes,
            maxCapacity = gymClass.maxCapacity,
            waitlistEnabled = gymClass.waitlistEnabled,
            maxWaitlistSize = gymClass.maxWaitlistSize,
            requiresSubscription = gymClass.requiresSubscription,
            deductsClassFromPlan = gymClass.deductsClassFromPlan,
            colorCode = gymClass.colorCode,
            imageUrl = gymClass.imageUrl,
            status = gymClass.status,
            sortOrder = gymClass.sortOrder,
            createdAt = gymClass.createdAt,
            updatedAt = gymClass.updatedAt
        )
    }
}

// ==================== CLASS SCHEDULE DTOS ====================

data class CreateClassScheduleRequest(
    // gymClassId is optional in the request body since it's provided via URL path parameter.
    // The controller will set it via copy() before calling toCommand().
    val gymClassId: UUID? = null,

    @field:NotNull(message = "Day of week is required")
    val dayOfWeek: DayOfWeek,

    @field:NotNull(message = "Start time is required")
    val startTime: LocalTime,

    @field:NotNull(message = "End time is required")
    val endTime: LocalTime,

    val trainerId: UUID? = null,
    // effectiveFrom must be nullable because Jackson 3.0 doesn't handle Kotlin default parameters.
    // When not provided in JSON, Jackson passes null. Default is applied in toCommand().
    val effectiveFrom: LocalDate? = null,
    val effectiveUntil: LocalDate? = null,

    @field:Positive(message = "Override capacity must be positive")
    val overrideCapacity: Int? = null
) {
    fun toCommand() = CreateClassScheduleCommand(
        gymClassId = gymClassId ?: throw IllegalStateException("gymClassId must be set before calling toCommand()"),
        dayOfWeek = dayOfWeek,
        startTime = startTime,
        endTime = endTime,
        trainerId = trainerId,
        effectiveFrom = effectiveFrom ?: LocalDate.now(),
        effectiveUntil = effectiveUntil,
        overrideCapacity = overrideCapacity
    )
}

data class UpdateClassScheduleRequest(
    val dayOfWeek: DayOfWeek? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val trainerId: UUID? = null,
    val effectiveFrom: LocalDate? = null,
    val effectiveUntil: LocalDate? = null,

    @field:Positive(message = "Override capacity must be positive")
    val overrideCapacity: Int? = null
) {
    fun toCommand() = UpdateClassScheduleCommand(
        dayOfWeek = dayOfWeek,
        startTime = startTime,
        endTime = endTime,
        trainerId = trainerId,
        effectiveFrom = effectiveFrom,
        effectiveUntil = effectiveUntil,
        overrideCapacity = overrideCapacity
    )
}

data class ClassScheduleResponse(
    val id: UUID,
    val gymClassId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val trainerId: UUID?,
    val effectiveFrom: LocalDate,
    val effectiveUntil: LocalDate?,
    val overrideCapacity: Int?,
    val isActive: Boolean,
    val durationMinutes: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(schedule: ClassSchedule) = ClassScheduleResponse(
            id = schedule.id,
            gymClassId = schedule.gymClassId,
            dayOfWeek = schedule.dayOfWeek,
            startTime = schedule.startTime,
            endTime = schedule.endTime,
            trainerId = schedule.trainerId,
            effectiveFrom = schedule.effectiveFrom,
            effectiveUntil = schedule.effectiveUntil,
            overrideCapacity = schedule.overrideCapacity,
            isActive = schedule.isActive,
            durationMinutes = schedule.durationMinutes(),
            createdAt = schedule.createdAt,
            updatedAt = schedule.updatedAt
        )
    }
}

// ==================== CLASS SESSION DTOS ====================

data class CreateClassSessionRequest(
    @field:NotNull(message = "Gym class ID is required")
    val gymClassId: UUID,

    @field:NotNull(message = "Location ID is required")
    val locationId: UUID,

    val trainerId: UUID? = null,

    @field:NotNull(message = "Session date is required")
    val sessionDate: LocalDate,

    @field:NotNull(message = "Start time is required")
    val startTime: LocalTime,

    @field:NotNull(message = "End time is required")
    val endTime: LocalTime,

    @field:Positive(message = "Capacity must be positive")
    val maxCapacity: Int? = null,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = CreateClassSessionCommand(
        gymClassId = gymClassId,
        locationId = locationId,
        trainerId = trainerId,
        sessionDate = sessionDate,
        startTime = startTime,
        endTime = endTime,
        maxCapacity = maxCapacity,
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null
    )
}

data class UpdateClassSessionRequest(
    val locationId: UUID? = null,
    val trainerId: UUID? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,

    @field:Positive(message = "Capacity must be positive")
    val maxCapacity: Int? = null,

    val notesEn: String? = null,
    val notesAr: String? = null
) {
    fun toCommand() = UpdateClassSessionCommand(
        locationId = locationId,
        trainerId = trainerId,
        startTime = startTime,
        endTime = endTime,
        maxCapacity = maxCapacity,
        notes = if (notesEn != null) LocalizedText(en = notesEn, ar = notesAr) else null
    )
}

data class ClassSessionResponse(
    val id: UUID,
    val gymClassId: UUID,
    val scheduleId: UUID?,
    val locationId: UUID,
    val trainerId: UUID?,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val maxCapacity: Int,
    val currentBookings: Int,
    val waitlistCount: Int,
    val checkedInCount: Int,
    val availableSpots: Int,
    val status: SessionStatus,
    val notes: LocalizedTextResponse?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val durationMinutes: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(session: ClassSession) = ClassSessionResponse(
            id = session.id,
            gymClassId = session.gymClassId,
            scheduleId = session.scheduleId,
            locationId = session.locationId,
            trainerId = session.trainerId,
            sessionDate = session.sessionDate,
            startTime = session.startTime,
            endTime = session.endTime,
            maxCapacity = session.maxCapacity,
            currentBookings = session.currentBookings,
            waitlistCount = session.waitlistCount,
            checkedInCount = session.checkedInCount,
            availableSpots = session.availableSpots(),
            status = session.status,
            notes = LocalizedTextResponse.fromNullable(session.notes),
            cancelledAt = session.cancelledAt,
            cancellationReason = session.cancellationReason,
            durationMinutes = session.durationMinutes(),
            createdAt = session.createdAt,
            updatedAt = session.updatedAt
        )
    }
}

data class GenerateSessionsRequest(
    val gymClassId: UUID? = null,

    @field:NotNull(message = "From date is required")
    val fromDate: LocalDate,

    @field:NotNull(message = "To date is required")
    val toDate: LocalDate
) {
    fun toCommand() = GenerateSessionsCommand(
        gymClassId = gymClassId,
        fromDate = fromDate,
        toDate = toDate
    )
}

data class CancelSessionRequest(
    val reason: String? = null
)

// ==================== BOOKING DTOS ====================

data class CreateBookingRequest(
    @field:NotNull(message = "Session ID is required")
    val sessionId: UUID,

    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    val subscriptionId: UUID? = null,
    val notes: String? = null
) {
    fun toCommand(bookedBy: UUID? = null) = CreateBookingCommand(
        sessionId = sessionId,
        memberId = memberId,
        subscriptionId = subscriptionId,
        notes = notes,
        bookedBy = bookedBy
    )
}

data class CancelBookingRequest(
    val reason: String? = null
) {
    fun toCommand(bookingId: UUID) = CancelBookingCommand(
        bookingId = bookingId,
        reason = reason
    )
}

data class ClassBookingResponse(
    val id: UUID,
    val sessionId: UUID,
    val memberId: UUID,
    val subscriptionId: UUID?,
    val status: BookingStatus,
    val bookedAt: Instant,
    val checkedInAt: Instant?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val waitlistPosition: Int?,
    val promotedFromWaitlistAt: Instant?,
    val classDeducted: Boolean,
    val notes: String?,
    val bookedBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(booking: ClassBooking) = ClassBookingResponse(
            id = booking.id,
            sessionId = booking.sessionId,
            memberId = booking.memberId,
            subscriptionId = booking.subscriptionId,
            status = booking.status,
            bookedAt = booking.bookedAt,
            checkedInAt = booking.checkedInAt,
            cancelledAt = booking.cancelledAt,
            cancellationReason = booking.cancellationReason,
            waitlistPosition = booking.waitlistPosition,
            promotedFromWaitlistAt = booking.promotedFromWaitlistAt,
            classDeducted = booking.classDeducted,
            notes = booking.notes,
            bookedBy = booking.bookedBy,
            createdAt = booking.createdAt,
            updatedAt = booking.updatedAt
        )
    }
}

// ==================== PAGE RESPONSE ====================

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
