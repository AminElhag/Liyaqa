package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
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
 * Records all plan changes (upgrades and downgrades) with proration details.
 */
@Entity
@Table(name = "plan_change_history")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class PlanChangeHistory(
    id: UUID = UUID.randomUUID(),

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "contract_id")
    val contractId: UUID? = null,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    // ==========================================
    // PLAN DETAILS
    // ==========================================

    @Column(name = "old_plan_id", nullable = false)
    val oldPlanId: UUID,

    @Column(name = "new_plan_id", nullable = false)
    val newPlanId: UUID,

    // ==========================================
    // CHANGE TYPE AND TIMING
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    val changeType: PlanChangeType,

    @Enumerated(EnumType.STRING)
    @Column(name = "proration_mode", nullable = false)
    val prorationMode: ProrationMode,

    @Column(name = "requested_at", nullable = false)
    val requestedAt: Instant = Instant.now(),

    @Column(name = "effective_date", nullable = false)
    val effectiveDate: LocalDate,

    // ==========================================
    // BILLING PERIOD CONTEXT
    // ==========================================

    @Column(name = "billing_period_start", nullable = false)
    val billingPeriodStart: LocalDate,

    @Column(name = "billing_period_end", nullable = false)
    val billingPeriodEnd: LocalDate,

    @Column(name = "days_remaining", nullable = false)
    val daysRemaining: Int,

    @Column(name = "total_days", nullable = false)
    val totalDays: Int,

    // ==========================================
    // PRORATION AMOUNTS
    // ==========================================

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "credit_amount")),
        AttributeOverride(name = "currency", column = Column(name = "credit_currency"))
    )
    var creditAmount: Money? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "charge_amount")),
        AttributeOverride(name = "currency", column = Column(name = "charge_currency"))
    )
    var chargeAmount: Money? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "net_amount")),
        AttributeOverride(name = "currency", column = Column(name = "net_currency"))
    )
    var netAmount: Money? = null,

    // ==========================================
    // REFERENCES
    // ==========================================

    @Column(name = "invoice_id")
    var invoiceId: UUID? = null,

    @Column(name = "wallet_transaction_id")
    var walletTransactionId: UUID? = null,

    // ==========================================
    // STATUS AND TRACKING
    // ==========================================

    @Column(name = "status", nullable = false)
    var status: String = "COMPLETED",

    @Column(name = "initiated_by_user_id")
    val initiatedByUserId: UUID? = null,

    @Column(name = "initiated_by_member", nullable = false)
    val initiatedByMember: Boolean = false,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : BaseEntity(id) {

    /**
     * Check if this was an upgrade.
     */
    fun isUpgrade(): Boolean = changeType == PlanChangeType.UPGRADE

    /**
     * Check if this was a downgrade.
     */
    fun isDowngrade(): Boolean = changeType == PlanChangeType.DOWNGRADE

    /**
     * Check if this change was immediate (with proration).
     */
    fun wasImmediate(): Boolean = prorationMode == ProrationMode.PRORATE_IMMEDIATELY

    /**
     * Check if this change was scheduled for end of period.
     */
    fun wasScheduled(): Boolean = prorationMode == ProrationMode.END_OF_PERIOD

    /**
     * Check if member initiated this change.
     */
    fun wasMemberInitiated(): Boolean = initiatedByMember

    /**
     * Link invoice to this change.
     */
    fun linkInvoice(invoiceId: UUID) {
        this.invoiceId = invoiceId
    }

    /**
     * Link wallet transaction to this change.
     */
    fun linkWalletTransaction(transactionId: UUID) {
        this.walletTransactionId = transactionId
    }
}
