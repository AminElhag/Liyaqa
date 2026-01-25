package com.liyaqa.loyalty.domain.model

enum class LoyaltyTier {
    BRONZE,
    SILVER,
    GOLD,
    PLATINUM
}

enum class PointsTransactionType {
    EARN,
    REDEEM,
    EXPIRE,
    ADJUSTMENT
}

enum class PointsSource {
    ATTENDANCE,
    REFERRAL,
    PURCHASE,
    MANUAL,
    PROMOTION,
    BIRTHDAY,
    SIGNUP_BONUS
}
