package com.liyaqa.platform.support.model

enum class TicketCategory {
    BILLING, TECHNICAL, FEATURE_REQUEST, BUG_REPORT, ACCOUNT, DATA, INTEGRATION, OTHER
}

enum class TicketPriority {
    LOW, MEDIUM, HIGH, CRITICAL
}

enum class TicketStatus {
    OPEN, IN_PROGRESS, WAITING_ON_CUSTOMER, WAITING_ON_THIRD_PARTY, ESCALATED, RESOLVED, CLOSED, REOPENED
}

enum class CreatedByUserType {
    FACILITY_ADMIN, CLIENT, PLATFORM_AGENT
}
