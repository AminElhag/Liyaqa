package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.TaxableFee
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
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

/**
 * Membership contract with commitment terms, locked pricing, and signature tracking.
 * Implements Saudi cooling-off period compliance (7 days).
 */
@Entity
@Table(name = "membership_contracts")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MembershipContract(
    id: UUID = UUID.randomUUID(),

    @Column(name = "contract_number", nullable = false, unique = true)
    val contractNumber: String,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "plan_id", nullable = false)
    val planId: UUID,

    @Column(name = "subscription_id")
    var subscriptionId: UUID? = null,

    @Column(name = "category_id")
    var categoryId: UUID? = null,

    // ==========================================
    // CONTRACT TYPE AND TERMS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false)
    var contractType: ContractType,

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_term", nullable = false)
    var contractTerm: ContractTerm,

    @Column(name = "commitment_months", nullable = false)
    var commitmentMonths: Int = 0,

    @Column(name = "notice_period_days", nullable = false)
    var noticePeriodDays: Int = 30,

    // ==========================================
    // CONTRACT DATES
    // ==========================================

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "commitment_end_date")
    var commitmentEndDate: LocalDate? = null,

    @Column(name = "effective_end_date")
    var effectiveEndDate: LocalDate? = null,

    // ==========================================
    // LOCKED PRICING (Snapshot at signing)
    // ==========================================

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "locked_membership_fee_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "locked_membership_fee_currency", nullable = false)),
        AttributeOverride(name = "taxRate", column = Column(name = "locked_membership_fee_tax_rate", nullable = false))
    )
    var lockedMembershipFee: TaxableFee,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "locked_admin_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "locked_admin_fee_currency")),
        AttributeOverride(name = "taxRate", column = Column(name = "locked_admin_fee_tax_rate"))
    )
    var lockedAdminFee: TaxableFee = TaxableFee(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "locked_join_fee_amount")),
        AttributeOverride(name = "currency", column = Column(name = "locked_join_fee_currency")),
        AttributeOverride(name = "taxRate", column = Column(name = "locked_join_fee_tax_rate"))
    )
    var lockedJoinFee: TaxableFee = TaxableFee(),

    // ==========================================
    // EARLY TERMINATION
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "early_termination_fee_type")
    var earlyTerminationFeeType: TerminationFeeType = TerminationFeeType.REMAINING_MONTHS,

    @Column(name = "early_termination_fee_value", precision = 19, scale = 4)
    var earlyTerminationFeeValue: BigDecimal? = null,

    // ==========================================
    // COOLING-OFF (Saudi regulation)
    // ==========================================

    @Column(name = "cooling_off_days", nullable = false)
    var coolingOffDays: Int = 7,

    @Column(name = "cooling_off_end_date", nullable = false)
    var coolingOffEndDate: LocalDate,

    // ==========================================
    // STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ContractStatus = ContractStatus.PENDING_SIGNATURE,

    // ==========================================
    // SIGNATURES
    // ==========================================

    @Column(name = "member_signed_at")
    var memberSignedAt: Instant? = null,

    @Column(name = "member_signature_data", columnDefinition = "TEXT")
    var memberSignatureData: String? = null,

    @Column(name = "staff_approved_by")
    var staffApprovedBy: UUID? = null,

    @Column(name = "staff_approved_at")
    var staffApprovedAt: Instant? = null,

    // ==========================================
    // CANCELLATION DETAILS
    // ==========================================

    @Column(name = "cancellation_requested_at")
    var cancellationRequestedAt: LocalDate? = null,

    @Column(name = "cancellation_effective_date")
    var cancellationEffectiveDate: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "cancellation_type")
    var cancellationType: CancellationType? = null,

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    var cancellationReason: String? = null

) : BaseEntity(id) {

    // ==========================================
    // SIGNATURE METHODS
    // ==========================================

    /**
     * Record member's digital signature.
     */
    fun signByMember(signatureData: String) {
        require(status == ContractStatus.PENDING_SIGNATURE) {
            "Contract is not pending signature"
        }
        memberSignedAt = Instant.now()
        memberSignatureData = signatureData
        status = ContractStatus.ACTIVE
    }

    /**
     * Record staff approval.
     */
    fun approveByStaff(staffUserId: UUID) {
        staffApprovedBy = staffUserId
        staffApprovedAt = Instant.now()
    }

    /**
     * Check if contract is signed.
     */
    fun isSigned(): Boolean = memberSignedAt != null

    // ==========================================
    // COOLING-OFF METHODS
    // ==========================================

    /**
     * Check if we're still within the cooling-off period.
     */
    fun isWithinCoolingOff(): Boolean {
        return LocalDate.now() <= coolingOffEndDate
    }

    /**
     * Calculate days remaining in cooling-off period.
     */
    fun coolingOffDaysRemaining(): Long {
        val today = LocalDate.now()
        return if (today.isAfter(coolingOffEndDate)) 0
        else ChronoUnit.DAYS.between(today, coolingOffEndDate) + 1
    }

    /**
     * Cancel within cooling-off period (full refund, no penalties).
     */
    fun cancelWithinCoolingOff(reason: String? = null) {
        require(isWithinCoolingOff()) { "Cooling-off period has expired" }
        status = ContractStatus.VOIDED
        cancellationType = CancellationType.COOLING_OFF
        cancellationRequestedAt = LocalDate.now()
        cancellationEffectiveDate = LocalDate.now()
        cancellationReason = reason
    }

    // ==========================================
    // COMMITMENT METHODS
    // ==========================================

    /**
     * Check if we're still within the commitment period.
     */
    fun isWithinCommitment(): Boolean {
        return commitmentEndDate != null && LocalDate.now().isBefore(commitmentEndDate)
    }

    /**
     * Calculate months remaining in commitment.
     */
    fun commitmentMonthsRemaining(): Int {
        if (commitmentEndDate == null) return 0
        val today = LocalDate.now()
        if (today.isAfter(commitmentEndDate)) return 0
        return ChronoUnit.MONTHS.between(today, commitmentEndDate).toInt().coerceAtLeast(0)
    }

    /**
     * Calculate the early termination fee based on configured fee type.
     */
    fun calculateEarlyTerminationFee(): BigDecimal {
        if (!isWithinCommitment()) return BigDecimal.ZERO

        return when (earlyTerminationFeeType) {
            TerminationFeeType.NONE -> BigDecimal.ZERO

            TerminationFeeType.FLAT_FEE -> earlyTerminationFeeValue ?: BigDecimal.ZERO

            TerminationFeeType.REMAINING_MONTHS -> {
                val monthlyFee = lockedMembershipFee.getGrossAmount().amount
                val remainingMonths = commitmentMonthsRemaining()
                monthlyFee.multiply(BigDecimal(remainingMonths))
            }

            TerminationFeeType.PERCENTAGE -> {
                val monthlyFee = lockedMembershipFee.getGrossAmount().amount
                val remainingMonths = commitmentMonthsRemaining()
                val remainingValue = monthlyFee.multiply(BigDecimal(remainingMonths))
                val percentage = earlyTerminationFeeValue ?: BigDecimal.ZERO
                remainingValue.multiply(percentage).divide(BigDecimal(100))
            }
        }
    }

    // ==========================================
    // CANCELLATION METHODS
    // ==========================================

    /**
     * Request cancellation with notice period.
     */
    fun requestCancellation(cancellationType: CancellationType, reason: String? = null) {
        require(status == ContractStatus.ACTIVE) { "Contract is not active" }

        this.cancellationRequestedAt = LocalDate.now()
        this.cancellationType = cancellationType
        this.cancellationReason = reason

        // Calculate effective date based on notice period
        this.cancellationEffectiveDate = LocalDate.now().plusDays(noticePeriodDays.toLong())

        // Update status
        this.status = ContractStatus.IN_NOTICE_PERIOD
    }

    /**
     * Complete the cancellation after notice period.
     */
    fun completeCancellation() {
        require(status == ContractStatus.IN_NOTICE_PERIOD) { "Contract is not in notice period" }
        status = ContractStatus.CANCELLED
        effectiveEndDate = cancellationEffectiveDate ?: LocalDate.now()
    }

    /**
     * Cancel cancellation request (member changed mind).
     */
    fun withdrawCancellationRequest() {
        require(status == ContractStatus.IN_NOTICE_PERIOD) { "Contract is not in notice period" }
        status = ContractStatus.ACTIVE
        cancellationRequestedAt = null
        cancellationEffectiveDate = null
        cancellationType = null
        cancellationReason = null
    }

    /**
     * Suspend contract (e.g., for non-payment).
     */
    fun suspend() {
        require(status == ContractStatus.ACTIVE || status == ContractStatus.IN_NOTICE_PERIOD) {
            "Cannot suspend contract in status: $status"
        }
        status = ContractStatus.SUSPENDED
    }

    /**
     * Reactivate suspended contract.
     */
    fun reactivate() {
        require(status == ContractStatus.SUSPENDED) { "Contract is not suspended" }
        status = ContractStatus.ACTIVE
    }

    /**
     * Expire the contract naturally at end of term.
     */
    fun expire() {
        if (effectiveEndDate != null && LocalDate.now().isAfter(effectiveEndDate)) {
            status = ContractStatus.EXPIRED
        }
    }

    // ==========================================
    // STATUS CHECKS
    // ==========================================

    /**
     * Check if contract is currently active.
     */
    fun isActive(): Boolean = status == ContractStatus.ACTIVE

    /**
     * Check if contract allows gym access.
     */
    fun allowsAccess(): Boolean = status in listOf(
        ContractStatus.ACTIVE,
        ContractStatus.IN_NOTICE_PERIOD
    )

    /**
     * Get the total locked monthly fee (membership + admin).
     */
    fun getLockedMonthlyTotal() = lockedMembershipFee.getGrossAmount() + lockedAdminFee.getGrossAmount()

    /**
     * Link to subscription.
     */
    fun linkSubscription(subscriptionId: UUID) {
        this.subscriptionId = subscriptionId
    }

    companion object {
        const val DEFAULT_COOLING_OFF_DAYS = 7 // Saudi regulation
        const val DEFAULT_NOTICE_PERIOD_DAYS = 30
    }
}
