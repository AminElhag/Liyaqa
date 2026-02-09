package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.dto.PlanRevenueResponse
import com.liyaqa.platform.subscription.dto.RevenueMetricsResponse
import com.liyaqa.platform.subscription.model.InvoiceStatus
import com.liyaqa.platform.subscription.model.SubscriptionBillingCycle
import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.SubscriptionInvoiceRepository
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate

@Service
@Transactional(readOnly = true)
class BillingAnalyticsService(
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val invoiceRepository: SubscriptionInvoiceRepository,
    private val subscriptionPlanRepository: SubscriptionPlanRepository
) {

    fun getRevenueMetrics(): RevenueMetricsResponse {
        val activeSubs = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
        val plans = subscriptionPlanRepository.findAll().associateBy { it.id }

        var mrr = BigDecimal.ZERO
        for (sub in activeSubs) {
            val plan = plans[sub.planId] ?: continue
            mrr = mrr.add(
                when (sub.billingCycle) {
                    SubscriptionBillingCycle.MONTHLY -> plan.monthlyPriceAmount
                    SubscriptionBillingCycle.ANNUAL -> plan.annualPriceAmount.divide(BigDecimal("12"), 2, RoundingMode.HALF_UP)
                }
            )
        }

        val arr = mrr.multiply(BigDecimal("12"))

        // Revenue growth: compare current month paid invoices to previous month
        val now = LocalDate.now()
        val currentMonthStart = now.withDayOfMonth(1)
        val previousMonthStart = currentMonthStart.minusMonths(1)

        val currentMonthRevenue = invoiceRepository.sumTotalByStatusAndIssuedAtBetween(
            InvoiceStatus.PAID, currentMonthStart, now
        )
        val previousMonthRevenue = invoiceRepository.sumTotalByStatusAndIssuedAtBetween(
            InvoiceStatus.PAID, previousMonthStart, currentMonthStart.minusDays(1)
        )

        val growthPercent = if (previousMonthRevenue > BigDecimal.ZERO) {
            currentMonthRevenue.subtract(previousMonthRevenue)
                .divide(previousMonthRevenue, 2, RoundingMode.HALF_UP)
                .multiply(BigDecimal("100"))
        } else {
            BigDecimal.ZERO
        }

        val outstanding = getOutstandingAmount()

        return RevenueMetricsResponse(
            mrr = mrr,
            arr = arr,
            mrrGrowthPercent = growthPercent,
            totalOutstanding = outstanding
        )
    }

    fun getRevenueByPlan(): List<PlanRevenueResponse> {
        val activeSubs = tenantSubscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE)
        val plans = subscriptionPlanRepository.findAll().associateBy { it.id }

        return activeSubs
            .groupBy { it.planId }
            .mapNotNull { (planId, subs) ->
                val plan = plans[planId] ?: return@mapNotNull null
                val monthlyRevenue = subs.fold(BigDecimal.ZERO) { acc, sub ->
                    acc.add(
                        when (sub.billingCycle) {
                            SubscriptionBillingCycle.MONTHLY -> plan.monthlyPriceAmount
                            SubscriptionBillingCycle.ANNUAL -> plan.annualPriceAmount.divide(BigDecimal("12"), 2, RoundingMode.HALF_UP)
                        }
                    )
                }
                PlanRevenueResponse(
                    planId = planId,
                    planName = plan.name,
                    tier = plan.tier,
                    activeSubscriptions = subs.size,
                    monthlyRevenue = monthlyRevenue
                )
            }
    }

    fun getOutstandingAmount(): BigDecimal {
        val outstanding = invoiceRepository.findByStatusIn(listOf(InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE))
        return outstanding.fold(BigDecimal.ZERO) { acc, inv -> acc.add(inv.total) }
    }
}
