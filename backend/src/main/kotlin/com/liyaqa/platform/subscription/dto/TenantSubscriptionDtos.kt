package com.liyaqa.platform.subscription.dto

import com.liyaqa.platform.subscription.model.PlanTier
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionPlan
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.tenant.model.Tenant
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// --- Commands ---

data class CreateSubscriptionCommand(
    val tenantId: UUID,
    val planId: UUID,
    val billingCycle: SubscriptionBillingCycle,
    val startTrial: Boolean = true,
    val trialDays: Int = 14
)

data class ChangePlanCommand(
    val newPlanId: UUID
)

data class CancelSubscriptionCommand(
    val reason: String
)

// --- Requests ---

data class CreateSubscriptionRequest(
    val planId: UUID,
    val billingCycle: SubscriptionBillingCycle,
    val startTrial: Boolean = true,
    val trialDays: Int = 14
) {
    fun toCommand(tenantId: UUID) = CreateSubscriptionCommand(
        tenantId = tenantId,
        planId = planId,
        billingCycle = billingCycle,
        startTrial = startTrial,
        trialDays = trialDays
    )
}

data class ChangePlanRequest(
    val newPlanId: UUID
) {
    fun toCommand() = ChangePlanCommand(newPlanId = newPlanId)
}

data class CancelSubscriptionRequest(
    val reason: String
) {
    fun toCommand() = CancelSubscriptionCommand(reason = reason)
}

// --- Responses ---

data class TenantSubscriptionResponse(
    val id: UUID,
    val tenantId: UUID,
    val planId: UUID,
    val planName: String?,
    val tier: PlanTier?,
    val billingCycle: SubscriptionBillingCycle,
    val status: SubscriptionStatus,
    val startDate: LocalDate,
    val currentPeriodStart: LocalDate,
    val currentPeriodEnd: LocalDate,
    val nextBillingDate: LocalDate?,
    val cancelledAt: Instant?,
    val cancellationReason: String?,
    val autoRenew: Boolean,
    val trialEndsAt: LocalDate?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(sub: TenantSubscription, plan: SubscriptionPlan? = null) = TenantSubscriptionResponse(
            id = sub.id,
            tenantId = sub.tenantId,
            planId = sub.planId,
            planName = plan?.name,
            tier = plan?.tier,
            billingCycle = sub.billingCycle,
            status = sub.status,
            startDate = sub.startDate,
            currentPeriodStart = sub.currentPeriodStart,
            currentPeriodEnd = sub.currentPeriodEnd,
            nextBillingDate = sub.nextBillingDate,
            cancelledAt = sub.cancelledAt,
            cancellationReason = sub.cancellationReason,
            autoRenew = sub.autoRenew,
            trialEndsAt = sub.trialEndsAt,
            createdAt = sub.createdAt,
            updatedAt = sub.updatedAt
        )
    }
}

data class ExpiringSubscriptionResponse(
    val id: UUID,
    val tenantId: UUID,
    val facilityName: String,
    val planName: String?,
    val status: SubscriptionStatus,
    val expiresAt: LocalDate,
    val daysRemaining: Long
) {
    companion object {
        fun from(sub: TenantSubscription, tenant: Tenant, plan: SubscriptionPlan?) = ExpiringSubscriptionResponse(
            id = sub.id,
            tenantId = sub.tenantId,
            facilityName = tenant.facilityName,
            planName = plan?.name,
            status = sub.status,
            expiresAt = sub.currentPeriodEnd,
            daysRemaining = sub.getRemainingDays()
        )
    }
}
