package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class StaffMember(
    val id: String,
    val tenantId: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String?,
    val role: StaffRole,
    val profileImageUrl: String?,
    val locationId: String?,
    val locationName: LocalizedText?,
    val isActive: Boolean = true
) {
    val fullName: String get() = "$firstName $lastName"
}

@Serializable
data class StaffProfile(
    val staff: StaffMember,
    val permissions: List<String> = emptyList()
)
