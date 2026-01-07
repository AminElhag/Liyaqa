package com.liyaqa.membership.application.services

import com.liyaqa.membership.application.commands.CreateSubscriptionCommand
import com.liyaqa.membership.application.commands.RenewSubscriptionCommand
import com.liyaqa.membership.application.commands.UpdateSubscriptionCommand
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class SubscriptionService(
    private val subscriptionRepository: SubscriptionRepository,
    private val memberRepository: MemberRepository,
    private val membershipPlanRepository: MembershipPlanRepository
) {
    /**
     * Creates a new subscription for a member.
     * @throws NoSuchElementException if member or plan not found
     * @throws IllegalStateException if member already has an active subscription
     */
    fun createSubscription(command: CreateSubscriptionCommand): Subscription {
        // Validate member exists
        if (!memberRepository.existsById(command.memberId)) {
            throw NoSuchElementException("Member not found: ${command.memberId}")
        }

        // Validate plan exists and is active
        val plan = membershipPlanRepository.findById(command.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${command.planId}") }

        if (!plan.isActive) {
            throw IllegalStateException("Membership plan is not active: ${command.planId}")
        }

        // Check if member already has an active subscription
        if (subscriptionRepository.existsActiveByMemberId(command.memberId)) {
            throw IllegalStateException("Member already has an active subscription")
        }

        // Calculate end date based on plan
        val endDate = command.startDate.plusDays(plan.getEffectiveDurationDays().toLong())

        val subscription = Subscription(
            memberId = command.memberId,
            planId = command.planId,
            startDate = command.startDate,
            endDate = endDate,
            autoRenew = command.autoRenew,
            paidAmount = command.paidAmount,
            classesRemaining = plan.maxClassesPerPeriod,
            guestPassesRemaining = if (plan.hasGuestPasses) plan.guestPassesCount else 0,
            freezeDaysRemaining = plan.freezeDaysAllowed,
            notes = command.notes,
            status = if (command.paidAmount != null) SubscriptionStatus.ACTIVE else SubscriptionStatus.PENDING_PAYMENT
        )

        return subscriptionRepository.save(subscription)
    }

    /**
     * Gets a subscription by ID.
     */
    @Transactional(readOnly = true)
    fun getSubscription(id: UUID): Subscription {
        return subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }
    }

    /**
     * Gets all subscriptions for a member.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByMember(memberId: UUID, pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets the active subscription for a member.
     */
    @Transactional(readOnly = true)
    fun getActiveSubscription(memberId: UUID): Subscription? {
        return subscriptionRepository.findActiveByMemberId(memberId).orElse(null)
    }

    /**
     * Gets all subscriptions with pagination.
     */
    @Transactional(readOnly = true)
    fun getAllSubscriptions(pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findAll(pageable)
    }

    /**
     * Gets subscriptions by status.
     */
    @Transactional(readOnly = true)
    fun getSubscriptionsByStatus(status: SubscriptionStatus, pageable: Pageable): Page<Subscription> {
        return subscriptionRepository.findByStatus(status, pageable)
    }

    /**
     * Gets subscriptions expiring within the given number of days.
     */
    @Transactional(readOnly = true)
    fun getExpiringSubscriptions(daysAhead: Int, pageable: Pageable): Page<Subscription> {
        val expirationDate = LocalDate.now().plusDays(daysAhead.toLong())
        return subscriptionRepository.findExpiringBefore(expirationDate, pageable)
    }

    /**
     * Updates a subscription.
     */
    fun updateSubscription(id: UUID, command: UpdateSubscriptionCommand): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        command.autoRenew?.let { subscription.autoRenew = it }
        command.notes?.let { subscription.notes = it }

        return subscriptionRepository.save(subscription)
    }

    /**
     * Freezes a subscription.
     */
    fun freezeSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.freeze()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Unfreezes a subscription.
     */
    fun unfreezeSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.unfreeze()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Cancels a subscription.
     */
    fun cancelSubscription(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        subscription.cancel()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Renews a subscription.
     */
    fun renewSubscription(id: UUID, command: RenewSubscriptionCommand): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        // Get the plan to calculate new end date if not provided
        val plan = membershipPlanRepository.findById(subscription.planId)
            .orElseThrow { NoSuchElementException("Membership plan not found: ${subscription.planId}") }

        val newEndDate = command.newEndDate
            ?: LocalDate.now().plusDays(plan.getEffectiveDurationDays().toLong())

        subscription.renew(newEndDate)

        // Reset class allowance and guest passes
        subscription.classesRemaining = plan.maxClassesPerPeriod
        subscription.guestPassesRemaining = if (plan.hasGuestPasses) plan.guestPassesCount else 0
        subscription.freezeDaysRemaining = plan.freezeDaysAllowed

        command.paidAmount?.let { subscription.paidAmount = it }

        return subscriptionRepository.save(subscription)
    }

    /**
     * Uses a class from the subscription.
     */
    fun useClass(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        if (!subscription.isActive()) {
            throw IllegalStateException("Subscription is not active")
        }

        subscription.useClass()
        return subscriptionRepository.save(subscription)
    }

    /**
     * Uses a guest pass from the subscription.
     */
    fun useGuestPass(id: UUID): Subscription {
        val subscription = subscriptionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Subscription not found: $id") }

        if (!subscription.isActive()) {
            throw IllegalStateException("Subscription is not active")
        }

        subscription.useGuestPass()
        return subscriptionRepository.save(subscription)
    }
}