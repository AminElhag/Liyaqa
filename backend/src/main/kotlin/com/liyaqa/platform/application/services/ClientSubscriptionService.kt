package com.liyaqa.platform.application.services

import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.platform.application.commands.ChangeSubscriptionPlanCommand
import com.liyaqa.platform.application.commands.CreateClientSubscriptionCommand
import com.liyaqa.platform.application.commands.RenewSubscriptionCommand
import com.liyaqa.platform.application.commands.UpdateClientSubscriptionCommand
import com.liyaqa.platform.domain.model.ClientSubscription
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.ClientSubscriptionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service for managing client subscriptions.
 * Only accessible by platform users (internal Liyaqa team).
 */
@Service
@Transactional
class ClientSubscriptionService(
    private val subscriptionRepository: ClientSubscriptionRepository,
    private val planRepository: ClientPlanRepository,
    private val organizationRepository: OrganizationRepository
) {
    /**
     * Creates a new subscription for a client.
     */
    fun createSubscription(command: CreateClientSubscriptionCommand): ClientSubscription {
        // Validate organization exists
        if (!organizationRepository.existsById(command.organizationId)) {
            throw NoSuchElementException("Organization not found: ${command.organizationId}")
        }

        // Validate plan exists
        if (!planRepository.existsById(command.clientPlanId)) {
            throw NoSuchElementException("Client plan not found: ${command.clientPlanId}")
        }

        // Check for existing active subscription
        if (subscriptionRepository.existsActiveByOrganizationId(command.organizationId)) {
            throw IllegalStateException("Organization already has an active subscription")
        }

        val subscription = if (command.startWithTrial) {
            ClientSubscription.createTrial(
                organizationId = command.organizationId,
                clientPlanId = command.clientPlanId,
                trialDays = command.trialDays,
                agreedPrice = command.agreedPrice,
                billingCycle = command.billingCycle,
                salesRepId = command.salesRepId,
                dealId = command.dealId
            )
        } else {
            ClientSubscription.createActive(
                organizationId = command.organizationId,
                clientPlanId = command.clientPlanId,
                contractMonths = command.contractMonths,
                agreedPrice = command.agreedPrice,
                billingCycle = command.billingCycle,
                salesRepId = command.salesRepId,
                dealId = command.dealId
            )
        }

        // Apply discount if provided
        command.discountPercentage?.let { subscription.applyDiscount(it) }

        subscription.autoRenew = command.autoRenew
        subscription.notes = command.notes

        return subscriptionRepository.save(subscription)
    }

    /**
     * Gets a subscription by ID.
     */
    @Transactional(readOnly = true)
    fun getSubscription(id: UUID): ClientSubscription {
        return subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }
    }

    /**
     * Gets all subscriptions with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllSubscriptions(pageable: Pageable): Page<ClientSubscription> {
        return subscriptionRepository.findAll(pageable)
    }

    /**
     * Gets subscriptions by status.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByStatus(status: ClientSubscriptionStatus, pageable: Pageable): Page<ClientSubscription> {
        return subscriptionRepository.findByStatus(status, pageable)
    }

    /**
     * Gets subscriptions for an organization.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByOrganization(organizationId: UUID): List<ClientSubscription> {
        return subscriptionRepository.findByOrganizationId(organizationId)
    }

    /**
     * Gets subscriptions for an organization with pagination.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByOrganizationPaged(organizationId: UUID, pageable: Pageable): Page<ClientSubscription> {
        return subscriptionRepository.findByOrganizationIdPaged(organizationId, pageable)
    }

    /**
     * Gets the active subscription for an organization.
     */
    @Transactional(readOnly = true)
    fun getActiveSubscription(organizationId: UUID): ClientSubscription? {
        return subscriptionRepository.findActiveByOrganizationId(organizationId).orElse(null)
    }

    /**
     * Gets subscriptions by sales rep.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsBySalesRep(salesRepId: UUID, pageable: Pageable): Page<ClientSubscription> {
        return subscriptionRepository.findBySalesRepId(salesRepId, pageable)
    }

    /**
     * Gets expiring subscriptions.
     */
    @Transactional(readOnly = true)
    fun getExpiringSubscriptions(daysAhead: Int = 30): List<ClientSubscription> {
        val expiryDate = LocalDate.now().plusDays(daysAhead.toLong())
        return subscriptionRepository.findExpiring(
            expiryDate,
            listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)
        )
    }

    /**
     * Gets expiring trials.
     */
    @Transactional(readOnly = true)
    fun getExpiringTrials(daysAhead: Int = 7): List<ClientSubscription> {
        val expiryDate = LocalDate.now().plusDays(daysAhead.toLong())
        return subscriptionRepository.findTrialsExpiring(expiryDate)
    }

    /**
     * Updates a subscription.
     */
    fun updateSubscription(id: UUID, command: UpdateClientSubscriptionCommand): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        command.agreedPrice?.let { subscription.agreedPrice = it }
        command.billingCycle?.let { subscription.billingCycle = it }
        command.discountPercentage?.let { subscription.discountPercentage = it }
        command.autoRenew?.let { subscription.autoRenew = it }
        command.notes?.let { subscription.notes = it }

        return subscriptionRepository.save(subscription)
    }

    /**
     * Activates a subscription (e.g., after payment or trial conversion).
     */
    fun activateSubscription(id: UUID): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.activate()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Suspends a subscription.
     */
    fun suspendSubscription(id: UUID): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.suspend()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Cancels a subscription.
     */
    fun cancelSubscription(id: UUID): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.cancel()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Renews a subscription.
     */
    fun renewSubscription(id: UUID, command: RenewSubscriptionCommand): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.renew(command.newEndDate, command.newAgreedPrice)
        return subscriptionRepository.save(subscription)
    }

    /**
     * Changes the plan for a subscription (upgrade/downgrade).
     */
    fun changePlan(id: UUID, command: ChangeSubscriptionPlanCommand): ClientSubscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        // Validate new plan exists
        if (!planRepository.existsById(command.newPlanId)) {
            throw NoSuchElementException("Client plan not found: ${command.newPlanId}")
        }

        subscription.changePlan(command.newPlanId, command.newAgreedPrice, command.newContractMonths)
        return subscriptionRepository.save(subscription)
    }

    /**
     * Processes expired subscriptions (called by scheduled job).
     */
    fun processExpiredSubscriptions(): Int {
        val today = LocalDate.now()
        val expiringToday = subscriptionRepository.findExpiring(
            today,
            listOf(ClientSubscriptionStatus.ACTIVE, ClientSubscriptionStatus.TRIAL)
        )

        var count = 0
        for (subscription in expiringToday) {
            if (subscription.isExpired()) {
                subscription.expire()
                subscriptionRepository.save(subscription)
                count++
            }
        }

        return count
    }

    /**
     * Processes expired trials (called by scheduled job).
     */
    fun processExpiredTrials(): Int {
        val today = LocalDate.now()
        val expiringTrials = subscriptionRepository.findTrialsExpiring(today)

        var count = 0
        for (subscription in expiringTrials) {
            if (subscription.isTrialExpired()) {
                subscription.expire()
                subscriptionRepository.save(subscription)
                count++
            }
        }

        return count
    }

    /**
     * Gets subscription statistics.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionStats(): SubscriptionStats {
        return SubscriptionStats(
            total = subscriptionRepository.count(),
            active = subscriptionRepository.countByStatus(ClientSubscriptionStatus.ACTIVE),
            trial = subscriptionRepository.countByStatus(ClientSubscriptionStatus.TRIAL),
            suspended = subscriptionRepository.countByStatus(ClientSubscriptionStatus.SUSPENDED),
            cancelled = subscriptionRepository.countByStatus(ClientSubscriptionStatus.CANCELLED),
            expired = subscriptionRepository.countByStatus(ClientSubscriptionStatus.EXPIRED)
        )
    }
}

/**
 * Statistics about client subscriptions.
 */
data class SubscriptionStats(
    val total: Long,
    val active: Long,
    val trial: Long,
    val suspended: Long,
    val cancelled: Long,
    val expired: Long
)
