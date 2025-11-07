package com.liyaqa.liyaqa_internal_app.core.network

/**
 * Network configuration constants
 */
object NetworkConfig {
    // TODO: Update these values to match your backend configuration
    const val BASE_URL = "http://localhost:8080/api/v1"
    const val CONNECT_TIMEOUT = 30_000L // 30 seconds
    const val READ_TIMEOUT = 30_000L
    const val WRITE_TIMEOUT = 30_000L

    // API Endpoints
    object Endpoints {
        // Auth endpoints (matching backend structure)
        const val AUTH_LOGIN = "/internal/auth/login"
        const val AUTH_LOGOUT = "/internal/auth/logout"
        const val AUTH_REFRESH = "/internal/auth/refresh"
        const val AUTH_VALIDATE = "/internal/auth/validate"
        const val AUTH_PASSWORD_RESET_REQUEST = "/internal/auth/password-reset/request"
        const val AUTH_PASSWORD_RESET_COMPLETE = "/internal/auth/password-reset/complete"

        // Employee endpoints
        const val EMPLOYEES_ME = "/internal/employees/me"
        const val EMPLOYEES_ME_CHANGE_PASSWORD = "/internal/employees/me/change-password"

        // Tenant endpoints
        const val TENANTS_SUSPEND = "/internal/tenants/{id}/suspend"
        const val TENANTS_REACTIVATE = "/internal/tenants/{id}/reactivate"
        const val TENANTS_ACCEPT_TERMS = "/internal/tenants/{id}/accept-terms"
        const val TENANTS_CHANGE_PLAN = "/internal/tenants/{id}/change-plan"
        const val TENANTS_ATTENTION_NEEDED = "/internal/tenants/attention-needed"
        const val TENANTS_ANALYTICS = "/internal/tenants/analytics"

        // Facility endpoints
        const val FACILITIES_BY_TENANT = "/internal/facilities/by-tenant/{tenantId}"
        const val FACILITY_BRANCHES = "/internal/facilities/{facilityId}/branches"
        const val FACILITY_BRANCHES_CREATE = "/internal/facilities/branches"
        const val FACILITY_BRANCH_BY_ID = "/internal/facilities/branches/{id}"

        // System initialization endpoints
        const val SYSTEM_INIT_STATUS = "/internal/system/init-status"
        const val SYSTEM_INITIALIZE = "/internal/system/initialize"
        const val SYSTEM_ENSURE_GROUPS = "/internal/system/ensure-groups"
    }

    // Header keys
    object Headers {
        const val AUTHORIZATION = "Authorization"
        const val CONTENT_TYPE = "Content-Type"
        const val ACCEPT = "Accept"
        const val TENANT_ID = "X-Tenant-Id" // For multi-tenancy support
    }
}
