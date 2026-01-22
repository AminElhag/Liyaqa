package com.liyaqa.shared.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

/**
 * Audit log entry that records all significant operations in the system.
 * Provides an immutable audit trail for compliance and debugging.
 */
@Entity
@Table(name = "audit_logs")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class AuditLog(
    @Id
    @Column(name = "id", nullable = false, updatable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id")
    val tenantId: UUID? = null,

    @Column(name = "organization_id")
    val organizationId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    val action: AuditAction,

    @Column(name = "entity_type", nullable = false)
    val entityType: String,

    @Column(name = "entity_id", nullable = false)
    val entityId: UUID,

    @Column(name = "user_id")
    val userId: UUID? = null,

    @Column(name = "user_email")
    val userEmail: String? = null,

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @Column(name = "description")
    val description: String? = null,

    @Column(name = "old_value", columnDefinition = "TEXT")
    val oldValue: String? = null,

    @Column(name = "new_value", columnDefinition = "TEXT")
    val newValue: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now()
) {
    companion object {
        fun create(
            action: AuditAction,
            entityType: String,
            entityId: UUID,
            userId: UUID? = null,
            userEmail: String? = null,
            description: String? = null,
            oldValue: String? = null,
            newValue: String? = null,
            tenantId: UUID? = null,
            organizationId: UUID? = null,
            ipAddress: String? = null,
            userAgent: String? = null
        ): AuditLog {
            return AuditLog(
                action = action,
                entityType = entityType,
                entityId = entityId,
                userId = userId,
                userEmail = userEmail,
                description = description,
                oldValue = oldValue,
                newValue = newValue,
                tenantId = tenantId,
                organizationId = organizationId,
                ipAddress = ipAddress,
                userAgent = userAgent
            )
        }
    }
}

/**
 * Types of auditable actions.
 */
enum class AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    STATUS_CHANGE,
    LOGIN,
    LOGOUT,
    PASSWORD_CHANGE,
    PASSWORD_RESET,
    CHECK_IN,
    CHECK_OUT,
    BOOKING_CREATE,
    BOOKING_CANCEL,
    PAYMENT,
    INVOICE_ISSUE,
    SUBSCRIPTION_ACTIVATE,
    SUBSCRIPTION_FREEZE,
    SUBSCRIPTION_CANCEL,
    SUBSCRIPTION_RENEW,
    ACCESS_DENIED,
    RATE_LIMITED,
    IMPERSONATE_START,
    IMPERSONATE_END
}
