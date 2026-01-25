package com.liyaqa.facilities.domain.model

enum class FacilityType {
    SWIMMING_POOL,
    TENNIS_COURT,
    SQUASH_COURT,
    SAUNA,
    STEAM_ROOM,
    JACUZZI,
    MASSAGE_ROOM,
    PRIVATE_STUDIO,
    BASKETBALL_COURT,
    PADEL_COURT,
    OTHER
}

enum class FacilityStatus {
    ACTIVE,
    INACTIVE,
    MAINTENANCE
}

enum class SlotStatus {
    AVAILABLE,
    BOOKED,
    BLOCKED,
    MAINTENANCE
}

enum class BookingStatus {
    CONFIRMED,
    CHECKED_IN,
    COMPLETED,
    CANCELLED,
    NO_SHOW
}

enum class GenderRestriction {
    MALE_ONLY,
    FEMALE_ONLY,
    NONE
}
