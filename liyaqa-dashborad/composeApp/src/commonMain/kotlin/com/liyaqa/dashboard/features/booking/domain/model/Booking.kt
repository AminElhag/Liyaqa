package com.liyaqa.dashboard.features.booking.domain.model

/**
 * Court/equipment/room booking domain model
 */
data class Booking(
    val id: String,
    val facilityId: String,
    val branchId: String,
    val memberId: String,
    val memberName: String,
    val resourceType: ResourceType,
    val resourceId: String,
    val resourceName: String,
    val startTime: String,
    val endTime: String,
    val duration: Int, // minutes
    val status: BookingStatus,
    val price: Double,
    val paymentStatus: PaymentStatus,
    val notes: String?,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val createdAt: String,
    val updatedAt: String? = null
) {
    fun isCheckedIn(): Boolean = checkInTime != null
    fun isCompleted(): Boolean = status == BookingStatus.COMPLETED
    fun isCancelled(): Boolean = status == BookingStatus.CANCELLED
    fun canCheckIn(): Boolean = status == BookingStatus.CONFIRMED && checkInTime == null
    fun canCheckOut(): Boolean = status == BookingStatus.IN_PROGRESS && checkOutTime == null
}

enum class BookingStatus {
    PENDING,
    CONFIRMED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}

enum class ResourceType {
    COURT,
    EQUIPMENT,
    ROOM,
    OTHER
}

enum class PaymentStatus {
    PAID,
    PENDING,
    FAILED,
    REFUNDED
}

/**
 * Resource availability information
 */
data class ResourceAvailability(
    val resourceId: String,
    val resourceName: String,
    val resourceType: ResourceType,
    val date: String,
    val availableSlots: List<TimeSlot>
)

data class TimeSlot(
    val startTime: String,
    val endTime: String,
    val isAvailable: Boolean,
    val price: Double? = null
)
