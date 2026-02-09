package com.liyaqa.platform.compliance.model

enum class ContractType {
    SERVICE_AGREEMENT,
    SLA,
    DATA_PROCESSING,
    CUSTOM
}

enum class ContractStatus {
    DRAFT,
    SENT,
    SIGNED,
    ACTIVE,
    EXPIRED,
    TERMINATED
}

enum class ZatcaSubmissionStatus {
    PENDING,
    SUBMITTED,
    ACCEPTED,
    REJECTED,
    FAILED
}

enum class DataExportRequestStatus {
    PENDING_APPROVAL,
    APPROVED,
    IN_PROGRESS,
    COMPLETED,
    REJECTED,
    FAILED
}
