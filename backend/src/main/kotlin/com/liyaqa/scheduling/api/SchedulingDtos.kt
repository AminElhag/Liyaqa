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
import com.liyaqa.scheduling.application.services.CreateRoomLayoutCommand
import com.liyaqa.scheduling.application.services.UpdateGxSettingsCommand
import com.liyaqa.scheduling.application.services.UpdateRoomLayoutCommand
import com.liyaqa.scheduling.domain.model.BookingPaymentSource
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassAccessPolicy
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassPricingModel
import com.liyaqa.scheduling.domain.model.ClassSchedule
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.DifficultyLevel
import com.liyaqa.scheduling.domain.model.GxSettings
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.RoomLayout
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.fasterxml.jackson.annotation.JsonAlias
import com.fasterxml.jackson.annotation.JsonProperty
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
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

    // Pricing settings
    val pricingModel: ClassPricingModel? = null,
    val dropInPriceAmount: BigDecimal? = null,
    val dropInPriceCurrency: String? = "SAR",
    val taxRate: BigDecimal? = null,
    val allowNonSubscribers: Boolean? = null,

    // Booking settings
    @field:Positive(message = "Advance booking days must be positive")
    val advanceBookingDays: Int? = null,
    @field:PositiveOrZero(message = "Cancellation deadline hours must be zero or positive")
    val cancellationDeadlineHours: Int? = null,
    val lateCancelFeeAmount: BigDecimal? = null,
    val lateCancelFeeCurrency: String? = "SAR",

    // GX access policy
    val accessPolicy: ClassAccessPolicy? = null,
    val eligiblePlanIds: List<UUID>? = null,
    val onlineBookableSpots: Int? = null,
    val noShowFeeAmount: BigDecimal? = null,
    val noShowFeeCurrency: String? = "SAR",

    // Spot booking
    val spotBookingEnabled: Boolean? = null,
    val roomLayoutId: UUID? = null,

    // Category
    val categoryId: UUID? = null,

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
            locationId = locationId,
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
            sortOrder = sortOrder ?: 0,
            pricingModel = pricingModel ?: ClassPricingModel.INCLUDED_IN_MEMBERSHIP,
            dropInPrice = dropInPriceAmount?.let { Money.of(it, dropInPriceCurrency ?: "SAR") },
            taxRate = taxRate ?: BigDecimal("15.00"),
            allowNonSubscribers = allowNonSubscribers ?: false,
            advanceBookingDays = advanceBookingDays ?: 7,
            cancellationDeadlineHours = cancellationDeadlineHours ?: 2,
            lateCancellationFee = lateCancelFeeAmount?.let { Money.of(it, lateCancelFeeCurrency ?: "SAR") },
            accessPolicy = accessPolicy ?: ClassAccessPolicy.MEMBERS_ONLY,
            eligiblePlanIds = eligiblePlanIds,
            onlineBookableSpots = onlineBookableSpots,
            noShowFee = noShowFeeAmount?.let { Money.of(it, noShowFeeCurrency ?: "SAR") },
            spotBookingEnabled = spotBookingEnabled ?: false,
            roomLayoutId = roomLayoutId,
            categoryId = categoryId
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
    val sortOrder: Int? = null,

    // Pricing settings
    val pricingModel: ClassPricingModel? = null,
    val dropInPriceAmount: BigDecimal? = null,
    val dropInPriceCurrency: String? = null,
    val taxRate: BigDecimal? = null,
    val allowNonSubscribers: Boolean? = null,

    // Booking settings
    @field:Positive(message = "Advance booking days must be positive")
    val advanceBookingDays: Int? = null,
    @field:PositiveOrZero(message = "Cancellation deadline hours must be zero or positive")
    val cancellationDeadlineHours: Int? = null,
    val lateCancelFeeAmount: BigDecimal? = null,
    val lateCancelFeeCurrency: String? = null,

    // GX access policy
    val accessPolicy: ClassAccessPolicy? = null,
    val eligiblePlanIds: List<UUID>? = null,
    val onlineBookableSpots: Int? = null,
    val noShowFeeAmount: BigDecimal? = null,
    val noShowFeeCurrency: String? = null,

    // Spot booking
    val spotBookingEnabled: Boolean? = null,
    val roomLayoutId: UUID? = null,

    // Category
    val categoryId: UUID? = null
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
            sortOrder = sortOrder,
            pricingModel = pricingModel,
            dropInPrice = dropInPriceAmount?.let { Money.of(it, dropInPriceCurrency ?: "SAR") },
            taxRate = taxRate,
            allowNonSubscribers = allowNonSubscribers,
            advanceBookingDays = advanceBookingDays,
            cancellationDeadlineHours = cancellationDeadlineHours,
            lateCancellationFee = lateCancelFeeAmount?.let { Money.of(it, lateCancelFeeCurrency ?: "SAR") },
            accessPolicy = accessPolicy,
            eligiblePlanIds = eligiblePlanIds,
            onlineBookableSpots = onlineBookableSpots,
            noShowFee = noShowFeeAmount?.let { Money.of(it, noShowFeeCurrency ?: "SAR") },
            spotBookingEnabled = spotBookingEnabled,
            roomLayoutId = roomLayoutId,
            categoryId = categoryId
        )
    }
}

