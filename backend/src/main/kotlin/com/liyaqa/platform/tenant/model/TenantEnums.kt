package com.liyaqa.platform.tenant.model

enum class TenantStatus {
    PROVISIONING, ACTIVE, SUSPENDED, DEACTIVATED, ARCHIVED
}

enum class ProvisioningStep {
    DEAL_WON, TENANT_CREATED, ADMIN_ACCOUNT_CREATED, SUBSCRIPTION_ACTIVATED,
    INITIAL_CONFIG_DONE, DATA_IMPORTED, TRAINING_SCHEDULED, GO_LIVE
}

enum class DeactivationReason {
    NON_PAYMENT, CONTRACT_ENDED, CLIENT_REQUEST, POLICY_VIOLATION, FRAUD, OTHER
}

enum class DataExportStatus {
    PENDING, IN_PROGRESS, COMPLETED, FAILED, EXPIRED
}

enum class DataExportFormat {
    JSON, CSV
}
