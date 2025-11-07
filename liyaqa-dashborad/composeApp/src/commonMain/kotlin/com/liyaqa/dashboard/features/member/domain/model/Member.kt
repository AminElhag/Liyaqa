package com.liyaqa.dashboard.features.member.domain.model

/**
 * Gym member domain model
 */
data class Member(
    val id: String,
    val facilityId: String,
    val membershipNumber: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phoneNumber: String?,
    val dateOfBirth: String?,
    val gender: String?,
    val address: String?,
    val emergencyContact: EmergencyContact?,
    val status: MemberStatus,
    val joinDate: String,
    val currentMembership: MembershipSubscription?,
    val notes: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val fullName: String
        get() = "$firstName $lastName"

    fun isActive(): Boolean = status == MemberStatus.ACTIVE

    fun hasMembership(): Boolean = currentMembership != null && currentMembership.isActive()
}

enum class MemberStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    EXPIRED
}

data class EmergencyContact(
    val name: String,
    val relationship: String,
    val phoneNumber: String
)

/**
 * Membership plan domain model
 */
data class MembershipPlan(
    val id: String,
    val facilityId: String,
    val name: String,
    val description: String?,
    val duration: Int, // days
    val price: Double,
    val currency: String,
    val benefits: List<String> = emptyList(),
    val status: PlanStatus,
    val maxMembers: Int? = null,
    val allowedAccessAreas: List<String> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    fun isActive(): Boolean = status == PlanStatus.ACTIVE

    val durationInMonths: Int
        get() = duration / 30
}

enum class PlanStatus {
    ACTIVE,
    INACTIVE,
    ARCHIVED
}

/**
 * Membership subscription domain model
 */
data class MembershipSubscription(
    val id: String,
    val memberId: String,
    val planId: String,
    val planName: String,
    val startDate: String,
    val endDate: String,
    val status: SubscriptionStatus,
    val autoRenew: Boolean,
    val price: Double,
    val currency: String,
    val paymentStatus: PaymentStatus,
    val createdAt: String? = null
) {
    fun isActive(): Boolean = status == SubscriptionStatus.ACTIVE

    fun isExpiringSoon(daysThreshold: Int = 7): Boolean {
        // TODO: Implement date comparison logic
        return false
    }
}

enum class SubscriptionStatus {
    ACTIVE,
    EXPIRED,
    CANCELLED,
    PENDING
}

enum class PaymentStatus {
    PAID,
    PENDING,
    FAILED,
    REFUNDED
}
