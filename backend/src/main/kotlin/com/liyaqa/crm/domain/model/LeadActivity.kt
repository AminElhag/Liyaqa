package com.liyaqa.crm.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.util.UUID

/**
 * Tracks all activities and interactions with a lead.
 */
@Entity
@Table(name = "lead_activities")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class LeadActivity(
    id: UUID = UUID.randomUUID(),

    @Column(name = "lead_id", nullable = false)
    val leadId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "activity_type", nullable = false)
    val type: LeadActivityType,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "performed_by_user_id")
    val performedByUserId: UUID? = null,

    @Column(name = "contact_method")
    val contactMethod: String? = null,

    @Column(name = "outcome")
    var outcome: String? = null,

    @Column(name = "follow_up_date")
    var followUpDate: LocalDate? = null,

    @Column(name = "follow_up_completed")
    var followUpCompleted: Boolean = false,

    @Column(name = "duration_minutes")
    val durationMinutes: Int? = null

) : BaseEntity(id) {

    /**
     * Mark the follow-up as completed.
     */
    fun completeFollowUp() {
        require(followUpDate != null) { "Cannot complete follow-up without a scheduled date" }
        followUpCompleted = true
    }

    /**
     * Check if this activity has a pending follow-up.
     */
    fun hasPendingFollowUp(): Boolean = followUpDate != null && !followUpCompleted

    /**
     * Check if the follow-up is overdue.
     */
    fun isFollowUpOverdue(): Boolean = hasPendingFollowUp() && followUpDate!!.isBefore(LocalDate.now())
}
