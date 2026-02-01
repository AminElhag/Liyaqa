package com.liyaqa.churn.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "churn_interventions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ChurnIntervention(
    id: UUID = UUID.randomUUID(),

    @Column(name = "prediction_id", nullable = false)
    val predictionId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_type", nullable = false, length = 50)
    val interventionType: InterventionType,

    @Column(name = "intervention_template_id")
    val interventionTemplateId: UUID? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "assigned_to")
    var assignedTo: UUID? = null,

    @Column(name = "scheduled_at")
    var scheduledAt: Instant? = null,

    @Column(name = "executed_at")
    var executedAt: Instant? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "outcome", length = 30)
    var outcome: InterventionOutcome? = null,

    @Column(name = "outcome_notes", columnDefinition = "TEXT")
    var outcomeNotes: String? = null,

    @Column(name = "created_by")
    val createdBy: UUID? = null
) : BaseEntity(id) {

    fun assign(userId: UUID) {
        assignedTo = userId
    }

    fun schedule(at: Instant) {
        scheduledAt = at
    }

    fun execute() {
        executedAt = Instant.now()
    }

    fun recordOutcome(result: InterventionOutcome, notes: String?) {
        outcome = result
        outcomeNotes = notes
        if (executedAt == null) {
            executedAt = Instant.now()
        }
    }

    fun isCompleted(): Boolean = outcome != null

    fun isPending(): Boolean = executedAt == null && outcome == null
}
