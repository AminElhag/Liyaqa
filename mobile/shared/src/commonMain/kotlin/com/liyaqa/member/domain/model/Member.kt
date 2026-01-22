package com.liyaqa.member.domain.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.datetime.LocalDate

/**
 * Member domain model representing the authenticated member's profile.
 * Aligned with backend MemberLiteResponse and MyProfileResponse.
 */
data class Member(
    val id: String,
    val firstName: String,
    val lastName: String,
    val fullName: String,
    val email: String,
    val phone: String?,
    val dateOfBirth: LocalDate?,
    val address: Address?,
    val emergencyContact: EmergencyContact?,
    val status: MemberStatus
)

/**
 * Address information for a member.
 * Street is bilingual to support EN/AR addresses.
 */
data class Address(
    val street: LocalizedText?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val country: String?
)

/**
 * Emergency contact information for a member.
 */
data class EmergencyContact(
    val name: String?,
    val phone: String?
)
