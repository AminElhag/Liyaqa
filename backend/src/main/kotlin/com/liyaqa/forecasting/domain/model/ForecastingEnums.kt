package com.liyaqa.forecasting.domain.model

enum class ModelType {
    REVENUE,
    MEMBERSHIP_COUNT,
    ATTENDANCE,
    CHURN
}

enum class Algorithm {
    ARIMA,
    EXPONENTIAL_SMOOTHING,
    PROPHET,
    LINEAR_REGRESSION,
    MOVING_AVERAGE
}

enum class ForecastType {
    REVENUE,
    MEMBERSHIP_REVENUE,
    MEMBERSHIP_COUNT,
    ATTENDANCE,
    CHURN_RATE,
    SIGN_UPS,
    PT_REVENUE,
    RETAIL_REVENUE
}

enum class PatternType {
    WEEKLY,
    MONTHLY,
    QUARTERLY,
    YEARLY,
    RAMADAN,
    HOLIDAY
}

enum class MetricType {
    REVENUE,
    MEMBERSHIP_REVENUE,
    PT_REVENUE,
    RETAIL_REVENUE,
    ATTENDANCE,
    SIGN_UPS,
    CHURN_RATE,
    ACTIVE_MEMBERS
}

enum class BudgetStatus {
    DRAFT,
    APPROVED,
    LOCKED
}
