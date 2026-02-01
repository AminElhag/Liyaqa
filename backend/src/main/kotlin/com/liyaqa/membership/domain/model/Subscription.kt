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
import java.math.BigDecimal
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "subscriptions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Subscription(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "plan_id", nullable = false)
    val planId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: SubscriptionStatus = SubscriptionStatus.ACTIVE,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "auto_renew", nullable = false)
    var autoRenew: Boolean = false,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "paid_amount")),
        AttributeOverride(name = "currency", column = Column(name = "paid_currency"))
    )
    var paidAmount: Money? = null,

    @Column(name = "classes_remaining")
    var classesRemaining: Int? = null,

    @Column(name = "guest_passes_remaining", nullable = false)
    var guestPassesRemaining: Int = 0,

    @Column(name = "freeze_days_remaining", nullable = false)
    var freezeDaysRemaining: Int = 0,

    @Column(name = "frozen_at")
    var frozenAt: LocalDate? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    // ==========================================
    // DISCOUNT FIELDS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type")
    var discountType: DiscountType? = null,

    @Column(name = "discount_value", precision = 10, scale = 2)
    var discountValue: BigDecimal? = null,

    @Column(name = "discount_reason")
    var discountReason: String? = null,

    @Column(name = "discount_applied_by_user_id")
    var discountAppliedByUserId: UUID? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "original_price")),
        AttributeOverride(name = "currency", column = Column(name = "original_currency"))
    )
    var originalPrice: Money? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "final_price")),
        AttributeOverride(name = "currency", column = Column(name = "final_currency"))
    )
    var finalPrice: Money? = null,

    // ==========================================
    // ENHANCED FREEZE TRACKING
    // ==========================================

    @Column(name = "freeze_reason")
    var freezeReason: String? = null,

    @Column(name = "freeze_end_date")
    var freezeEndDate: LocalDate? = null,

    @Column(name = "freeze_document_path")
    var freezeDocumentPath: String? = null,

    @Column(name = "total_freeze_days_used")
    var totalFreezeDaysUsed: Int = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "freeze_type")
    var freezeType: FreezeType? = null,

    // ==========================================
    // NOTES & ATTRIBUTION
    // ==========================================

    @Column(name = "contract_notes", columnDefinition = "TEXT")
    var contractNotes: String? = null,

    @Column(name = "staff_notes", columnDefinition = "TEXT")
    var staffNotes: String? = null,

    @Column(name = "referred_by_member_id")
    var referredByMemberId: UUID? = null,

    @Column(name = "sales_rep_user_id")
    var salesRepUserId: UUID? = null,

    // ==========================================
    // CONTRACT & PLAN CHANGE TRACKING
    // ==========================================

    @Column(name = "contract_id")
    var contractId: UUID? = null,

    @Column(name = "past_due_at")
    var pastDueAt: java.time.Instant? = null,

    @Column(name = "suspended_at")
    var suspendedAt: java.time.Instant? = null,

    @Column(name = "pending_cancellation_at")
    var pendingCancellationAt: java.time.Instant? = null,

    @Column(name = "notice_period_end_date")
    var noticePeriodEndDate: LocalDate? = null,

    @Column(name = "scheduled_plan_change_id")
    var scheduledPlanChangeId: UUID? = null,

    @Column(name = "current_billing_period_start")
    var currentBillingPeriodStart: LocalDate? = null,

    @Column(name = "current_billing_period_end")
    var currentBillingPeriodEnd: LocalDate? = null,

    @Column(name = "cancellation_request_id")
    var cancellationRequestId: UUID? = null,

    @Column(name = "cancellation_effective_date")
    var cancellationEffectiveDate: LocalDate? = null,

    @Column(name = "reactivation_eligible_until")
    var reactivationEligibleUntil: LocalDate? = null

) : BaseEntity(id) {

    /**
     * Checks if the subscription end date has passed.
     */
    fun isExpired(): Boolean = LocalDate.now().isAfter(endDate)

    /**
     * Checks if the subscription is currently active and not expired.
     */
    fun isActive(): Boolean = status == SubscriptionStatus.ACTIVE && !isExpired()

    /**
     * Returns the number of days remaining until expiration.
     * Returns negative number if already expired.
     */
    fun daysRemaining(): Long = ChronoUnit.DAYS.between(LocalDate.now(), endDate)

    /**
     * Freezes the subscription.
     * @throws IllegalStateException if subscription is not active or no freeze days remaining
     */
    fun freeze() {
        require(status == SubscriptionStatus.ACTIVE) { "Only active subscriptions can be frozen" }
        require(freezeDaysRemaining > 0) { "No freeze days remaining" }
        status = SubscriptionStatus.FROZEN
        frozenAt = LocalDate.now()
    }

    /**
     * Unfreezes the subscription and extends the end date by the number of frozen days.
     * @throws IllegalStateException if subscription is not frozen
     */
    fun unfreeze() {
        require(status == SubscriptionStatus.FROZEN) { "Subscription is not frozen" }
        requireNotNull(frozenAt) { "Frozen date is not set" }

        val frozenDays = ChronoUnit.DAYS.between(frozenAt, LocalDate.now()).toInt()
        freezeDaysRemaining = maxOf(0, freezeDaysRemaining - frozenDays)
        endDate = endDate.plusDays(frozenDays.toLong()) // Extend by frozen days
        status = SubscriptionStatus.ACTIVE
        frozenAt = null
    }

    /**
     * Cancels the subscription.
     * @throws IllegalStateException if subscription is already cancelled
     */
    fun cancel() {
        require(status != SubscriptionStatus.CANCELLED) { "Subscription is already cancelled" }
        status = SubscriptionStatus.CANCELLED
    }

    /**
     * Marks the subscription as expired if the end date has passed.
     */
    fun expire() {
        if (isExpired() && status == SubscriptionStatus.ACTIVE) {
            status = SubscriptionStatus.EXPIRED
        }
    }

    /**
     * Renews the subscription with a new end date.
     * @param newEndDate the new expiration date
     * @throws IllegalStateException if subscription cannot be renewed
     */
    fun renew(newEndDate: LocalDate) {
        require(status in listOf(SubscriptionStatus.ACTIVE, SubscriptionStatus.EXPIRED)) {
            "Cannot renew subscription in status: $status"
        }
        endDate = newEndDate
        status = SubscriptionStatus.ACTIVE
    }

    /**
     * Uses one class from the subscription's class allowance.
     * @throws IllegalStateException if no classes remaining
     */
    fun useClass() {
        require(classesRemaining == null || classesRemaining!! > 0) { "No classes remaining" }
        classesRemaining?.let { classesRemaining = it - 1 }
    }

    /**
     * Uses one guest pass from the subscription.
     * @throws IllegalStateException if no guest passes remaining
     */
    fun useGuestPass() {
        require(guestPassesRemaining > 0) { "No guest passes remaining" }
        guestPassesRemaining--
    }

    /**
     * Checks if the subscription has classes remaining (or unlimited).
     */
    fun hasClassesAvailable(): Boolean = classesRemaining == null || classesRemaining!! > 0

    /**
     * Checks if the subscription has guest passes available.
     */
    fun hasGuestPassesAvailable(): Boolean = guestPassesRemaining > 0

    /**
     * Marks the subscription as pending payment.
     */
    fun markPendingPayment() {
        status = SubscriptionStatus.PENDING_PAYMENT
    }

    /**
     * Confirms payment and activates the subscription.
     * @param amount the paid amount
     */
    fun confirmPayment(amount: Money) {
        require(status == SubscriptionStatus.PENDING_PAYMENT) { "Subscription is not pending payment" }
        paidAmount = amount
        status = SubscriptionStatus.ACTIVE
    }

    // ==========================================
    // ENHANCED STATE MACHINE METHODS
    // ==========================================

    /**
     * Mark subscription as past due (payment overdue but still in grace period).
     */
    fun markPastDue() {
        require(status == SubscriptionStatus.ACTIVE) { "Can only mark active subscriptions as past due" }
        status = SubscriptionStatus.PAST_DUE
        pastDueAt = java.time.Instant.now()
    }

    /**
     * Suspend subscription (revoke access after grace period).
     */
    fun suspend() {
        require(status in listOf(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)) {
            "Can only suspend active or past-due subscriptions"
        }
        status = SubscriptionStatus.SUSPENDED
        suspendedAt = java.time.Instant.now()
    }

    /**
     * Reactivate a suspended subscription after payment received.
     */
    fun reactivate() {
        require(status == SubscriptionStatus.SUSPENDED) { "Can only reactivate suspended subscriptions" }
        status = SubscriptionStatus.ACTIVE
        suspendedAt = null
        pastDueAt = null
    }

    /**
     * Request cancellation with notice period.
     */
    fun requestCancellation(noticePeriodEndDate: LocalDate, effectiveDate: LocalDate, requestId: UUID) {
        require(status.canCancel()) { "Cannot cancel subscription in status: $status" }
        status = SubscriptionStatus.PENDING_CANCELLATION
        pendingCancellationAt = java.time.Instant.now()
        this.noticePeriodEndDate = noticePeriodEndDate
        this.cancellationEffectiveDate = effectiveDate
        this.cancellationRequestId = requestId
    }

    /**
     * Complete the cancellation after notice period.
     */
    fun completeCancellation() {
        require(status == SubscriptionStatus.PENDING_CANCELLATION) { "Subscription is not pending cancellation" }
        status = SubscriptionStatus.CANCELLED
        endDate = cancellationEffectiveDate ?: LocalDate.now()
    }

    /**
     * Withdraw cancellation request (member changed their mind).
     */
    fun withdrawCancellation() {
        require(status == SubscriptionStatus.PENDING_CANCELLATION) { "Subscription is not pending cancellation" }
        status = SubscriptionStatus.ACTIVE
        pendingCancellationAt = null
        noticePeriodEndDate = null
        cancellationEffectiveDate = null
        cancellationRequestId = null
    }

    /**
     * Pause subscription (admin-initiated, e.g., gym closure).
     */
    fun pause() {
        require(status == SubscriptionStatus.ACTIVE) { "Can only pause active subscriptions" }
        status = SubscriptionStatus.PAUSED
    }

    /**
     * Unpause subscription.
     */
    fun unpause() {
        require(status == SubscriptionStatus.PAUSED) { "Subscription is not paused" }
        status = SubscriptionStatus.ACTIVE
    }

    /**
     * Set to pending signature (for new contracts).
     */
    fun setPendingSignature() {
        status = SubscriptionStatus.PENDING_SIGNATURE
    }

    /**
     * Activate after signature.
     */
    fun activateAfterSignature() {
        require(status == SubscriptionStatus.PENDING_SIGNATURE) { "Subscription is not pending signature" }
        status = SubscriptionStatus.ACTIVE
    }

    // ==========================================
    // CONTRACT & PLAN CHANGE METHODS
    // ==========================================

    /**
     * Link to a contract.
     */
    fun linkContract(contractId: UUID) {
        this.contractId = contractId
    }

    /**
     * Schedule a plan change.
     */
    fun scheduleChange(scheduledChangeId: UUID) {
        this.scheduledPlanChangeId = scheduledChangeId
    }

    /**
     * Clear scheduled change (after processing or cancellation).
     */
    fun clearScheduledChange() {
        this.scheduledPlanChangeId = null
    }

    /**
     * Update billing period dates.
     */
    fun updateBillingPeriod(start: LocalDate, end: LocalDate) {
        this.currentBillingPeriodStart = start
        this.currentBillingPeriodEnd = end
    }

    /**
     * Change the plan (for upgrades/downgrades).
     */
    fun changePlan(newPlanId: UUID) {
        // Note: This is a simplified version. The actual plan change logic
        // is handled by PlanChangeService which coordinates proration, etc.
        // This method is called after all validations and calculations are done.
        // The planId field should ideally be mutable for this to work.
        // For now, we'll need to create a new subscription or use a different approach.
    }

    /**
     * Check if subscription allows gym access based on current status.
     */
    fun allowsAccess(): Boolean = status.allowsAccess() && !isExpired()

    /**
     * Check if subscription has a pending scheduled change.
     */
    fun hasScheduledChange(): Boolean = scheduledPlanChangeId != null

    /**
     * Check if subscription is in notice period.
     */
    fun isInNoticePeriod(): Boolean = status == SubscriptionStatus.PENDING_CANCELLATION

    /**
     * Check if subscription is past due.
     */
    fun isPastDue(): Boolean = status == SubscriptionStatus.PAST_DUE

    /**
     * Check if subscription is suspended.
     */
    fun isSuspended(): Boolean = status == SubscriptionStatus.SUSPENDED

    /**
     * Check if subscription is eligible for reactivation.
     */
    fun isEligibleForReactivation(): Boolean {
        if (reactivationEligibleUntil == null) return false
        return LocalDate.now() <= reactivationEligibleUntil
    }

    /**
     * Set reactivation window (e.g., 90 days after cancellation).
     */
    fun setReactivationWindow(days: Long) {
        reactivationEligibleUntil = LocalDate.now().plusDays(days)
    }
}