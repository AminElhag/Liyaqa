package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Member address information
 */
@Serializable
data class MemberAddress(
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null
) {
    fun isComplete(): Boolean =
        !street.isNullOrBlank() && !city.isNullOrBlank() && !country.isNullOrBlank()

    fun formatted(): String = listOfNotNull(street, city, state, postalCode, country)
        .filter { it.isNotBlank() }
        .joinToString(", ")
}

/**
 * Member profile information
 */
@Serializable
data class Member(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val address: MemberAddress? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val status: MemberStatus,
    val createdAt: String,
    val updatedAt: String
) {
    val fullName: String get() = "$firstName $lastName"

    val isActive: Boolean get() = status == MemberStatus.ACTIVE

    val hasEmergencyContact: Boolean
        get() = !emergencyContactName.isNullOrBlank() && !emergencyContactPhone.isNullOrBlank()
}

/**
 * Member summary for dashboard/lists
 */
@Serializable
data class MemberSummary(
    val id: String,
    val name: LocalizedText,
    val email: String,
    val status: MemberStatus
)
