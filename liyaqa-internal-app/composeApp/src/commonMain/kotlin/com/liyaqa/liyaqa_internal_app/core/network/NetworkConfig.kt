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
        const val AUTH_LOGIN = "/auth/login"
        const val AUTH_LOGOUT = "/auth/logout"
        const val AUTH_REFRESH = "/auth/refresh"
        const val AUTH_ME = "/auth/me"
    }

    // Header keys
    object Headers {
        const val AUTHORIZATION = "Authorization"
        const val CONTENT_TYPE = "Content-Type"
        const val ACCEPT = "Accept"
        const val TENANT_ID = "X-Tenant-Id" // For multi-tenancy support
    }
}
