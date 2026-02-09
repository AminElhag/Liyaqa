package com.liyaqa.platform.tenant.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "tenant_deactivation_logs")
class TenantDeactivationLog(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    val reason: DeactivationReason,

    @Column(name = "notes")
    val notes: String? = null,

    @Column(name = "deactivated_by", nullable = false)
    val deactivatedBy: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false)
    val previousStatus: TenantStatus

) : OrganizationLevelEntity(id) {

    companion object {
        fun create(
            tenantId: UUID,
            reason: DeactivationReason,
            notes: String?,
            deactivatedBy: UUID,
            previousStatus: TenantStatus
        ): TenantDeactivationLog {
            return TenantDeactivationLog(
                tenantId = tenantId,
                reason = reason,
                notes = notes,
                deactivatedBy = deactivatedBy,
                previousStatus = previousStatus
            )
        }
    }
}
