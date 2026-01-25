package com.liyaqa.referral.domain.model

/**
 * Type of reward given for successful referrals.
 */
enum class RewardType {
    WALLET_CREDIT,    // Credit added to member wallet
    FREE_DAYS,        // Free subscription days
    DISCOUNT_PERCENT, // Percentage discount on next subscription
    DISCOUNT_AMOUNT   // Fixed amount discount on next subscription
}

/**
 * Status of a referral in its lifecycle.
 */
enum class ReferralStatus {
    CLICKED,      // Referral link was clicked
    SIGNED_UP,    // Referred person created an account
    CONVERTED,    // Referred person purchased a subscription
    EXPIRED       // Referral expired without conversion
}

/**
 * Status of a reward distribution.
 */
enum class RewardStatus {
    PENDING,      // Waiting to be distributed
    DISTRIBUTED,  // Successfully distributed to member
    FAILED,       // Distribution failed
    CANCELLED     // Reward was cancelled
}
