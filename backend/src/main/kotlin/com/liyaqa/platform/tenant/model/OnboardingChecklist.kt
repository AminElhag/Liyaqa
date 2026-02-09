package com.liyaqa.platform.tenant.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "tenant_onboarding_checklist",
    uniqueConstraints = [UniqueConstraint(columnNames = ["tenant_id", "step"])]
)
class OnboardingChecklist(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "step", nullable = false)
    val step: ProvisioningStep,

    @Column(name = "completed", nullable = false)
    var completed: Boolean = false,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "completed_by")
    var completedBy: UUID? = null,

    @Column(name = "notes")
    var notes: String? = null

) : OrganizationLevelEntity(id) {

    fun complete(completedBy: UUID? = null, notes: String? = null) {
        if (completed) return // idempotent
        this.completed = true
        this.completedAt = Instant.now()
        this.completedBy = completedBy
        if (notes != null) this.notes = notes
    }

    companion object {
        fun createAllForTenant(tenantId: UUID): List<OnboardingChecklist> {
            return ProvisioningStep.entries.map { step ->
                OnboardingChecklist(tenantId = tenantId, step = step)
            }
        }
    }
}
