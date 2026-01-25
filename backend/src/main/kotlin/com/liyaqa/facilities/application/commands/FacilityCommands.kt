package com.liyaqa.facilities.application.commands

import com.liyaqa.facilities.domain.model.FacilityType
import com.liyaqa.facilities.domain.model.GenderRestriction
import com.liyaqa.shared.domain.LocalizedText
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

data class CreateFacilityCommand(
    val locationId: UUID,
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val type: FacilityType,
    val capacity: Int = 1,
    val hourlyRate: BigDecimal? = null,
    val hourlyRateCurrency: String = "SAR",
    val requiresSubscription: Boolean = true,
    val bookingWindowDays: Int = 7,
    val minBookingMinutes: Int = 30,
    val maxBookingMinutes: Int = 120,
    val bufferMinutes: Int = 15,
    val genderRestriction: GenderRestriction? = null,
    val imageUrl: String? = null,
    val operatingHours: List<OperatingHoursInput>? = null
)

data class UpdateFacilityCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val type: FacilityType? = null,
    val capacity: Int? = null,
    val hourlyRate: BigDecimal? = null,
    val hourlyRateCurrency: String? = null,
    val requiresSubscription: Boolean? = null,
    val bookingWindowDays: Int? = null,
    val minBookingMinutes: Int? = null,
    val maxBookingMinutes: Int? = null,
    val bufferMinutes: Int? = null,
    val genderRestriction: GenderRestriction? = null,
    val imageUrl: String? = null,
    val operatingHours: List<OperatingHoursInput>? = null
)

data class OperatingHoursInput(
    val dayOfWeek: Int, // 1-7 (Monday-Sunday)
    val openTime: LocalTime,
    val closeTime: LocalTime,
    val isClosed: Boolean = false
)

data class CreateBookingCommand(
    val facilityId: UUID,
    val slotId: UUID,
    val memberId: UUID,
    val notes: String? = null
)

data class GenerateSlotsCommand(
    val facilityId: UUID,
    val startDate: LocalDate,
    val endDate: LocalDate
)
