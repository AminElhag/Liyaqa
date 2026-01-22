package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Profile DTOs matching backend MeController responses.
 */

/**
 * Full profile response from GET /api/me.
 * Matches backend MyProfileResponse.
 */
@Serializable
data class MyProfileDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val address: AddressDto? = null,
    val emergencyContact: EmergencyContactDto? = null,
    val status: String,
    val memberId: String? = null
)

/**
 * Address DTO matching backend Address.
 */
@Serializable
data class AddressDto(
    val street: LocalizedTextDto? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null
)

/**
 * Emergency contact DTO matching backend EmergencyContact.
 */
@Serializable
data class EmergencyContactDto(
    val name: String? = null,
    val phone: String? = null
)

/**
 * Profile update request for PATCH /api/me.
 * Matches backend UpdateMyProfileRequest.
 */
@Serializable
data class UpdateProfileRequestDto(
    val firstName: String? = null,
    val lastName: String? = null,
    val phone: String? = null,
    val dateOfBirth: String? = null,
    val address: AddressDto? = null,
    val emergencyContact: EmergencyContactDto? = null
)

/**
 * Password change request for POST /api/me/password/change.
 * Matches backend ChangePasswordRequest.
 */
@Serializable
data class ChangePasswordRequestDto(
    val currentPassword: String,
    val newPassword: String
)
