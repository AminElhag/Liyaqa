package com.liyaqa.scheduling.application.commands

import com.liyaqa.scheduling.domain.model.ClassPricingModel
import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.DayOfWeek
import com.liyaqa.scheduling.domain.model.DifficultyLevel
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

/**
 * Command for creating a new gym class.
 * If locationId is null, the service will auto-resolve it from the tenant's first location.
 */
data class CreateGymClassCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val locationId: UUID? = null,  // Optional - will auto-resolve from tenant if not provided
    val defaultTrainerId: UUID? = null,
    val classType: ClassType = ClassType.GROUP_FITNESS,
    val difficultyLevel: DifficultyLevel = DifficultyLevel.ALL_LEVELS,
    val durationMinutes: Int = 60,
    val maxCapacity: Int = 20,
    val waitlistEnabled: Boolean = true,
    val maxWaitlistSize: Int = 5,
    val requiresSubscription: Boolean = true,
    val deductsClassFromPlan: Boolean = true,
    val colorCode: String? = null,
    val imageUrl: String? = null,
    val sortOrder: Int = 0,
    // Pricing fields
    val pricingModel: ClassPricingModel = ClassPricingModel.INCLUDED_IN_MEMBERSHIP,
    val dropInPrice: Money? = null,
    val taxRate: BigDecimal? = BigDecimal("15.00"),
    val allowNonSubscribers: Boolean = false,
    // Booking settings
    val advanceBookingDays: Int = 7,
    val cancellationDeadlineHours: Int = 2,
    val lateCancellationFee: Money? = null
)

/**
 * Command for updating a gym class.
 */
data class UpdateGymClassCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val locationId: UUID? = null,
    val defaultTrainerId: UUID? = null,
    val classType: ClassType? = null,
    val difficultyLevel: DifficultyLevel? = null,
    val durationMinutes: Int? = null,
    val maxCapacity: Int? = null,
    val waitlistEnabled: Boolean? = null,
    val maxWaitlistSize: Int? = null,
    val requiresSubscription: Boolean? = null,
    val deductsClassFromPlan: Boolean? = null,
    val colorCode: String? = null,
    val imageUrl: String? = null,
    val sortOrder: Int? = null,
    // Pricing fields
    val pricingModel: ClassPricingModel? = null,
    val dropInPrice: Money? = null,
    val taxRate: BigDecimal? = null,
    val allowNonSubscribers: Boolean? = null,
    // Booking settings
    val advanceBookingDays: Int? = null,
    val cancellationDeadlineHours: Int? = null,
    val lateCancellationFee: Money? = null
)

/**
 * Command for creating a recurring schedule for a gym class.
 */
data class CreateClassScheduleCommand(
    val gymClassId: UUID,
    val dayOfWeek: DayOfWeek,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val trainerId: UUID? = null,
    val effectiveFrom: LocalDate = LocalDate.now(),
    val effectiveUntil: LocalDate? = null,
    val overrideCapacity: Int? = null
)

/**
 * Command for updating a class schedule.
 */
data class UpdateClassScheduleCommand(
    val dayOfWeek: DayOfWeek? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val trainerId: UUID? = null,
    val effectiveFrom: LocalDate? = null,
    val effectiveUntil: LocalDate? = null,
    val overrideCapacity: Int? = null
)

/**
 * Command for creating a single class session (ad-hoc or from schedule).
 */
data class CreateClassSessionCommand(
    val gymClassId: UUID,
    val locationId: UUID,
    val trainerId: UUID? = null,
    val sessionDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val maxCapacity: Int? = null,
    val notes: LocalizedText? = null
)

/**
 * Command for updating a class session.
 */
data class UpdateClassSessionCommand(
    val locationId: UUID? = null,
    val trainerId: UUID? = null,
    val startTime: LocalTime? = null,
    val endTime: LocalTime? = null,
    val maxCapacity: Int? = null,
    val notes: LocalizedText? = null
)

/**
 * Command for booking a member into a class session.
 */
data class CreateBookingCommand(
    val sessionId: UUID,
    val memberId: UUID,
    val subscriptionId: UUID? = null,
    val notes: String? = null,
    val bookedBy: UUID? = null
)

/**
 * Command for cancelling a booking.
 */
data class CancelBookingCommand(
    val bookingId: UUID,
    val reason: String? = null
)

/**
 * Command for cancelling a session.
 */
data class CancelSessionCommand(
    val sessionId: UUID,
    val reason: String? = null
)

/**
 * Command for generating sessions from schedules for a date range.
 */
data class GenerateSessionsCommand(
    val gymClassId: UUID? = null,
    val fromDate: LocalDate,
    val toDate: LocalDate
)
