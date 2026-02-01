package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationAwareEntity
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
import java.time.LocalDate
import java.util.UUID

/**
 * TrainerEarnings entity representing financial transactions for trainers.
 *
 * Key features:
 * - Tracks earnings from PT sessions, group classes, bonuses, and commissions
 * - Stores gross amount, deductions, and net amount
 * - Manages payment status lifecycle (pending, approved, paid, disputed)
 * - Links to the session/class that generated the earning
 * - Supports payment tracking with reference numbers
 */
@Entity
@Table(name = "trainer_earnings")
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class TrainerEarnings(
    id: UUID = UUID.randomUUID(),

    /**
     * Reference to the Trainer who earned this amount.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * Type of earning (PT session, group class, bonus, commission).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "earning_type", nullable = false, length = 20)
    var earningType: EarningType,

    /**
     * Reference to the session or class that generated this earning.
     * - For PT_SESSION: references personal_training_sessions.id
     * - For GROUP_CLASS: references class_sessions.id
     * - For BONUS/COMMISSION: may be null
     */
    @Column(name = "session_id")
    var sessionId: UUID? = null,

    /**
     * Date when the earning was generated (typically session/class date).
     */
    @Column(name = "earning_date", nullable = false)
    var earningDate: LocalDate,

    /**
     * Gross earning amount before deductions.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "amount")),
        AttributeOverride(name = "currency", column = Column(name = "currency"))
    )
    var amount: Money,

    /**
     * Total deductions (tax, fees, etc.).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "deduction_amount")),
        AttributeOverride(name = "currency", column = Column(name = "deduction_currency"))
    )
    var deductions: Money? = null,

    /**
     * Net amount after deductions (amount - deductions).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "net_amount")),
        AttributeOverride(name = "currency", column = Column(name = "net_currency"))
    )
    var netAmount: Money,

    /**
     * Current payment status.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: EarningStatus = EarningStatus.PENDING,

    /**
     * Date when payment was processed (null if not yet paid).
     */
    @Column(name = "payment_date")
    var paymentDate: LocalDate? = null,

    /**
     * Payment reference number (bank transfer ref, check number, etc.).
     */
    @Column(name = "payment_reference", length = 100)
    var paymentReference: String? = null,

    /**
     * Additional notes about this earning or payment.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : OrganizationAwareEntity(id) {

    // ========== Domain Methods ==========

    /**
     * Approve the earning for payment.
     */
    fun approve() {
        require(status == EarningStatus.PENDING) {
            "Can only approve PENDING earnings"
        }
        status = EarningStatus.APPROVED
    }

    /**
     * Mark earning as paid with payment details.
     */
    fun markAsPaid(paymentDate: LocalDate, paymentReference: String) {
        require(status == EarningStatus.APPROVED) {
            "Can only mark APPROVED earnings as paid"
        }
        this.status = EarningStatus.PAID
        this.paymentDate = paymentDate
        this.paymentReference = paymentReference
    }

    /**
     * Dispute the earning (requires review).
     */
    fun dispute(reason: String) {
        this.status = EarningStatus.DISPUTED
        this.notes = if (notes != null) {
            "$notes\nDISPUTE: $reason"
        } else {
            "DISPUTE: $reason"
        }
    }

    /**
     * Resolve dispute and set status back to pending or approved.
     */
    fun resolveDispute(approved: Boolean) {
        require(status == EarningStatus.DISPUTED) {
            "Can only resolve DISPUTED earnings"
        }
        status = if (approved) EarningStatus.APPROVED else EarningStatus.PENDING
    }

    // ========== Query Helpers ==========

    /**
     * Check if earning is pending approval.
     */
    fun isPending(): Boolean = status == EarningStatus.PENDING

    /**
     * Check if earning is approved but not yet paid.
     */
    fun isApproved(): Boolean = status == EarningStatus.APPROVED

    /**
     * Check if earning has been paid.
     */
    fun isPaid(): Boolean = status == EarningStatus.PAID

    /**
     * Check if earning is disputed.
     */
    fun isDisputed(): Boolean = status == EarningStatus.DISPUTED

    /**
     * Check if earning can be edited.
     */
    fun canEdit(): Boolean = status == EarningStatus.PENDING || status == EarningStatus.DISPUTED

    /**
     * Check if earning is in a final state (paid).
     */
    fun isFinalState(): Boolean = status == EarningStatus.PAID
}
