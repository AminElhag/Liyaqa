package com.liyaqa.reporting.domain.model

enum class ReportType {
    REVENUE,
    ATTENDANCE,
    MEMBERS,
    CHURN,
    LTV,
    RETENTION_COHORT,
    SUBSCRIPTIONS,
    CLASSES,
    TRAINERS
}

enum class ReportFrequency {
    DAILY,
    WEEKLY,
    MONTHLY
}

enum class ReportFormat {
    PDF,
    EXCEL,
    CSV
}

enum class ReportStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED
}
