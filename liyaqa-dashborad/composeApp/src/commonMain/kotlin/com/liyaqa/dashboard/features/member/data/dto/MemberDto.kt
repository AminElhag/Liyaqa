package com.liyaqa.dashboard.features.member.data.dto

import com.liyaqa.dashboard.features.member.domain.model.*
import kotlinx.serialization.Serializable

@Serializable
data class MemberDto(
    val id: String,
    val facilityId: String,
    val membershipNumber: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val emergencyContact: EmergencyContactDto? = null,
    val status: String,
    val joinDate: String,
    val currentMembership: MembershipSubscriptionDto? = null,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class EmergencyContactDto(
    val name: String,
    val relationship: String,
    val phoneNumber: String
)

@Serializable
data class MembershipPlanDto(
    val id: String,
    val facilityId: String,
    val name: String,
    val description: String? = null,
    val duration: Int,
    val price: Double,
    val currency: String,
    val benefits: List<String> = emptyList(),
    val status: String,
    val maxMembers: Int? = null,
    val allowedAccessAreas: List<String> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class MembershipSubscriptionDto(
    val id: String,
    val memberId: String,
    val planId: String,
    val planName: String,
    val startDate: String,
    val endDate: String,
    val status: String,
    val autoRenew: Boolean,
    val price: Double,
    val currency: String,
    val paymentStatus: String,
    val createdAt: String? = null
)

@Serializable
data class CreateMemberRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val emergencyContact: EmergencyContactDto? = null,
    val notes: String? = null
)

@Serializable
data class UpdateMemberRequest(
    val firstName: String? = null,
    val lastName: String? = null,
    val email: String? = null,
    val phoneNumber: String? = null,
    val dateOfBirth: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val emergencyContact: EmergencyContactDto? = null,
    val status: String? = null,
    val notes: String? = null
)

@Serializable
data class CreateMembershipPlanRequest(
    val name: String,
    val description: String? = null,
    val duration: Int,
    val price: Double,
    val currency: String = "USD",
    val benefits: List<String> = emptyList(),
    val maxMembers: Int? = null,
    val allowedAccessAreas: List<String> = emptyList()
)

@Serializable
data class SubscribeToPlanRequest(
    val planId: String,
    val autoRenew: Boolean = false
)

@Serializable
data class MemberPageResponse(
    val content: List<MemberDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

@Serializable
data class MembershipPlanPageResponse(
    val content: List<MembershipPlanDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int
)

// Mapping functions
fun MemberDto.toDomain() = Member(
    id = id,
    facilityId = facilityId,
    membershipNumber = membershipNumber,
    firstName = firstName,
    lastName = lastName,
    email = email,
    phoneNumber = phoneNumber,
    dateOfBirth = dateOfBirth,
    gender = gender,
    address = address,
    emergencyContact = emergencyContact?.toDomain(),
    status = MemberStatus.valueOf(status),
    joinDate = joinDate,
    currentMembership = currentMembership?.toDomain(),
    notes = notes,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun EmergencyContactDto.toDomain() = EmergencyContact(
    name = name,
    relationship = relationship,
    phoneNumber = phoneNumber
)

fun MembershipPlanDto.toDomain() = MembershipPlan(
    id = id,
    facilityId = facilityId,
    name = name,
    description = description,
    duration = duration,
    price = price,
    currency = currency,
    benefits = benefits,
    status = PlanStatus.valueOf(status),
    maxMembers = maxMembers,
    allowedAccessAreas = allowedAccessAreas,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun MembershipSubscriptionDto.toDomain() = MembershipSubscription(
    id = id,
    memberId = memberId,
    planId = planId,
    planName = planName,
    startDate = startDate,
    endDate = endDate,
    status = SubscriptionStatus.valueOf(status),
    autoRenew = autoRenew,
    price = price,
    currency = currency,
    paymentStatus = PaymentStatus.valueOf(paymentStatus),
    createdAt = createdAt
)

fun EmergencyContact.toDto() = EmergencyContactDto(
    name = name,
    relationship = relationship,
    phoneNumber = phoneNumber
)
