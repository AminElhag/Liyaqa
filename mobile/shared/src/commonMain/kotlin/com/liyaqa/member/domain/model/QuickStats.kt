package com.liyaqa.member.domain.model

/**
 * Quick statistics for the member.
 * Provides summary information for the dashboard.
 */
data class QuickStats(
    val memberSince: String,
    val totalVisits: Long,
    val averageVisitsPerMonth: Double,
    val classesRemaining: Int?,
    val daysRemaining: Long?,
    val subscriptionStatus: SubscriptionStatus
) {
    /**
     * Returns true if the member has an active subscription.
     */
    val hasActiveSubscription: Boolean
        get() = subscriptionStatus == SubscriptionStatus.ACTIVE

    /**
     * Returns true if the subscription has limited classes.
     */
    val hasClassLimit: Boolean
        get() = classesRemaining != null

    /**
     * Returns true if the subscription is time-based.
     */
    val hasTimeLimit: Boolean
        get() = daysRemaining != null
}
