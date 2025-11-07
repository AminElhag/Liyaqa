package com.liyaqa.liyaqa_internal_app.features.audit.data.dto

import com.liyaqa.liyaqa_internal_app.features.audit.domain.model.AuditLog
import kotlinx.serialization.Serializable

@Serializable
data class AuditLogDto(
    val id: String,
    val action: String,
    val entityType: String,
    val entityId: String? = null,
    val employeeId: String,
    val employeeName: String,
    val employeeEmail: String,
    val tenantId: String? = null,
    val changes: Map<String, String> = emptyMap(),
    val metadata: Map<String, String> = emptyMap(),
    val ipAddress: String? = null,
    val userAgent: String? = null,
    val timestamp: String
)

@Serializable
data class AuditLogPageResponse(
    val content: List<AuditLogDto>,
    val totalElements: Long,
    val totalPages: Int,
    val size: Int,
    val number: Int,
    val first: Boolean,
    val last: Boolean
)

fun AuditLogDto.toDomain() = AuditLog(
    id, action, entityType, entityId, employeeId, employeeName, employeeEmail,
    tenantId, changes, metadata, ipAddress, userAgent, timestamp
)
