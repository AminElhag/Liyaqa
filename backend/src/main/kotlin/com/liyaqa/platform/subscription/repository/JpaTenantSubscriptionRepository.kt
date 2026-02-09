package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.model.TenantSubscription
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataTenantSubscriptionRepository : JpaRepository<TenantSubscription, UUID> {
    fun findByTenantId(tenantId: UUID): Optional<TenantSubscription>
    fun findByStatus(status: SubscriptionStatus): List<TenantSubscription>
    fun findByStatusAndCurrentPeriodEndBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
    fun findByStatusAndTrialEndsAtBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
    fun findByStatusAndTrialEndsAtBetween(status: SubscriptionStatus, from: LocalDate, to: LocalDate): List<TenantSubscription>
    fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<SubscriptionStatus>): Boolean
    fun findByStatusAndNextBillingDateLessThanEqual(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription>
}

@Repository
class JpaTenantSubscriptionRepository(
    private val springDataRepository: SpringDataTenantSubscriptionRepository
) : TenantSubscriptionRepository {

    override fun save(sub: TenantSubscription): TenantSubscription =
        springDataRepository.save(sub)

    override fun findById(id: UUID): Optional<TenantSubscription> =
        springDataRepository.findById(id)

    override fun findByTenantId(tenantId: UUID): Optional<TenantSubscription> =
        springDataRepository.findByTenantId(tenantId)

    override fun findByStatus(status: SubscriptionStatus): List<TenantSubscription> =
        springDataRepository.findByStatus(status)

    override fun findByStatusAndCurrentPeriodEndBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription> =
        springDataRepository.findByStatusAndCurrentPeriodEndBefore(status, date)

    override fun findByStatusAndTrialEndsAtBefore(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription> =
        springDataRepository.findByStatusAndTrialEndsAtBefore(status, date)

    override fun findByStatusAndTrialEndsAtBetween(status: SubscriptionStatus, from: LocalDate, to: LocalDate): List<TenantSubscription> =
        springDataRepository.findByStatusAndTrialEndsAtBetween(status, from, to)

    override fun existsByTenantIdAndStatusIn(tenantId: UUID, statuses: List<SubscriptionStatus>): Boolean =
        springDataRepository.existsByTenantIdAndStatusIn(tenantId, statuses)

    override fun findByStatusAndNextBillingDateLessThanEqual(status: SubscriptionStatus, date: LocalDate): List<TenantSubscription> =
        springDataRepository.findByStatusAndNextBillingDateLessThanEqual(status, date)
}
