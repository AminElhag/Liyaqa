package com.liyaqa.staff.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class MemberSummary(
    val id: String,
    val memberNumber: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val profileImageUrl: String?,
    val gender: Gender?,
    val membershipStatus: MembershipStatus,
    val subscriptionName: LocalizedText?,
    val subscriptionEndDate: String?,
    val canCheckIn: Boolean = true,
    val checkInRestrictionReason: String? = null
) {
    val fullName: String get() = "$firstName $lastName"
}

@Serializable
data class MemberSearchResult(
    val content: List<MemberSummary>,
    val totalElements: Int,
    val totalPages: Int,
    val page: Int,
    val size: Int
)
