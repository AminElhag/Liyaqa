package com.liyaqa.dashboard.features.booking.data.dto

import com.liyaqa.dashboard.features.booking.domain.model.*
import kotlinx.serialization.Serializable

@Serializable
data class BookingDto(
    val id: String,
    val facilityId: String,
    val branchId: String,
    val memberId: String,
    val memberName: String,
    val resourceType: String,
    val resourceId: String,
    val resourceName: String,
    val startTime: String,
    val endTime: String,
    val duration: Int,
    val status: String,
    val price: Double,
    val paymentStatus: String,
    val notes: String? = null,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val createdAt: String,
    val updatedAt: String? = null
)

@Serializable
data class CreateBookingRequest(
    val memberId: String,
    val resourceType: String,
    val resourceId: String,
    val startTime: String,
    val endTime: String,
    val notes: String? = null
)

@Serializable
data class UpdateBookingRequest(
    val startTime: String? = null,
    val endTime: String? = null,
    val status: String? = null,
    val notes: String? = null
)

@Serializable
data class BookingPageResponse(
    val content: List<BookingDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

@Serializable
data class ResourceAvailabilityDto(
    val resourceId: String,
    val resourceName: String,
    val resourceType: String,
    val date: String,
    val availableSlots: List<TimeSlotDto>
)

@Serializable
data class TimeSlotDto(
    val startTime: String,
    val endTime: String,
    val isAvailable: Boolean,
    val price: Double? = null
)

// Mapping functions
fun BookingDto.toDomain() = Booking(
    id = id,
    facilityId = facilityId,
    branchId = branchId,
    memberId = memberId,
    memberName = memberName,
    resourceType = ResourceType.valueOf(resourceType),
    resourceId = resourceId,
    resourceName = resourceName,
    startTime = startTime,
    endTime = endTime,
    duration = duration,
    status = BookingStatus.valueOf(status),
    price = price,
    paymentStatus = PaymentStatus.valueOf(paymentStatus),
    notes = notes,
    checkInTime = checkInTime,
    checkOutTime = checkOutTime,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun ResourceAvailabilityDto.toDomain() = ResourceAvailability(
    resourceId = resourceId,
    resourceName = resourceName,
    resourceType = ResourceType.valueOf(resourceType),
    date = date,
    availableSlots = availableSlots.map { it.toDomain() }
)

fun TimeSlotDto.toDomain() = TimeSlot(
    startTime = startTime,
    endTime = endTime,
    isAvailable = isAvailable,
    price = price
)
