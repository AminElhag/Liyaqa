package com.liyaqa.member.domain.model

import com.liyaqa.member.core.localization.LocalizedText
import kotlinx.datetime.LocalDate

/**
 * Subscription domain model representing a member's subscription.
 * Aligned with backend SubscriptionLiteResponse and SubscriptionSummaryDto.
 */
data class Subscription(
    val id: String,
    val planName: LocalizedText,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val daysRemaining: Int,
    val classesRemaining: Int?,
    val totalClasses: Int?,
    val autoRenew: Boolean,
    val frozenUntil: LocalDate?,
    val isExpiringSoon: Boolean
) {
    /**
     * Returns true if this subscription has class limits (not unlimited).
     */
    val hasClassLimit: Boolean
        get() = totalClasses != null

    /**
     * Returns the percentage of classes used (0-100).
     * Returns null if subscription has unlimited classes.
     */
    val classesUsedPercentage: Float?
        get() {
            val remaining = classesRemaining ?: return null
            val total = totalClasses ?: return null
            if (total == 0) return 100f
            val used = total - remaining
            return (used.toFloat() / total.toFloat()) * 100f
        }
}
