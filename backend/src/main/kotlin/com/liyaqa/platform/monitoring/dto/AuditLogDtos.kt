package com.liyaqa.platform.monitoring.dto

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.platform.monitoring.model.PlatformAuditAction
import com.liyaqa.platform.monitoring.model.PlatformAuditActorType
import com.liyaqa.platform.monitoring.model.PlatformAuditLog
import com.liyaqa.platform.monitoring.model.PlatformAuditResourceType
import java.time.Instant
import java.util.UUID

data class PlatformAuditLogResponse(
    val id: UUID,
    val actorId: UUID?,
    val actorType: PlatformAuditActorType,
    val actorName: String?,
    val action: PlatformAuditAction,
    val resourceType: PlatformAuditResourceType,
    val resourceId: UUID?,
    val tenantId: UUID?,
    val details: Map<String, Any?>?,
    val ipAddress: String?,
    val userAgent: String?,
    val correlationId: String?,
    val createdAt: Instant
) {
    companion object {
        fun from(log: PlatformAuditLog, objectMapper: ObjectMapper): PlatformAuditLogResponse {
            return PlatformAuditLogResponse(
                id = log.id,
                actorId = log.actorId,
                actorType = log.actorType,
                actorName = log.actorName,
                action = log.action,
                resourceType = log.resourceType,
                resourceId = log.resourceId,
                tenantId = log.tenantId,
                details = log.getDetailsMap(objectMapper),
                ipAddress = log.ipAddress,
                userAgent = log.userAgent,
                correlationId = log.correlationId,
                createdAt = log.createdAt
            )
        }
    }
}

data class AuditActionResponse(
    val name: String,
    val displayName: String
)

data class AuditResourceTypeResponse(
    val name: String,
    val displayName: String
)
