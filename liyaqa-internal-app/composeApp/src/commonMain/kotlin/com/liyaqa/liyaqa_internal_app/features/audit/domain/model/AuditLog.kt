package com.liyaqa.liyaqa_internal_app.features.audit.domain.model

data class AuditLog(
    val id: String,
    val action: String,
    val entityType: String,
    val entityId: String?,
    val employeeId: String,
    val employeeName: String,
    val employeeEmail: String,
    val tenantId: String?,
    val changes: Map<String, String> = emptyMap(),
    val metadata: Map<String, String> = emptyMap(),
    val ipAddress: String?,
    val userAgent: String?,
    val timestamp: String
)

enum class AuditAction {
    CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, EXPORT, UNAUTHORIZED_ACCESS
}

enum class EntityType {
    EMPLOYEE, TENANT, FACILITY, MEMBER, BOOKING, PAYMENT, SYSTEM
}
