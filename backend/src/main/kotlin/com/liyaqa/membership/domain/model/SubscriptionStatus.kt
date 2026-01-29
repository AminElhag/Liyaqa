package com.liyaqa.membership.domain.model

/**
 * Status of a member's subscription.
 */
enum class SubscriptionStatus {
    /** Contract not yet signed, waiting for member signature */
    PENDING_SIGNATURE,

    /** Subscription is pending payment confirmation */
    PENDING_PAYMENT,

    /** Subscription is active and member can access the gym */
    ACTIVE,

    /** Subscription is temporarily frozen */
    FROZEN,

    /** Admin-initiated pause (gym closure, maintenance, etc.) */
    PAUSED,

    /** Payment is overdue but still in grace period (member can still access) */
    PAST_DUE,

    /** Access revoked due to non-payment (after grace period) */
    SUSPENDED,

    /** Member has requested cancellation, currently in notice period */
    PENDING_CANCELLATION,

    /** Subscription was cancelled by member or admin */
    CANCELLED,

    /** Subscription has expired (end date passed) */
    EXPIRED,

    /** Former member returning, reactivation in progress */
    REACTIVATION_PENDING;

    /**
     * Check if this status allows gym access.
     */
    fun allowsAccess(): Boolean = this in listOf(
        ACTIVE,
        PAST_DUE, // Still allowed during grace period
        PENDING_CANCELLATION // Still allowed during notice period
    )

    /**
     * Check if this status is considered active (for billing purposes).
     */
    fun isActiveBilling(): Boolean = this in listOf(
        ACTIVE,
        FROZEN,
        PAUSED,
        PAST_DUE,
        PENDING_CANCELLATION
    )

    /**
     * Check if this is a terminal status.
     */
    fun isTerminal(): Boolean = this in listOf(
        CANCELLED,
        EXPIRED
    )

    /**
     * Check if subscription can be frozen.
     */
    fun canFreeze(): Boolean = this == ACTIVE

    /**
     * Check if subscription can be cancelled.
     */
    fun canCancel(): Boolean = this in listOf(
        ACTIVE,
        FROZEN,
        PAUSED,
        PAST_DUE
    )

    /**
     * Check if subscription can be renewed.
     */
    fun canRenew(): Boolean = this in listOf(
        ACTIVE,
        EXPIRED,
        PAST_DUE,
        SUSPENDED
    )
}