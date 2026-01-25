package com.liyaqa.facilities.api

import com.liyaqa.facilities.domain.model.*
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

// ========== Request DTOs ==========

data class CreateFacilityRequest(
    @field:NotNull(message = "Location ID is required")
    val locationId: UUID,

    @field:NotBlank(message = "Name (English) is required")
    val nameEn: String,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,

    @field:NotNull(message = "Facility type is required")
    val type: FacilityType,

    @field:Min(1, message = "Capacity must be at least 1")
    val capacity: Int = 1,

    @field:PositiveOrZero(message = "Hourly rate must be non-negative")
    val hourlyRate: BigDecimal? = null,
    val hourlyRateCurrency: String = "SAR",

    val requiresSubscription: Boolean = true,

    @field:Min(1, message = "Booking window must be at least 1 day")
    val bookingWindowDays: Int = 7,

    @field:Min(15, message = "Minimum booking time is 15 minutes")
    val minBookingMinutes: Int = 30,

    @field:Min(15, message = "Maximum booking time must be at least 15 minutes")
    val maxBookingMinutes: Int = 120,

    @field:Min(0, message = "Buffer minutes cannot be negative")
    val bufferMinutes: Int = 15,

    val genderRestriction: GenderRestriction? = null,
    val imageUrl: String? = null,
    val operatingHours: List<OperatingHoursRequest>? = null
)

data class UpdateFacilityRequest(
    val nameEn: String? = null,
    val nameAr: String? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null,
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
    val operatingHours: List<OperatingHoursRequest>? = null
)

data class OperatingHoursRequest(
    @field:Min(1, message = "Day of week must be 1-7")
    @field:Max(7, message = "Day of week must be 1-7")
    val dayOfWeek: Int,

    @field:NotNull(message = "Open time is required")
    val openTime: LocalTime,

    @field:NotNull(message = "Close time is required")
    val closeTime: LocalTime,

    val isClosed: Boolean = false
)

data class GenerateSlotsRequest(
    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate
)

data class CreateBookingRequest(
    @field:NotNull(message = "Slot ID is required")
    val slotId: UUID,

    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    val notes: String? = null
)

data class CancelBookingRequest(
    val reason: String? = null
)

// ========== Response DTOs ==========

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

data class FacilityResponse(
    val id: UUID,
    val locationId: UUID,
    val name: LocalizedTextResponse,
    val description: LocalizedTextResponse?,
    val type: FacilityType,
    val capacity: Int,
    val hourlyRate: BigDecimal?,
    val hourlyRateCurrency: String,
    val requiresSubscription: Boolean,
    val bookingWindowDays: Int,
    val minBookingMinutes: Int,
    val maxBookingMinutes: Int,
    val bufferMinutes: Int,
    val genderRestriction: GenderRestriction?,
    val imageUrl: String?,
    val status: FacilityStatus,
    val operatingHours: List<OperatingHoursResponse>,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(facility: Facility) = FacilityResponse(
            id = facility.id,
            locationId = facility.locationId,
            name = LocalizedTextResponse.from(facility.name),
            description = LocalizedTextResponse.fromNullable(facility.description),
            type = facility.type,
            capacity = facility.capacity,
            hourlyRate = facility.hourlyRate,
            hourlyRateCurrency = facility.hourlyRateCurrency,
            requiresSubscription = facility.requiresSubscription,
            bookingWindowDays = facility.bookingWindowDays,
            minBookingMinutes = facility.minBookingMinutes,
            maxBookingMinutes = facility.maxBookingMinutes,
            bufferMinutes = facility.bufferMinutes,
            genderRestriction = facility.genderRestriction,
            imageUrl = facility.imageUrl,
            status = facility.status,
            operatingHours = facility.operatingHours.map { OperatingHoursResponse.from(it) },
            createdAt = facility.createdAt,
            updatedAt = facility.updatedAt
        )
    }
}

data class OperatingHoursResponse(
    val dayOfWeek: Int,
    val openTime: LocalTime,
    val closeTime: LocalTime,
    val isClosed: Boolean
) {
    companion object {
        fun from(hours: FacilityOperatingHours) = OperatingHoursResponse(
            dayOfWeek = hours.dayOfWeek,
            openTime = hours.openTime,
            closeTime = hours.closeTime,
            isClosed = hours.isClosed
        )
    }
}

data class FacilitySlotResponse(
    val id: UUID,
    val facilityId: UUID,
    val slotDate: LocalDate,
    val startTime: LocalTime,
    val endTime: LocalTime,
    val status: SlotStatus
) {
    companion object {
        fun from(slot: FacilitySlot) = FacilitySlotResponse(
            id = slot.id,
            facilityId = slot.facilityId,
            slotDate = slot.slotDate,
            startTime = slot.startTime,
            endTime = slot.endTime,
            status = slot.status
        )
    }
}

data class FacilityBookingResponse(
    val id: UUID,
    val facilityId: UUID,
    val slotId: UUID,
    val memberId: UUID,
    val status: BookingStatus,
    val notes: String?,
    val bookedAt: Instant,
    val checkedInAt: Instant?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(booking: FacilityBooking) = FacilityBookingResponse(
            id = booking.id,
            facilityId = booking.facilityId,
            slotId = booking.slotId,
            memberId = booking.memberId,
            status = booking.status,
            notes = booking.notes,
            bookedAt = booking.bookedAt,
            checkedInAt = booking.checkedInAt,
            cancelledAt = booking.cancelledAt,
            cancellationReason = booking.cancellationReason,
            createdAt = booking.createdAt,
            updatedAt = booking.updatedAt
        )
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
