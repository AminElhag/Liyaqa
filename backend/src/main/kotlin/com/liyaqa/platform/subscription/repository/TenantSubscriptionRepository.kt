package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface TenantSubscriptionRepository {
    fun save(sub: TenantSubscription): TenantSubscription
    fun findById(id: UUID): Optional<TenantSubscription>
    fun findByTenantId(tenantId: UUID): Optional<TenantSubscription>
    fun findByStatus(status: SubscriptionStatus): List<TenantSubscription>
    fun findByStatusAndCurrentPeriodEndBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
    fun findByStatusAndTrialEndsAtBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
    fun findByStatusAndTrialEndsAtBetween(status: SubscriptionStatus, from: LocalDate, to: LocalDate): List<TenantSubscription>
    fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<SubscriptionStatus>): Boolean
    fun findByStatusAndNextBillingDateLessThanEqual(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
}