data class MoneyResponse(
    val amount: BigDecimal,
    val currency: String
)

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
    // Pricing fields
    val pricingModel: ClassPricingModel,
    val dropInPrice: MoneyResponse?,
    val dropInPriceWithTax: MoneyResponse?,
    val taxRate: BigDecimal?,
    val allowNonSubscribers: Boolean,
    // Booking settings
    val advanceBookingDays: Int,
    val cancellationDeadlineHours: Int,
    val lateCancellationFee: MoneyResponse?,
    // GX access policy
    val accessPolicy: ClassAccessPolicy,
    val onlineBookableSpots: Int?,
    val noShowFee: MoneyResponse?,
    // Spot booking
    val spotBookingEnabled: Boolean,
    val roomLayoutId: UUID?,
    // Category
    val categoryId: UUID?,
    // PT fields
    val ptSessionType: com.liyaqa.scheduling.domain.model.PTSessionType?,
    val ptLocationType: com.liyaqa.scheduling.domain.model.PTLocationType?,
    val travelFee: MoneyResponse?,
    val trainerProfileId: UUID?,
    val minCapacity: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
    val schedules: List<ClassScheduleResponse> = emptyList()
) {
    companion object {
        fun from(gymClass: GymClass, schedules: List<ClassSchedule> = emptyList()) = GymClassResponse(
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
            pricingModel = gymClass.pricingModel,
            dropInPrice = gymClass.dropInPrice?.let { MoneyResponse(it.amount, it.currency) },
            dropInPriceWithTax = gymClass.getDropInPriceWithTax()?.let { MoneyResponse(it.amount, it.currency) },
            taxRate = gymClass.taxRate,
            allowNonSubscribers = gymClass.allowNonSubscribers,
            advanceBookingDays = gymClass.advanceBookingDays,
            cancellationDeadlineHours = gymClass.cancellationDeadlineHours,
            lateCancellationFee = gymClass.lateCancellationFee?.let { MoneyResponse(it.amount, it.currency) },
            accessPolicy = gymClass.accessPolicy,
            onlineBookableSpots = gymClass.onlineBookableSpots,
            noShowFee = gymClass.noShowFee?.let { MoneyResponse(it.amount, it.currency) },
            spotBookingEnabled = gymClass.spotBookingEnabled,
            roomLayoutId = gymClass.roomLayoutId,
            categoryId = gymClass.categoryId,
            // PT fields
            ptSessionType = gymClass.ptSessionType,
            ptLocationType = gymClass.ptLocationType,
            travelFee = gymClass.travelFee?.let { MoneyResponse(it.amount, it.currency) },
            trainerProfileId = gymClass.trainerProfileId,
            minCapacity = gymClass.minCapacity,
            createdAt = gymClass.createdAt,
            updatedAt = gymClass.updatedAt,
            schedules = schedules.map { ClassScheduleResponse.from(it) }
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
    @get:JsonProperty("classId")
    val gymClassId: UUID,
    val className: LocalizedTextResponse?,
    val scheduleId: UUID?,
    val locationId: UUID,
    val trainerId: UUID?,
    @get:JsonProperty("date")
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    @get:JsonProperty("capacity")
    val maxCapacity: Int,
    @get:JsonProperty("bookedCount")
    val currentBookings: Int,
    val waitlistCount: Int,
    val checkedInCount: Int,
    val availableSpots: Int,
    val status: SessionStatus,
    val notes: LocalizedTextResponse?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val durationMinutes: Int,
    // PT fields
    val ptLocationType: com.liyaqa.scheduling.domain.model.PTLocationType?,
    val clientAddress: String?,
    val travelFeeApplied: MoneyResponse?,
    val trainerNotes: String?,
    val completionNotes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(session: ClassSession, gymClass: GymClass? = null) = ClassSessionResponse(
            id = session.id,
            gymClassId = session.gymClassId,
            className = gymClass?.let { LocalizedTextResponse.from(it.name) },
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
            // PT fields
            ptLocationType = session.ptLocationType,
            clientAddress = session.clientAddress,
            travelFeeApplied = session.travelFeeApplied?.let { MoneyResponse(it.amount, it.currency) },
            trainerNotes = session.trainerNotes,
            completionNotes = session.completionNotes,
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
    val notes: String? = null,
    val spotId: String? = null,
    val spotLabel: String? = null
) {
    fun toCommand(bookedBy: UUID? = null) = CreateBookingCommand(
        sessionId = sessionId,
        memberId = memberId,
        subscriptionId = subscriptionId,
        notes = notes,
        bookedBy = bookedBy,
        spotId = spotId,
        spotLabel = spotLabel
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
    // Payment tracking
    val paymentSource: BookingPaymentSource?,
    val classPackBalanceId: UUID?,
    val orderId: UUID?,
    val paidAmount: MoneyResponse?,
    // Spot booking
    val spotId: String?,
    val spotLabel: String?,
    // PT travel fee
    val travelFeePaid: MoneyResponse?,
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
            paymentSource = booking.paymentSource,
            classPackBalanceId = booking.classPackBalanceId,
            orderId = booking.orderId,
            paidAmount = booking.paidAmount?.let { MoneyResponse(it.amount, it.currency) },
            spotId = booking.spotId,
            spotLabel = booking.spotLabel,
            travelFeePaid = booking.travelFeePaid?.let { MoneyResponse(it.amount, it.currency) },
            createdAt = booking.createdAt,
            updatedAt = booking.updatedAt
        )
    }
}

/**
 * Enriched booking list item that combines data from booking, session, class, and member.
 * Used for the paginated booking list endpoint.
 */
data class BookingListItem(
    val id: UUID,
    val sessionId: UUID,
    val sessionDate: LocalDate,
    val sessionTime: String,
    val className: LocalizedTextResponse,
    val memberId: UUID,
    val memberName: LocalizedTextResponse,
    val memberEmail: String,
    val status: BookingStatus,
    val waitlistPosition: Int?,
    val checkedInAt: Instant?,
    val cancelledAt: Instant?,
    val paymentSource: BookingPaymentSource?,
    val classPackBalanceId: UUID?,
    val orderId: UUID?,
    val paidAmount: MoneyResponse?,
    val spotId: String?,
    val spotLabel: String?,
    val tenantId: UUID,
    val createdAt: Instant,
    val updatedAt: Instant
)

// ==================== GX SETTINGS DTOS ====================

data class GxSettingsResponse(
    val id: UUID,
    val defaultBookingWindowDays: Int,
    val defaultCancellationDeadlineHours: Int,
    val defaultLateCancellationFee: MoneyResponse,
    val defaultNoShowFee: MoneyResponse,
    val walkinReserveSpots: Int,
    val autoMarkNoShows: Boolean,
    val preClassReminderMinutes: Int,
    val waitlistAutoPromote: Boolean,
    val waitlistNotificationChannel: String,
    val prayerTimeBlockingEnabled: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(settings: GxSettings) = GxSettingsResponse(
            id = settings.id,
            defaultBookingWindowDays = settings.defaultBookingWindowDays,
            defaultCancellationDeadlineHours = settings.defaultCancellationDeadlineHours,
            defaultLateCancellationFee = MoneyResponse(settings.defaultLateCancellationFee.amount, settings.defaultLateCancellationFee.currency),
            defaultNoShowFee = MoneyResponse(settings.defaultNoShowFee.amount, settings.defaultNoShowFee.currency),
            walkinReserveSpots = settings.walkinReserveSpots,
            autoMarkNoShows = settings.autoMarkNoShows,
            preClassReminderMinutes = settings.preClassReminderMinutes,
            waitlistAutoPromote = settings.waitlistAutoPromote,
            waitlistNotificationChannel = settings.waitlistNotificationChannel,
            prayerTimeBlockingEnabled = settings.prayerTimeBlockingEnabled,
            createdAt = settings.createdAt,
            updatedAt = settings.updatedAt
        )
    }
}

data class UpdateGxSettingsRequest(
    val defaultBookingWindowDays: Int? = null,
    val defaultCancellationDeadlineHours: Int? = null,
    val defaultLateCancellationFeeAmount: BigDecimal? = null,
    val defaultLateCancellationFeeCurrency: String? = null,
    val defaultNoShowFeeAmount: BigDecimal? = null,
    val defaultNoShowFeeCurrency: String? = null,
    val walkinReserveSpots: Int? = null,
    val autoMarkNoShows: Boolean? = null,
    val preClassReminderMinutes: Int? = null,
    val waitlistAutoPromote: Boolean? = null,
    val waitlistNotificationChannel: String? = null,
    val prayerTimeBlockingEnabled: Boolean? = null
) {
    fun toCommand() = UpdateGxSettingsCommand(
        defaultBookingWindowDays = defaultBookingWindowDays,
        defaultCancellationDeadlineHours = defaultCancellationDeadlineHours,
        defaultLateCancellationFee = defaultLateCancellationFeeAmount?.let { Money.of(it, defaultLateCancellationFeeCurrency ?: "SAR") },
        defaultNoShowFee = defaultNoShowFeeAmount?.let { Money.of(it, defaultNoShowFeeCurrency ?: "SAR") },
        walkinReserveSpots = walkinReserveSpots,
        autoMarkNoShows = autoMarkNoShows,
        preClassReminderMinutes = preClassReminderMinutes,
        waitlistAutoPromote = waitlistAutoPromote,
        waitlistNotificationChannel = waitlistNotificationChannel,
        prayerTimeBlockingEnabled = prayerTimeBlockingEnabled
    )
}

// ==================== ROOM LAYOUT DTOS ====================

data class RoomLayoutResponse(
    val id: UUID,
    val name: LocalizedTextResponse,
    val rows: Int,
    val columns: Int,
    val layoutJson: String,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(layout: RoomLayout) = RoomLayoutResponse(
            id = layout.id,
            name = LocalizedTextResponse.from(layout.name),
            rows = layout.rows,
            columns = layout.columns,
            layoutJson = layout.layoutJson,
            isActive = layout.isActive,
            createdAt = layout.createdAt,
            updatedAt = layout.updatedAt
        )
    }
}

