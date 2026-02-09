package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "tenant_subscriptions")
class TenantSubscription(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "plan_id", nullable = false)
    var planId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false)
    var billingCycle: SubscriptionBillingCycle,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: SubscriptionStatus = SubscriptionStatus.TRIAL,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate = LocalDate.now(),

    @Column(name = "current_period_start", nullable = false)
    var currentPeriodStart: LocalDate = LocalDate.now(),

    @Column(name = "current_period_end", nullable = false)
    var currentPeriodEnd: LocalDate,

    @Column(name = "next_billing_date")
    var nextBillingDate: LocalDate? = null,

    @Column(name = "cancelled_at")
    var cancelledAt: Instant? = null,

    @Column(name = "cancellation_reason")
    var cancellationReason: String? = null,

    @Column(name = "auto_renew", nullable = false)
    var autoRenew: Boolean = true,

    @Column(name = "trial_ends_at")
    var trialEndsAt: LocalDate? = null

) : OrganizationLevelEntity(id) {

    fun activate() {
        require(status == SubscriptionStatus.TRIAL || status == SubscriptionStatus.PAST_DUE) {
            "Cannot activate subscription in status: $status"
        }
        status = SubscriptionStatus.ACTIVE
        trialEndsAt = null
    }

    fun cancel(reason: String) {
        require(status != SubscriptionStatus.CANCELLED) {
            "Subscription is already cancelled"
        }
        status = SubscriptionStatus.CANCELLED
        cancelledAt = Instant.now()
        cancellationReason = reason
        autoRenew = false
    }

    fun markPastDue() {
        require(status == SubscriptionStatus.ACTIVE) {
            "Cannot mark past due from status: $status"
        }
        status = SubscriptionStatus.PAST_DUE
    }

    fun expire() {
        require(status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.TRIAL) {
            "Cannot expire subscription in status: $status"
        }
        status = SubscriptionStatus.EXPIRED
    }

    fun renew(newPeriodEnd: LocalDate) {
        require(status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.EXPIRED) {
            "Cannot renew subscription in status: $status"
        }
        currentPeriodStart = currentPeriodEnd
        currentPeriodEnd = newPeriodEnd
        nextBillingDate = newPeriodEnd
        status = SubscriptionStatus.ACTIVE
    }

    fun changePlan(newPlanId: UUID) {
        require(status == SubscriptionStatus.ACTIVE) {
            "Can only change plan for active subscriptions"
        }
        planId = newPlanId
    }

    fun isTrialExpired(): Boolean =
        status == SubscriptionStatus.TRIAL && trialEndsAt != null && !LocalDate.now().isBefore(trialEndsAt)

    fun isExpiringWithin(days: Int): Boolean {
        val deadline = LocalDate.now().plusDays(days.toLong())
        return currentPeriodEnd.isBefore(deadline) || currentPeriodEnd.isEqual(deadline)
    }

    fun getRemainingDays(): Long =
        ChronoUnit.DAYS.between(LocalDate.now(), currentPeriodEnd).coerceAtLeast(0)

    companion object {
        fun createTrial(
            tenantId: UUID,
            planId: UUID,
            billingCycle: SubscriptionBillingCycle,
            trialDays: Int = 14
        ): TenantSubscription {
            val now = LocalDate.now()
            val trialEnd = now.plusDays(trialDays.toLong())
            return TenantSubscription(
                tenantId = tenantId,
                planId = planId,
                billingCycle = billingCycle,
                status = SubscriptionStatus.TRIAL,
                startDate = now,
                currentPeriodStart = now,
                currentPeriodEnd = trialEnd,
                nextBillingDate = trialEnd,
                trialEndsAt = trialEnd
            )
        }

        fun createActive(
            tenantId: UUID,
            planId: UUID,
            billingCycle: SubscriptionBillingCycle
        ): TenantSubscription {
            val now = LocalDate.now()
            val periodEnd = when (billingCycle) {
                SubscriptionBillingCycle.MONTHLY -> now.plusMonths(1)
                SubscriptionBillingCycle.ANNUAL -> now.plusYears(1)
            }
            return TenantSubscription(
                tenantId = tenantId,
                planId = planId,
                billingCycle = billingCycle,
                status = SubscriptionStatus.ACTIVE,
                startDate = now,
                currentPeriodStart = now,
                currentPeriodEnd = periodEnd,
                nextBillingDate = periodEnd
            )
        }
    }
}
