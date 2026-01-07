package com.liyaqa.membership.domain.model

/**
 * Status of a member's subscription.
 */
enum class SubscriptionStatus {
    /** Subscription is active and member can access the gym */
    ACTIVE,

    /** Subscription has expired (end date passed) */
    EXPIRED,

    /** Subscription was cancelled by member or admin */
    CANCELLED,

    /** Subscription is temporarily frozen */
    FROZEN,

    /** Subscription is pending payment confirmation */
    PENDING_PAYMENT
}