data class CreateRoomLayoutRequest(
    val nameEn: String,
    val nameAr: String? = null,
    val rows: Int = 4,
    val columns: Int = 5,
    val layoutJson: String = "[]"
) {
    fun toCommand() = CreateRoomLayoutCommand(
        name = LocalizedText(en = nameEn, ar = nameAr),
        rows = rows,
        columns = columns,
        layoutJson = layoutJson
    )
}

data class UpdateRoomLayoutRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val rows: Int? = null,
    val columns: Int? = null,
    val layoutJson: String? = null
) {
    fun toCommand() = UpdateRoomLayoutCommand(
        name = if (nameEn != null) LocalizedText(en = nameEn, ar = nameAr) else null,
        rows = rows,
        columns = columns,
        layoutJson = layoutJson
    )
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

// ==================== PT CLASS DTOS ====================

data class CreatePTClassRequest(
    val name: com.liyaqa.shared.domain.LocalizedText? = null,
    val nameEn: String? = null,
    val nameAr: String? = null,
    val description: com.liyaqa.shared.domain.LocalizedText? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
    val locationId: UUID? = null,
    val trainerId: UUID,
    val ptSessionType: com.liyaqa.scheduling.domain.model.PTSessionType,
    val ptLocationType: com.liyaqa.scheduling.domain.model.PTLocationType,
    val durationMinutes: Int = 60,
    val maxCapacity: Int = 1,
    val minCapacity: Int = 1,
    val pricingModel: ClassPricingModel = ClassPricingModel.PAY_PER_ENTRY,
    val dropInPriceAmount: BigDecimal? = null,
    val dropInPriceCurrency: String = "SAR",
    val travelFeeAmount: BigDecimal? = null,
    val travelFeeCurrency: String = "SAR",
    val taxRate: BigDecimal? = BigDecimal("15.00"),
    val categoryId: UUID? = null
) {
    fun toCommand(): com.liyaqa.scheduling.application.commands.CreatePTClassCommand {
        val resolvedName = name ?: run {
            val en = nameEn ?: throw IllegalArgumentException("Class name is required")
            com.liyaqa.shared.domain.LocalizedText(en = en, ar = nameAr)
        }
        val resolvedDescription = description ?: descriptionEn?.let {
            com.liyaqa.shared.domain.LocalizedText(en = it, ar = descriptionAr)
        }
        return com.liyaqa.scheduling.application.commands.CreatePTClassCommand(
            name = resolvedName,
            description = resolvedDescription,
            locationId = locationId,
            trainerId = trainerId,
            ptSessionType = ptSessionType,
            ptLocationType = ptLocationType,
            durationMinutes = durationMinutes,
            maxCapacity = maxCapacity,
            minCapacity = minCapacity,
            pricingModel = pricingModel,
            dropInPrice = dropInPriceAmount?.let { com.liyaqa.shared.domain.Money.of(it, dropInPriceCurrency) },
            travelFee = travelFeeAmount?.let { com.liyaqa.shared.domain.Money.of(it, travelFeeCurrency) },
            taxRate = taxRate,
            categoryId = categoryId
        )
    }
}

data class SchedulePTSessionRequest(
    val gymClassId: UUID,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val clientAddress: String? = null,
    val notesEn: String? = null,
    val notesAr: String? = null,
    val skipAvailabilityCheck: Boolean = false
) {
    fun toCommand() = com.liyaqa.scheduling.application.commands.SchedulePTSessionCommand(
        gymClassId = gymClassId,
        sessionDate = sessionDate,
        startTime = startTime,
        endTime = endTime,
        clientAddress = clientAddress,
        notes = if (notesEn != null) com.liyaqa.shared.domain.LocalizedText(en = notesEn, ar = notesAr) else null,
        skipAvailabilityCheck = skipAvailabilityCheck
    )
}

data class CompletePTSessionRequest(
    val completionNotes: String? = null,
    val trainerNotes: String? = null
) {
    fun toCommand(sessionId: UUID) = com.liyaqa.scheduling.application.commands.CompletePTSessionCommand(
        sessionId = sessionId,
        completionNotes = completionNotes,
        trainerNotes = trainerNotes
    )
}

data class PTDashboardStatsResponse(
    val totalPTClasses: Long,
    val activePTClasses: Long,
    val totalPTSessions: Long,
    val completedPTSessions: Long,
    val cancelledPTSessions: Long,
    val upcomingPTSessions: Long
)

// ==================== TRAINER AVAILABILITY DTOS ====================

data class TrainerAvailabilitySlotRequest(
    val dayOfWeek: com.liyaqa.scheduling.domain.model.DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val locationType: com.liyaqa.scheduling.domain.model.PTLocationType = com.liyaqa.scheduling.domain.model.PTLocationType.CLUB,
    val locationId: UUID? = null,
    val isRecurring: Boolean = true,
    val effectiveFrom: LocalDate = LocalDate.now(),
    val effectiveUntil: LocalDate? = null
)

data class SetTrainerAvailabilityRequest(
    val slots: List<TrainerAvailabilitySlotRequest>
)

data class BlockSlotRequest(
    val dayOfWeek: com.liyaqa.scheduling.domain.model.DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val effectiveFrom: LocalDate,
    val effectiveUntil: LocalDate? = null
)

data class TrainerAvailabilitySlotResponse(
    val id: UUID,
    val trainerId: UUID,
    val dayOfWeek: com.liyaqa.scheduling.domain.model.DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val locationType: com.liyaqa.scheduling.domain.model.PTLocationType,
    val locationId: UUID?,
    val isRecurring: Boolean,
    val effectiveFrom: LocalDate,
    val effectiveUntil: LocalDate?,
    val status: com.liyaqa.scheduling.domain.model.TrainerAvailabilityStatus,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(slot: com.liyaqa.trainer.domain.model.TrainerAvailability) = TrainerAvailabilitySlotResponse(
            id = slot.id,
            trainerId = slot.trainerId,
            dayOfWeek = slot.dayOfWeek,
            startTime = slot.startTime,
            endTime = slot.endTime,
            locationType = slot.locationType,
            locationId = slot.locationId,
            isRecurring = slot.isRecurring,
            effectiveFrom = slot.effectiveFrom,
            effectiveUntil = slot.effectiveUntil,
            status = slot.status,
            createdAt = slot.createdAt,
            updatedAt = slot.updatedAt
        )
    }
}
