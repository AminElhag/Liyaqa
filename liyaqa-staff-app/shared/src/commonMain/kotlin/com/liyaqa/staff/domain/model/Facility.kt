package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class FacilityBooking(
    val id: String,
    val facilityId: String,
    val facilityName: LocalizedText,
    val facilityType: String,
    val memberId: String,
    val memberName: String,
    val memberNumber: String,
    val memberPhone: String?,
    val slotDate: String,
    val startTime: String,
    val endTime: String,
    val status: BookingStatus,
    val checkedInAt: String? = null
) {
    val isCheckedIn: Boolean get() = status == BookingStatus.ATTENDED
}

@Serializable
data class TodayFacilityBookings(
    val bookings: List<FacilityBooking>,
    val totalBookings: Int,
    val totalAttended: Int
)
