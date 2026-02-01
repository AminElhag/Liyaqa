package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a scheduled plan change (typically a downgrade) that will take effect
 * at the end of the current billing period.
 */
@Entity
@Table(name = "scheduled_plan_changes")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ScheduledPlanChange(
    id: UUID = UUID.randomUUID(),

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "contract_id")
    val contractId: UUID? = null,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    // ==========================================
    // WHAT'S CHANGING
    // ==========================================

    @Column(name = "current_plan_id", nullable = false)
    val currentPlanId: UUID,

    @Column(name = "new_plan_id", nullable = false)
    val newPlanId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    val changeType: PlanChangeType,

    // ==========================================
    // WHEN IT'S SCHEDULED
    // ==========================================

    @Column(name = "scheduled_date", nullable = false)
    val scheduledDate: LocalDate,

    // ==========================================
    // STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ScheduledChangeStatus = ScheduledChangeStatus.PENDING,

    // ==========================================
    // PROCESSING
    // ==========================================

    @Column(name = "processed_at")
    var processedAt: Instant? = null,

    @Column(name = "plan_change_history_id")
    var planChangeHistoryId: UUID? = null,

    // ==========================================
    // WHO INITIATED
    // ==========================================

    @Column(name = "initiated_by_user_id")
    val initiatedByUserId: UUID? = null,

    @Column(name = "initiated_by_member", nullable = false)
    val initiatedByMember: Boolean = false,

    // ==========================================
    // CANCELLATION
    // ==========================================

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancelled_by_user_id")
    var cancelledByUserId: UUID? = null,

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    var cancellationReason: String? = null

) : BaseEntity(id) {

    /**
     * Check if this change is still pending.
     */
    fun isPending(): Boolean = status == ScheduledChangeStatus.PENDING

    /**
     * Check if this change has been processed.
     */
    fun isProcessed(): Boolean = status == ScheduledChangeStatus.PROCESSED

    /**
     * Check if this change was cancelled.
     */
    fun isCancelled(): Boolean = status == ScheduledChangeStatus.CANCELLED

    /**
     * Check if this is due for processing (scheduled date has arrived).
     */
    fun isDue(): Boolean = isPending() && !LocalDate.now().isBefore(scheduledDate)

    /**
     * Mark this change as processed.
     */
    fun markProcessed(planChangeHistoryId: UUID) {
        require(isPending()) { "Can only process pending changes" }
        this.status = ScheduledChangeStatus.PROCESSED
        this.processedAt = Instant.now()
        this.planChangeHistoryId = planChangeHistoryId
    }

    /**
     * Cancel this scheduled change.
     */
    fun cancel(reason: String? = null, cancelledBy: UUID? = null) {
        require(isPending()) { "Can only cancel pending changes" }
        this.status = ScheduledChangeStatus.CANCELLED
        this.cancelledAt = Instant.now()
        this.cancelledByUserId = cancelledBy
        this.cancellationReason = reason
    }

    /**
     * Get days until scheduled change.
     */
    fun daysUntilChange(): Long {
        val today = LocalDate.now()
        return if (today.isAfter(scheduledDate)) 0
        else java.time.temporal.ChronoUnit.DAYS.between(today, scheduledDate)
    }
}
