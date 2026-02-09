package com.liyaqa.platform.monitoring.model

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "platform_audit_logs")
class PlatformAuditLog(
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "actor_id")
    val actorId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_type", nullable = false)
    val actorType: PlatformAuditActorType,

    @Column(name = "actor_name")
    val actorName: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    val action: PlatformAuditAction,

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false)
    val resourceType: PlatformAuditResourceType,

    @Column(name = "resource_id")
    val resourceId: UUID? = null,

    @Column(name = "tenant_id")
    val tenantId: UUID? = null,

    @Column(name = "details", columnDefinition = "TEXT")
    val details: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @Column(name = "correlation_id")
    val correlationId: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    fun getDetailsMap(objectMapper: ObjectMapper): Map<String, Any?>? {
        return details?.let { objectMapper.readValue(it) }
    }

    companion object {
        fun create(
            action: PlatformAuditAction,
            resourceType: PlatformAuditResourceType,
            actorId: UUID? = null,
            actorType: PlatformAuditActorType = PlatformAuditActorType.SYSTEM,
            actorName: String? = null,
            resourceId: UUID? = null,
            tenantId: UUID? = null,
            details: Map<String, Any?>? = null,
            ipAddress: String? = null,
            userAgent: String? = null,
            correlationId: String? = null,
            objectMapper: ObjectMapper? = null
        ): PlatformAuditLog {
            val detailsJson = if (details != null && objectMapper != null) {
                objectMapper.writeValueAsString(details)
            } else {
                null
            }
            return PlatformAuditLog(
                action = action,
                resourceType = resourceType,
                actorId = actorId,
                actorType = actorType,
                actorName = actorName,
                resourceId = resourceId,
                tenantId = tenantId,
                details = detailsJson,
                ipAddress = ipAddress,
                userAgent = userAgent,
                correlationId = correlationId
            )
        }
    }
}
