package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Subscription information
 */
@Serializable
data class Subscription(
    val id: String,
    val planId: String,
    val planName: LocalizedText? = null,
    val status: SubscriptionStatus,
    val startDate: String,
    val endDate: String,
    val autoRenew: Boolean = false,
    val classesRemaining: Int? = null,
    val guestPassesRemaining: Int = 0,
    val freezeDaysRemaining: Int = 0,
    val frozenAt: String? = null,
    val daysRemaining: Int = 0
) {
    val isActive: Boolean get() = status == SubscriptionStatus.ACTIVE

    val isExpired: Boolean get() = status == SubscriptionStatus.EXPIRED

    val isFrozen: Boolean get() = status == SubscriptionStatus.FROZEN

    val isExpiringSoon: Boolean get() = isActive && daysRemaining in 1..7

    val hasUnlimitedClasses: Boolean get() = classesRemaining == null

    val canFreeze: Boolean get() = isActive && freezeDaysRemaining > 0

    val canBook: Boolean get() = isActive && (hasUnlimitedClasses || (classesRemaining ?: 0) > 0)
}

/**
 * Subscription summary for dashboard
 */
@Serializable
data class SubscriptionSummary(
    val id: String,
    val planName: LocalizedText?,
    val status: SubscriptionStatus,
    val daysRemaining: Int,
    val classesRemaining: Int?
) {
    val isExpiringSoon: Boolean get() = status == SubscriptionStatus.ACTIVE && daysRemaining in 1..7
}

/**
 * Minimal subscription info for quick display
 */
@Serializable
data class SubscriptionMinimal(
    val id: String,
    val status: SubscriptionStatus,
    val daysRemaining: Int,
    val classesRemaining: Int?
)

/**
 * Response wrapper for subscription query
 */
@Serializable
data class MySubscriptionResponse(
    val hasSubscription: Boolean,
    val subscription: Subscription? = null
)
