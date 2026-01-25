package com.liyaqa.voucher.domain.model

/**
 * Types of discounts a voucher can provide.
 */
enum class DiscountType {
    /** Fixed amount discount (e.g., 50 SAR off) */
    FIXED_AMOUNT,

    /** Percentage discount (e.g., 20% off) */
    PERCENTAGE,

    /** Free trial days */
    FREE_TRIAL,

    /** Gift card with balance */
    GIFT_CARD
}

/**
 * What the voucher was used for.
 */
enum class UsageType {
    /** Used for subscription purchase */
    SUBSCRIPTION,

    /** Used for shop order */
    SHOP_ORDER,

    /** Gift card redeemed to wallet */
    WALLET_REDEMPTION
}
