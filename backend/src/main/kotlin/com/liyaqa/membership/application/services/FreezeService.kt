package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.FreezeHistory
import com.liyaqa.membership.domain.model.FreezePackage
import com.liyaqa.membership.domain.model.FreezeSource
import com.liyaqa.membership.domain.model.FreezeType
import com.liyaqa.membership.domain.model.MemberFreezeBalance
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.FreezeHistoryRepository
import com.liyaqa.membership.domain.ports.FreezePackageRepository
import com.liyaqa.membership.domain.ports.MemberFreezeBalanceRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class FreezeService(
    private val freezePackageRepository: FreezePackageRepository,
    private val freezeBalanceRepository: MemberFreezeBalanceRepository,
    private val freezeHistoryRepository: FreezeHistoryRepository,
    private val subscriptionRepository: SubscriptionRepository
) {
    private val logger = LoggerFactory.getLogger(FreezeService::class.java)

    // ==========================================
    // FREEZE PACKAGE MANAGEMENT
    // ==========================================

    fun createFreezePackage(
        name: LocalizedText,
        description: LocalizedText? = null,
        freezeDays: Int,
        price: Money,
        extendsContract: Boolean = true,
        requiresDocumentation: Boolean = false,
        sortOrder: Int = 0
    ): FreezePackage {
        require(freezeDays > 0) { "Freeze days must be positive" }
        require(price.amount >= BigDecimal.ZERO) { "Price cannot be negative" }

        val freezePackage = FreezePackage(
            name = name,
            description = description,
            freezeDays = freezeDays,
            price = price,
            extendsContract = extendsContract,
            requiresDocumentation = requiresDocumentation,
            sortOrder = sortOrder
        )

        return freezePackageRepository.save(freezePackage)
    }

    @Transactional(readOnly = true)
    fun getFreezePackage(id: UUID): FreezePackage {
        return freezePackageRepository.findById(id)
            .orElseThrow { NoSuchElementException("Freeze package not found: $id") }
    }

    @Transactional(readOnly = true)
    fun getAllFreezePackages(pageable: Pageable): Page<FreezePackage> {
        return freezePackageRepository.findAll(pageable)
    }

    @Transactional(readOnly = true)
    fun getActiveFreezePackages(): List<FreezePackage> {
        return freezePackageRepository.findAllActive()
    }

    fun updateFreezePackage(
        id: UUID,
        name: LocalizedText? = null,
        description: LocalizedText? = null,
        freezeDays: Int? = null,
        price: Money? = null,
        extendsContract: Boolean? = null,
        requiresDocumentation: Boolean? = null,
        sortOrder: Int? = null
    ): FreezePackage {
        val freezePackage = getFreezePackage(id)

        name?.let { freezePackage.name = it }
        description?.let { freezePackage.description = it }
        freezeDays?.let {
            require(it > 0) { "Freeze days must be positive" }
            freezePackage.freezeDays = it
        }
        price?.let {
            require(it.amount >= BigDecimal.ZERO) { "Price cannot be negative" }
            freezePackage.price = it
        }
        extendsContract?.let { freezePackage.extendsContract = it }
        requiresDocumentation?.let { freezePackage.requiresDocumentation = it }
        sortOrder?.let { freezePackage.sortOrder = it }

        return freezePackageRepository.save(freezePackage)
    }

    fun activateFreezePackage(id: UUID): FreezePackage {
        val freezePackage = getFreezePackage(id)
        freezePackage.activate()
        return freezePackageRepository.save(freezePackage)
    }

    fun deactivateFreezePackage(id: UUID): FreezePackage {
        val freezePackage = getFreezePackage(id)
        freezePackage.deactivate()
        return freezePackageRepository.save(freezePackage)
    }

    // ==========================================
    // FREEZE BALANCE MANAGEMENT
    // ==========================================

    fun getOrCreateFreezeBalance(memberId: UUID, subscriptionId: UUID): MemberFreezeBalance {
        return freezeBalanceRepository.findBySubscriptionId(subscriptionId)
            .orElseGet {
                val balance = MemberFreezeBalance(
                    memberId = memberId,
                    subscriptionId = subscriptionId
                )
                freezeBalanceRepository.save(balance)
            }
    }

    @Transactional(readOnly = true)
    fun getFreezeBalance(subscriptionId: UUID): MemberFreezeBalance? {
        return freezeBalanceRepository.findBySubscriptionId(subscriptionId).orElse(null)
    }

    @Transactional(readOnly = true)
    fun getMemberFreezeBalances(memberId: UUID): List<MemberFreezeBalance> {
        return freezeBalanceRepository.findByMemberId(memberId)
    }

    /**
     * Purchase freeze days from a package.
     */
    fun purchaseFreezeDays(
        memberId: UUID,
        subscriptionId: UUID,
        freezePackageId: UUID
    ): MemberFreezeBalance {
        val freezePackage = getFreezePackage(freezePackageId)
        require(freezePackage.isActive) { "Freeze package is not active" }

        val balance = getOrCreateFreezeBalance(memberId, subscriptionId)
        balance.addDays(freezePackage.freezeDays, FreezeSource.PURCHASED)

        logger.info("Member $memberId purchased ${freezePackage.freezeDays} freeze days for subscription $subscriptionId")
        return freezeBalanceRepository.save(balance)
    }

    /**
     * Grant freeze days (promotional, compensation, etc.).
     */
    fun grantFreezeDays(
        memberId: UUID,
        subscriptionId: UUID,
        days: Int,
        source: FreezeSource
    ): MemberFreezeBalance {
        require(days > 0) { "Days must be positive" }

        val balance = getOrCreateFreezeBalance(memberId, subscriptionId)
        balance.addDays(days, source)

        logger.info("Granted $days freeze days to member $memberId for subscription $subscriptionId (source: $source)")
        return freezeBalanceRepository.save(balance)
    }

    // ==========================================
    // SUBSCRIPTION FREEZE OPERATIONS
    // ==========================================

    /**
     * Freeze a subscription using available freeze days.
     */
    fun freezeSubscription(
        subscriptionId: UUID,
        freezeDays: Int,
        freezeType: FreezeType,
        reason: String? = null,
        documentPath: String? = null,
        createdByUserId: UUID? = null
    ): FreezeResult {
        val subscription = subscriptionRepository.findById(subscriptionId)
            .orElseThrow { NoSuchElementException("Subscription not found: $subscriptionId") }

        require(subscription.status == SubscriptionStatus.ACTIVE) {
            "Only active subscriptions can be frozen"
        }

        // Check if there's already an active freeze
        val activeFreeze = freezeHistoryRepository.findActiveBySubscriptionId(subscriptionId)
        if (activeFreeze.isPresent) {
            // If subscription is ACTIVE but has orphaned freeze history (from old system or manual status change),
            // auto-close the orphaned record to allow new freeze
            val orphanedFreeze = activeFreeze.get()
            logger.warn("Found orphaned active freeze history for subscription $subscriptionId, auto-closing it")
            orphanedFreeze.endFreeze()
            freezeHistoryRepository.save(orphanedFreeze)
        }

        // Check freeze balance
        val balance = getFreezeBalance(subscriptionId)
        if (balance != null && balance.availableDays() > 0) {
            val daysToUse = minOf(freezeDays, balance.availableDays())
            balance.useDays(daysToUse)
            freezeBalanceRepository.save(balance)
        }

        // Update subscription
        val originalEndDate = subscription.endDate
        subscription.status = SubscriptionStatus.FROZEN
        subscription.frozenAt = LocalDate.now()
        subscription.freezeType = freezeType
        subscription.freezeReason = reason
        subscription.freezeDocumentPath = documentPath
        subscription.freezeEndDate = LocalDate.now().plusDays(freezeDays.toLong())

        // Extend end date if configured
        val newEndDate = originalEndDate.plusDays(freezeDays.toLong())
        subscription.endDate = newEndDate
        subscription.totalFreezeDaysUsed += freezeDays

        subscriptionRepository.save(subscription)

        // Create freeze history record
        val history = FreezeHistory(
            subscriptionId = subscriptionId,
            freezeStartDate = LocalDate.now(),
            freezeDays = freezeDays,
            freezeType = freezeType,
            reason = reason,
            documentPath = documentPath,
            createdByUserId = createdByUserId,
            contractExtended = true,
            originalEndDate = originalEndDate,
            newEndDate = newEndDate
        )
        freezeHistoryRepository.save(history)

        logger.info("Subscription $subscriptionId frozen for $freezeDays days (type: $freezeType)")

        return FreezeResult(
            subscription = subscription,
            history = history,
            daysUsedFromBalance = balance?.let { minOf(freezeDays, it.availableDays() + freezeDays) } ?: 0,
            originalEndDate = originalEndDate,
            newEndDate = newEndDate
        )
    }

    /**
     * Unfreeze a subscription.
     */
    fun unfreezeSubscription(subscriptionId: UUID): FreezeResult {
        val subscription = subscriptionRepository.findById(subscriptionId)
            .orElseThrow { NoSuchElementException("Subscription not found: $subscriptionId") }

        require(subscription.status == SubscriptionStatus.FROZEN) {
            "Subscription is not frozen"
        }

        val activeFreeze = freezeHistoryRepository.findActiveBySubscriptionId(subscriptionId)
            .orElseThrow { IllegalStateException("No active freeze found for subscription") }

        // End the freeze
        activeFreeze.endFreeze()
        freezeHistoryRepository.save(activeFreeze)

        // Update subscription
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.frozenAt = null
        subscription.freezeType = null
        subscription.freezeReason = null
        subscription.freezeDocumentPath = null
        subscription.freezeEndDate = null

        subscriptionRepository.save(subscription)

        logger.info("Subscription $subscriptionId unfrozen")

        return FreezeResult(
            subscription = subscription,
            history = activeFreeze,
            daysUsedFromBalance = 0,
            originalEndDate = activeFreeze.originalEndDate,
            newEndDate = activeFreeze.newEndDate
        )
    }

    // ==========================================
    // FREEZE HISTORY
    // ==========================================

    @Transactional(readOnly = true)
    fun getFreezeHistory(subscriptionId: UUID): List<FreezeHistory> {
        return freezeHistoryRepository.findBySubscriptionId(subscriptionId)
    }

    @Transactional(readOnly = true)
    fun getFreezeHistory(subscriptionId: UUID, pageable: Pageable): Page<FreezeHistory> {
        return freezeHistoryRepository.findBySubscriptionId(subscriptionId, pageable)
    }

    @Transactional(readOnly = true)
    fun getActiveFreeze(subscriptionId: UUID): FreezeHistory? {
        return freezeHistoryRepository.findActiveBySubscriptionId(subscriptionId).orElse(null)
    }

    @Transactional(readOnly = true)
    fun getTotalFreezeCount(subscriptionId: UUID): Long {
        return freezeHistoryRepository.countBySubscriptionId(subscriptionId)
    }
}

/**
 * Result of a freeze operation.
 */
data class FreezeResult(
    val subscription: com.liyaqa.membership.domain.model.Subscription,
    val history: FreezeHistory,
    val daysUsedFromBalance: Int,
    val originalEndDate: LocalDate?,
    val newEndDate: LocalDate?
)
