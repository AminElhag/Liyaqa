package com.liyaqa.membership.domain.ports

import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Subscription entity.
 * Subscriptions are tenant-scoped (belong to a club).
 */
interface SubscriptionRepository {
    fun save(subscription: Subscription): Subscription
    fun findById(id: UUID): Optional<Subscription>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Subscription>
    fun findActiveByMemberId(memberId: UUID): Optional<Subscription>
    fun findByPlanId(planId: UUID, pageable: Pageable): Page<Subscription>
    fun findByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription>
    fun findAll(pageable: Pageable): Page<Subscription>
    fun findExpiringBefore(date: LocalDate, pageable: Pageable): Page<Subscription>
    fun findByStatusAndEndDateBetween(status: SubscriptionStatus, startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<Subscription>
    fun existsById(id: UUID): Boolean
    fun existsActiveByMemberId(memberId: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByMemberId(memberId: UUID): Long

    /**
     * Find pending payment subscriptions for a member.
     * Used by wallet service for auto-payment.
     */
    fun findByMemberIdAndStatus(memberId: UUID, status: SubscriptionStatus): List<Subscription>

    /**
     * Search subscriptions with various filters.
     * @param planId Filter by membership plan
     * @param status Filter by subscription status
     * @param expiringBefore Filter subscriptions expiring before this date
     */
    fun search(
        planId: UUID?,
        status: SubscriptionStatus?,
        expiringBefore: LocalDate?,
        pageable: Pageable
    ): Page<Subscription>

    /**
     * Count churned subscriptions (cancelled or expired) between two dates.
     * Used for churn analysis reports.
     */
    fun countChurnedBetween(startDate: LocalDate, endDate: LocalDate): Long

    /**
     * Get churn statistics grouped by plan.
     * Returns a list of maps with planId, planName, totalMembers, churnedMembers.
     * Used for churn analysis reports.
     */
    fun getChurnByPlan(startDate: LocalDate, endDate: LocalDate): List<Map<String, Any>>

    /**
     * Find subscriptions due for billing within the given date range.
     * Looks for active subscriptions where currentBillingPeriodEnd falls within the range.
     *
     * Used by automated billing job to find subscriptions that need invoices generated.
     *
     * @param fromDate Start of billing window
     * @param toDate End of billing window
     * @return List of subscriptions due for billing
     */
    fun findDueForBilling(fromDate: LocalDate, toDate: LocalDate): List<Subscription>
}