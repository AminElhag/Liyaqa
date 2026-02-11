package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a client's subscription to a Liyaqa platform plan.
 * Links an Organization to a ClientPlan with specific terms.
 *
 * This is a platform-level entity that tracks B2B subscription relationships.
 * Each organization has one active subscription at a time.
 */
@Entity
@Table(name = "client_subscriptions")
class ClientSubscription(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization (client) this subscription belongs to.
     */
    @Column(name = "organization_id", nullable = false)
    var organizationId: UUID,

    /**
     * The plan this subscription is for.
     */
    @Column(name = "client_plan_id", nullable = false)
    var clientPlanId: UUID,

    /**
     * Reference to the ClientPlan entity.
     * Lazy loaded to avoid N+1 queries.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_plan_id", insertable = false, updatable = false)
    var clientPlan: ClientPlan? = null,

    /**
     * Current status of the subscription.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClientSubscriptionStatus = ClientSubscriptionStatus.TRIAL,

    /**
     * Subscription start date.
     */
    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    /**
     * Subscription end date.
     */
    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    /**
     * Trial period end date (null if no trial).
     */
    @Column(name = "trial_ends_at")
    var trialEndsAt: LocalDate? = null,

    /**
     * Negotiated price (may differ from plan list price).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "agreed_price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "agreed_price_currency", nullable = false))
    )
    var agreedPrice: Money,

    /**
     * Discount percentage applied (0-100).
     */
    @Column(name = "discount_percentage")
    var discountPercentage: BigDecimal? = null,

    /**
     * Contract length in months.
     */
    @Column(name = "contract_months", nullable = false)
    var contractMonths: Int = 12,

    /**
     * Billing cycle for this subscription.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false)
    var billingCycle: BillingCycle = BillingCycle.MONTHLY,

    /**
     * Whether to automatically renew at end of contract.
     */
    @Column(name = "auto_renew", nullable = false)
    var autoRenew: Boolean = true,

    /**
     * Sales rep who closed this subscription.
     */
    @Column(name = "sales_rep_id")
    var salesRepId: UUID? = null,

    /**
     * Deal that led to this subscription (if any).
     */
    @Column(name = "deal_id")
    var dealId: UUID? = null,

    /**
     * Internal notes about this subscription.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null

) : OrganizationLevelEntity(id) {

    // ============================================
    // Domain Methods - Status Transitions
    // ============================================

    /**
     * Activates the subscription (e.g., after payment or trial conversion).
     */
    fun activate() {
        require(status in listOf(ClientSubscriptionStatus.TRIAL, ClientSubscriptionStatus.SUSPENDED)) {
            "Can only activate from TRIAL or SUSPENDED status, current: $status"
        }
        status = ClientSubscriptionStatus.ACTIVE
        // Clear trial end date if converting from trial
        if (trialEndsAt != null) {
            trialEndsAt = null
        }
    }

    /**
     * Suspends the subscription (e.g., due to non-payment).
     */
    fun suspend() {
        require(status in listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)) {
            "Can only suspend from ACTIVE or TRIAL status, current: $status"
        }
        status = ClientSubscriptionStatus.SUSPENDED
    }

    /**
     * Cancels the subscription.
     */
    fun cancel() {
        require(status != ClientSubscriptionStatus.CANCELLED) {
            "Subscription is already cancelled"
        }
        status = ClientSubscriptionStatus.CANCELLED
    }

    /**
     * Expires the subscription (called by scheduled job).
     */
    fun expire() {
        require(status in listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)) {
            "Can only expire from ACTIVE or TRIAL status, current: $status"
        }
        status = ClientSubscriptionStatus.EXPIRED
    }

    /**
     * Renews the subscription for another contract period.
     */
    fun renew(newEndDate: LocalDate, newAgreedPrice: Money? = null) {
        require(status in listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.SUSPENDED, ClientSubscriptionStatus.EXPIRED)) {
            "Can only renew from ACTIVE, SUSPENDED, or EXPIRED status, current: $status"
        }
        require(newEndDate.isAfter(endDate)) {
            "New end date must be after current end date"
        }

        startDate = endDate.plusDays(1)
        endDate = newEndDate
        status = ClientSubscriptionStatus.ACTIVE

        newAgreedPrice?.let { agreedPrice = it }
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Checks if the subscription is currently active.
     */
    fun isActive(): Boolean = status == ClientSubscriptionStatus.ACTIVE

    /**
     * Checks if the subscription is in trial period.
     */
    fun isInTrial(): Boolean = status == ClientSubscriptionStatus.TRIAL

    /**
     * Checks if the trial has expired.
     */
    fun isTrialExpired(): Boolean {
        return trialEndsAt != null && LocalDate.now().isAfter(trialEndsAt)
    }

    /**
     * Checks if the subscription is expired or about to expire.
     */
    fun isExpired(): Boolean = endDate.isBefore(LocalDate.now())

    /**
     * Checks if the subscription is expiring within the given days.
     */
    fun isExpiringWithin(days: Int): Boolean {
        val expiryThreshold = LocalDate.now().plusDays(days.toLong())
        return endDate.isAfter(LocalDate.now()) && endDate.isBefore(expiryThreshold)
    }

    /**
     * Gets the remaining days of the subscription.
     */
    fun getRemainingDays(): Long {
        val today = LocalDate.now()
        return if (endDate.isAfter(today)) {
            java.time.temporal.ChronoUnit.DAYS.between(today, endDate)
        } else {
            0
        }
    }

    /**
     * Gets the remaining trial days.
     */
    fun getRemainingTrialDays(): Long? {
        if (trialEndsAt == null) return null
        val today = LocalDate.now()
        return if (trialEndsAt!!.isAfter(today)) {
            java.time.temporal.ChronoUnit.DAYS.between(today, trialEndsAt)
        } else {
            0
        }
    }

    /**
     * Calculates the effective monthly price considering discounts.
     */
    fun getEffectiveMonthlyPrice(): Money {
        return when (billingCycle) {
            BillingCycle.MONTHLY -> agreedPrice
            BillingCycle.QUARTERLY -> Money.of(
                agreedPrice.amount.divide(3.toBigDecimal(), 2, java.math.RoundingMode.HALF_UP),
                agreedPrice.currency
            )
            BillingCycle.ANNUAL -> Money.of(
                agreedPrice.amount.divide(12.toBigDecimal(), 2, java.math.RoundingMode.HALF_UP),
                agreedPrice.currency
            )
        }
    }

    /**
     * Updates the plan for this subscription.
     * Used for upgrades/downgrades.
     */
    fun changePlan(newPlanId: UUID, newAgreedPrice: Money, newContractMonths: Int? = null) {
        require(status == ClientSubscriptionStatus.ACTIVE) {
            "Can only change plan for active subscriptions"
        }
        clientPlanId = newPlanId
        agreedPrice = newAgreedPrice
        newContractMonths?.let { contractMonths = it }
    }

    /**
     * Applies a discount to the subscription.
     */
    fun applyDiscount(percentage: BigDecimal) {
        require(percentage >= BigDecimal.ZERO && percentage <= BigDecimal(100)) {
            "Discount percentage must be between 0 and 100"
        }
        discountPercentage = percentage

        // Recalculate agreed price with discount
        val discount = agreedPrice.amount.multiply(percentage).divide(BigDecimal(100), 2, java.math.RoundingMode.HALF_UP)
        agreedPrice = Money.of(agreedPrice.amount.subtract(discount), agreedPrice.currency)
    }

    companion object {
        /**
         * Creates a new trial subscription.
         */
        fun createTrial(
            organizationId: UUID,
            clientPlanId: UUID,
            trialDays: Int = 14,
            agreedPrice: Money,
            billingCycle: BillingCycle = BillingCycle.MONTHLY,
            salesRepId: UUID? = null,
            dealId: UUID? = null
        ): ClientSubscription {
            val today = LocalDate.now()
            return ClientSubscription(
                organizationId = organizationId,
                clientPlanId = clientPlanId,
                status = ClientSubscriptionStatus.TRIAL,
                startDate = today,
                endDate = today.plusMonths(12), // Default 12-month contract
                trialEndsAt = today.plusDays(trialDays.toLong()),
                agreedPrice = agreedPrice,
                billingCycle = billingCycle,
                salesRepId = salesRepId,
                dealId = dealId
            )
        }

        /**
         * Creates a new active subscription (no trial).
         */
        fun createActive(
            organizationId: UUID,
            clientPlanId: UUID,
            contractMonths: Int = 12,
            agreedPrice: Money,
            billingCycle: BillingCycle = BillingCycle.MONTHLY,
            salesRepId: UUID? = null,
            dealId: UUID? = null
        ): ClientSubscription {
            val today = LocalDate.now()
            return ClientSubscription(
                organizationId = organizationId,
                clientPlanId = clientPlanId,
                status = ClientSubscriptionStatus.ACTIVE,
                startDate = today,
                endDate = today.plusMonths(contractMonths.toLong()),
                contractMonths = contractMonths,
                agreedPrice = agreedPrice,
                billingCycle = billingCycle,
                salesRepId = salesRepId,
                dealId = dealId
            )
        }
    }
}
