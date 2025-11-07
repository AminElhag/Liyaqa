package com.liyaqa.liyaqa_internal_app.features.facility.domain.model

/**
 * Facility domain model representing a sports facility.
 * Facilities belong to tenants and can have multiple branches.
 */
data class Facility(
    val id: String,
    val tenantId: String,
    val name: String,
    val slug: String,
    val facilityType: FacilityType,
    val description: String?,
    val logoUrl: String?,
    val coverImageUrl: String?,
    val contactEmail: String,
    val contactPhone: String?,
    val website: String?,
    val timezone: String,
    val currency: String,
    val status: FacilityStatus,
    val settings: Map<String, String> = emptyMap(),
    val features: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
) {
    val isActive: Boolean
        get() = status == FacilityStatus.ACTIVE
}

/**
 * Facility branch representing a physical location
 */
data class FacilityBranch(
    val id: String,
    val facilityId: String,
    val tenantId: String,
    val name: String,
    val slug: String,
    val address: String,
    val city: String,
    val state: String?,
    val country: String,
    val postalCode: String?,
    val latitude: Double?,
    val longitude: Double?,
    val contactPhone: String?,
    val contactEmail: String?,
    val status: BranchStatus,
    val operatingHours: Map<String, String> = emptyMap(),
    val amenities: List<String> = emptyList(),
    val createdAt: String,
    val updatedAt: String
) {
    val isActive: Boolean
        get() = status == BranchStatus.ACTIVE

    val fullAddress: String
        get() = listOfNotNull(address, city, state, postalCode, country)
            .filter { it.isNotBlank() }
            .joinToString(", ")
}

enum class FacilityType {
    SPORTS_CLUB,
    FITNESS_CENTER,
    SWIMMING_POOL,
    TENNIS_CLUB,
    BASKETBALL_COURT,
    FOOTBALL_FIELD,
    MULTI_SPORT,
    OTHER
}

enum class FacilityStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    MAINTENANCE
}

enum class BranchStatus {
    ACTIVE,
    INACTIVE,
    TEMPORARILY_CLOSED,
    PERMANENTLY_CLOSED
}
