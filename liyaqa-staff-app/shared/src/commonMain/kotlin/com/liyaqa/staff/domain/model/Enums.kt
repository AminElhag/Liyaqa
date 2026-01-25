package com.liyaqa.staff.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class StaffRole {
    @SerialName("ADMIN") ADMIN,
    @SerialName("MANAGER") MANAGER,
    @SerialName("TRAINER") TRAINER,
    @SerialName("RECEPTIONIST") RECEPTIONIST,
    @SerialName("SALES") SALES
}

@Serializable
enum class MembershipStatus {
    @SerialName("ACTIVE") ACTIVE,
    @SerialName("EXPIRED") EXPIRED,
    @SerialName("FROZEN") FROZEN,
    @SerialName("CANCELLED") CANCELLED
}

@Serializable
enum class BookingStatus {
    @SerialName("CONFIRMED") CONFIRMED,
    @SerialName("CANCELLED") CANCELLED,
    @SerialName("ATTENDED") ATTENDED,
    @SerialName("NO_SHOW") NO_SHOW
}

@Serializable
enum class Gender {
    @SerialName("MALE") MALE,
    @SerialName("FEMALE") FEMALE
}

@Serializable
enum class CheckInSource {
    @SerialName("QR_SCAN") QR_SCAN,
    @SerialName("MANUAL") MANUAL,
    @SerialName("KIOSK") KIOSK
}
