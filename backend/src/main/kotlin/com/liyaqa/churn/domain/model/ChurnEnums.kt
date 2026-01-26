package com.liyaqa.churn.domain.model

enum class ChurnAlgorithm {
    RANDOM_FOREST,
    GRADIENT_BOOST,
    NEURAL_NET,
    LOGISTIC_REGRESSION,
    XG_BOOST
}

enum class RiskLevel {
    LOW,      // 0-25
    MEDIUM,   // 26-50
    HIGH,     // 51-75
    CRITICAL  // 76-100
}

enum class InterventionStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED,
    IGNORED
}

enum class ChurnOutcome {
    CHURNED,
    RETAINED,
    UNKNOWN
}

enum class InterventionType {
    PERSONAL_CALL,
    DISCOUNT_OFFER,
    FREE_PT_SESSION,
    EMAIL_CAMPAIGN,
    SMS_REMINDER,
    GIFT_VOUCHER,
    FREEZE_OFFER,
    PLAN_UPGRADE,
    RETENTION_MEETING
}

enum class InterventionOutcome {
    SUCCESS,
    PARTIAL,
    FAILED,
    CANCELLED
}
