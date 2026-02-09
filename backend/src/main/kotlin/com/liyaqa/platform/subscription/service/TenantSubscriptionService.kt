package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.CancelSubscriptionCommand
import com.liyaqa.platform.subscription.dto.ChangePlanCommand
import com.liyaqa.platform.subscription.dto.CreateSubscriptionCommand
import com.liyaqa.platform.subscription.exception.ActiveSubscriptionExistsException
import com.liyaqa.platform.subscription.exception.InvalidSubscriptionStateException
import com.liyaqa.platform.subscription.exception.SubscriptionPlanNotFoundException
import com.liyaqa.platform.subscription.exception.TenantSubscriptionNotFoundException
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import com.liyaqa.platform.events.model.PlatformEvent
import com.liyaqa.platform.tenant.repository.TenantRepository
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional
class TenantSubscriptionService(
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val subscriptionInvoiceService: SubscriptionInvoiceService,
    private val tenantRepository: TenantRepository,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(TenantSubscriptionService::class.java)

    fun subscribe(cmd: CreateSubscriptionCommand): TenantSubscription {
        val activeStatuses = listOf(SubscriptionStatus.TRIAL, SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)
        if (tenantSubscriptionRepository.existsByTenantIdAndStatusIn(cmd.tenantId, activeStatuses)) {
            throw ActiveSubscriptionExistsException(cmd.tenantId)
        }

        val plan = subscriptionPlanRepository.findById(cmd.planId)
            .orElseThrow { SubscriptionPlanNotFoundException(cmd.planId) }
        require(plan.isActive) { "Cannot subscribe to inactive plan: ${plan.name}" }

        val subscription = if (cmd.startTrial) {
            TenantSubscription.createTrial(cmd.tenantId, cmd.planId, cmd.billingCycle, cmd.trialDays)
        } else {
            TenantSubscription.createActive(cmd.tenantId, cmd.planId, cmd.billingCycle)
        }

        val tenant = tenantRepository.findById(cmd.tenantId).orElse(null)
        if (tenant != null) {
            tenant.subscriptionPlanId = cmd.planId
            tenantRepository.save(tenant)
        }

        log.info("Created {} subscription for tenant {} on plan {}", subscription.status, cmd.tenantId, plan.name)
        val saved = tenantSubscriptionRepository.save(subscription)

        eventPublisher.publishEvent(PlatformEvent.SubscriptionCreated(
            tenantId = cmd.tenantId,
            subscriptionId = saved.id,
            planId = cmd.planId,
            status = saved.status.name
        ))

        return saved
    }

    fun changePlan(tenantId: UUID, cmd: ChangePlanCommand): TenantSubscription {
        val subscription = tenantSubscriptionRepository.findByTenantId(tenantId)
            .orElseThrow { TenantSubscriptionNotFoundException(tenantId) }

        if (subscription.status != SubscriptionStatus.ACTIVE) {
            throw InvalidSubscriptionStateException(subscription.status, "CHANGE_PLAN")
        }

        val currentPlan = subscriptionPlanRepository.findById(subscription.planId)
            .orElseThrow { SubscriptionPlanNotFoundException(subscription.planId) }
        val newPlan = subscriptionPlanRepository.findById(cmd.newPlanId)
            .orElseThrow { SubscriptionPlanNotFoundException(cmd.newPlanId) }

        val currentPrice = getPriceForCycle(currentPlan.monthlyPriceAmount, currentPlan.annualPriceAmount, subscription.billingCycle)
        val newPrice = getPriceForCycle(newPlan.monthlyPriceAmount, newPlan.annualPriceAmount, subscription.billingCycle)

        if (newPrice > currentPrice) {
            // Upgrade: immediate switch + prorated invoice
            val today = LocalDate.now()
            val daysRemaining = ChronoUnit.DAYS.between(today, subscription.currentPeriodEnd)
            val totalDaysInPeriod = ChronoUnit.DAYS.between(subscription.currentPeriodStart, subscription.currentPeriodEnd)
            val priceDifference = newPrice.subtract(currentPrice)
            val proratedAmount = if (totalDaysInPeriod > 0) {
                priceDifference.multiply(BigDecimal(daysRemaining))
                    .divide(BigDecimal(totalDaysInPeriod), 2, RoundingMode.HALF_UP)
            } else {
                priceDifference
            }

            subscription.changePlan(cmd.newPlanId)

            if (proratedAmount > BigDecimal.ZERO) {
                subscriptionInvoiceService.generateProratedInvoice(
                    tenantId = tenantId,
                    subscriptionId = subscription.id,
                    proratedAmount = proratedAmount,
                    description = "Plan upgrade: ${currentPlan.name} -> ${newPlan.name} (prorated)"
                )
            }
        } else {
            // Downgrade: apply immediately (could be deferred to period end in future)
            subscription.changePlan(cmd.newPlanId)
        }

        val tenant = tenantRepository.findById(tenantId).orElse(null)
        if (tenant != null) {
            tenant.subscriptionPlanId = cmd.newPlanId
            tenantRepository.save(tenant)
        }

        log.info("Changed plan for tenant {} from {} to {}", tenantId, currentPlan.name, newPlan.name)
        val saved = tenantSubscriptionRepository.save(subscription)

        eventPublisher.publishEvent(PlatformEvent.SubscriptionPlanChanged(
            tenantId = tenantId,
            subscriptionId = subscription.id,
            oldPlanId = currentPlan.id,
            newPlanId = cmd.newPlanId
        ))

        return saved
    }

    fun cancel(tenantId: UUID, cmd: CancelSubscriptionCommand): TenantSubscription {
        val subscription = tenantSubscriptionRepository.findByTenantId(tenantId)
            .orElseThrow { TenantSubscriptionNotFoundException(tenantId) }
        subscription.cancel(cmd.reason)
        log.info("Cancelled subscription for tenant {}: {}", tenantId, cmd.reason)
        val saved = tenantSubscriptionRepository.save(subscription)

        eventPublisher.publishEvent(PlatformEvent.SubscriptionCancelled(
            tenantId = tenantId,
            subscriptionId = subscription.id,
            reason = cmd.reason
        ))

        return saved
    }

    fun renew(tenantId: UUID): TenantSubscription {
        val subscription = tenantSubscriptionRepository.findByTenantId(tenantId)
            .orElseThrow { TenantSubscriptionNotFoundException(tenantId) }

        val newPeriodEnd = when (subscription.billingCycle) {
            SubscriptionBillingCycle.MONTHLY -> subscription.currentPeriodEnd.plusMonths(1)
            SubscriptionBillingCycle.ANNUAL -> subscription.currentPeriodEnd.plusYears(1)
        }
        subscription.renew(newPeriodEnd)

        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        val price = if (plan != null) {
            getPriceForCycle(plan.monthlyPriceAmount, plan.annualPriceAmount, subscription.billingCycle)
        } else {
            BigDecimal.ZERO
        }

        if (price > BigDecimal.ZERO) {
            subscriptionInvoiceService.generateInvoice(
                tenantId = tenantId,
                subscriptionId = subscription.id,
                subtotal = price,
                billingPeriodStart = subscription.currentPeriodStart,
                billingPeriodEnd = subscription.currentPeriodEnd
            )
        }

        log.info("Renewed subscription for tenant {} until {}", tenantId, newPeriodEnd)
        val saved = tenantSubscriptionRepository.save(subscription)

        eventPublisher.publishEvent(PlatformEvent.SubscriptionRenewed(
            tenantId = tenantId,
            subscriptionId = subscription.id,
            newPeriodEnd = newPeriodEnd
        ))

        return saved
    }

    @Transactional(readOnly = true)
    fun getSubscription(tenantId: UUID): TenantSubscription =
        tenantSubscriptionRepository.findByTenantId(tenantId)
            .orElseThrow { TenantSubscriptionNotFoundException(tenantId) }

    @Transactional(readOnly = true)
    fun getExpiringSubscriptions(withinDays: Int): List<TenantSubscription> {
        val now = LocalDate.now()
        val deadline = now.plusDays(withinDays.toLong())
        return tenantSubscriptionRepository.findByStatusAndCurrentPeriodEndBefore(SubscriptionStatus.ACTIVE, deadline)
    }

    private fun getPriceForCycle(
        monthlyPrice: BigDecimal,
        annualPrice: BigDecimal,
        cycle: SubscriptionBillingCycle
    ): BigDecimal = when (cycle) {
        SubscriptionBillingCycle.MONTHLY -> monthlyPrice
        SubscriptionBillingCycle.ANNUAL -> annualPrice
    }
}
