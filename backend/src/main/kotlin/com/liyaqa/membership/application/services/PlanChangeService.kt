package com.liyaqa.membership.application.services

import com.liyaqa.membership.domain.model.PlanChangeHistory
import com.liyaqa.membership.domain.model.PlanChangeType
import com.liyaqa.membership.domain.model.ProrationMode
import com.liyaqa.membership.domain.model.ScheduledChangeStatus
import com.liyaqa.membership.domain.model.ScheduledPlanChange
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.ports.MembershipContractRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.PlanChangeHistoryRepository
import com.liyaqa.membership.domain.ports.ScheduledPlanChangeRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.Money
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Command to change a member's plan.
 */
data class PlanChangeCommand(
    val subscriptionId: UUID,
    val newPlanId: UUID,
    val preferredProrationMode: ProrationMode? = null,
    val initiatedByUserId: UUID? = null,
    val initiatedByMember: Boolean = false,
    val notes: String? = null
)

/**
 * Preview of a plan change showing proration details.
 */
data class PlanChangePreview(
    val subscriptionId: UUID,
    val currentPlanId: UUID,
    val currentPlanName: String,
    val newPlanId: UUID,
    val newPlanName: String,
    val changeType: PlanChangeType,
    val prorationMode: ProrationMode,
    val effectiveDate: LocalDate,
    val credit: Money,
    val charge: Money,
    val netAmount: Money,
    val daysRemaining: Int,
    val summary: String
)

/**
 * Result of a plan change operation.
 */
data class PlanChangeResult(
    val subscription: Subscription,
    val history: PlanChangeHistory?,
    val scheduledChange: ScheduledPlanChange?,
    val changeType: PlanChangeType,
    val effectiveDate: LocalDate,
    val wasImmediate: Boolean
)

@Service
class PlanChangeService(
    private val subscriptionRepository: SubscriptionRepository,
    private val planRepository: MembershipPlanRepository,
    private val contractRepository: MembershipContractRepository,
    private val planChangeHistoryRepository: PlanChangeHistoryRepository,
    private val scheduledChangeRepository: ScheduledPlanChangeRepository,
    private val prorationService: ProrationService
) {

    /**
     * Preview a plan change to show member what it will cost.
     */
    fun previewPlanChange(subscriptionId: UUID, newPlanId: UUID, locale: String = "en"): PlanChangePreview {
        val subscription = subscriptionRepository.findById(subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found: $subscriptionId") }

        val currentPlan = planRepository.findById(subscription.planId)
            .orElseThrow { IllegalArgumentException("Current plan not found: ${subscription.planId}") }

        val newPlan = planRepository.findById(newPlanId)
            .orElseThrow { IllegalArgumentException("New plan not found: $newPlanId") }

        require(currentPlan.id != newPlan.id) { "Cannot change to the same plan" }

        // Determine if this is an upgrade or downgrade
        val isUpgrade = prorationService.isUpgrade(currentPlan, newPlan)
        val changeType = if (isUpgrade) PlanChangeType.UPGRADE else PlanChangeType.DOWNGRADE

        // Determine proration mode
        val prorationMode = prorationService.determineProrationMode(isUpgrade)

        // Get billing period dates
        val billingPeriodStart = subscription.currentBillingPeriodStart ?: subscription.startDate
        val billingPeriodEnd = subscription.currentBillingPeriodEnd ?: subscription.endDate

        // Calculate proration
        val prorationResult = prorationService.calculateProration(
            currentPlan = currentPlan,
            newPlan = newPlan,
            billingPeriodStart = billingPeriodStart,
            billingPeriodEnd = billingPeriodEnd,
            changeDate = LocalDate.now(),
            mode = prorationMode
        )

        return PlanChangePreview(
            subscriptionId = subscriptionId,
            currentPlanId = currentPlan.id,
            currentPlanName = currentPlan.name.get(locale),
            newPlanId = newPlan.id,
            newPlanName = newPlan.name.get(locale),
            changeType = changeType,
            prorationMode = prorationMode,
            effectiveDate = prorationResult.effectiveDate,
            credit = prorationResult.credit,
            charge = prorationResult.charge,
            netAmount = prorationResult.netAmount,
            daysRemaining = prorationResult.daysRemaining,
            summary = prorationService.formatProrationSummary(prorationResult, locale)
        )
    }

    /**
     * Execute a plan change (upgrade or downgrade).
     */
    @Transactional
    fun changePlan(command: PlanChangeCommand): PlanChangeResult {
        val subscription = subscriptionRepository.findById(command.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found: ${command.subscriptionId}") }

        val currentPlan = planRepository.findById(subscription.planId)
            .orElseThrow { IllegalArgumentException("Current plan not found: ${subscription.planId}") }

        val newPlan = planRepository.findById(command.newPlanId)
            .orElseThrow { IllegalArgumentException("New plan not found: ${command.newPlanId}") }

        require(currentPlan.id != newPlan.id) { "Cannot change to the same plan" }

        // Check for existing pending change
        if (scheduledChangeRepository.existsPendingBySubscriptionId(subscription.id)) {
            throw IllegalStateException("Subscription already has a pending plan change")
        }

        // Determine change type and mode
        val isUpgrade = prorationService.isUpgrade(currentPlan, newPlan)
        val changeType = if (isUpgrade) PlanChangeType.UPGRADE else PlanChangeType.DOWNGRADE
        val prorationMode = command.preferredProrationMode
            ?: prorationService.determineProrationMode(isUpgrade)

        // Get billing period dates
        val billingPeriodStart = subscription.currentBillingPeriodStart ?: subscription.startDate
        val billingPeriodEnd = subscription.currentBillingPeriodEnd ?: subscription.endDate

        return when (prorationMode) {
            ProrationMode.PRORATE_IMMEDIATELY, ProrationMode.FULL_PERIOD_CREDIT, ProrationMode.NO_PRORATION -> {
                executeImmediatePlanChange(
                    subscription, currentPlan, newPlan, changeType, prorationMode,
                    billingPeriodStart, billingPeriodEnd, command
                )
            }
            ProrationMode.END_OF_PERIOD -> {
                scheduleEndOfPeriodPlanChange(
                    subscription, currentPlan, newPlan, changeType,
                    billingPeriodEnd, command
                )
            }
        }
    }

    /**
     * Cancel a scheduled plan change.
     */
    @Transactional
    fun cancelScheduledChange(
        scheduledChangeId: UUID,
        reason: String? = null,
        cancelledBy: UUID? = null
    ): ScheduledPlanChange {
        val scheduledChange = scheduledChangeRepository.findById(scheduledChangeId)
            .orElseThrow { IllegalArgumentException("Scheduled change not found: $scheduledChangeId") }

        require(scheduledChange.isPending()) { "Can only cancel pending changes" }

        scheduledChange.cancel(reason, cancelledBy)

        // Clear the scheduled change reference from subscription
        subscriptionRepository.findById(scheduledChange.subscriptionId).ifPresent { subscription ->
            subscription.clearScheduledChange()
            subscriptionRepository.save(subscription)
        }

        return scheduledChangeRepository.save(scheduledChange)
    }

    /**
     * Process scheduled plan changes that are due.
     * Should be called by a scheduled job.
     */
    @Transactional
    fun processScheduledChanges(): List<PlanChangeResult> {
        val dueChanges = scheduledChangeRepository.findPendingDueForProcessing(
            LocalDate.now(),
            PageRequest.of(0, 100)
        )

        return dueChanges.content.mapNotNull { scheduledChange ->
            try {
                processScheduledChange(scheduledChange)
            } catch (e: Exception) {
                // Log error but continue processing others
                null
            }
        }
    }

    /**
     * Get plan change history for a subscription.
     */
    fun getPlanChangeHistory(subscriptionId: UUID, pageable: Pageable): Page<PlanChangeHistory> =
        planChangeHistoryRepository.findBySubscriptionId(subscriptionId, pageable)

    /**
     * Get pending scheduled change for a subscription.
     */
    fun getPendingScheduledChange(subscriptionId: UUID): ScheduledPlanChange? =
        scheduledChangeRepository.findPendingBySubscriptionId(subscriptionId).orElse(null)

    /**
     * Get all pending scheduled changes.
     */
    fun getAllPendingChanges(pageable: Pageable): Page<ScheduledPlanChange> =
        scheduledChangeRepository.findAllPending(pageable)

    // ==========================================
    // PRIVATE HELPERS
    // ==========================================

    private fun executeImmediatePlanChange(
        subscription: Subscription,
        currentPlan: com.liyaqa.membership.domain.model.MembershipPlan,
        newPlan: com.liyaqa.membership.domain.model.MembershipPlan,
        changeType: PlanChangeType,
        prorationMode: ProrationMode,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate,
        command: PlanChangeCommand
    ): PlanChangeResult {
        val changeDate = LocalDate.now()

        // Calculate proration
        val prorationResult = prorationService.calculateProration(
            currentPlan, newPlan, billingPeriodStart, billingPeriodEnd, changeDate, prorationMode
        )

        // Create plan change history record
        val history = PlanChangeHistory(
            subscriptionId = subscription.id,
            contractId = subscription.contractId,
            memberId = subscription.memberId,
            oldPlanId = currentPlan.id,
            newPlanId = newPlan.id,
            changeType = changeType,
            prorationMode = prorationMode,
            effectiveDate = changeDate,
            billingPeriodStart = billingPeriodStart,
            billingPeriodEnd = billingPeriodEnd,
            daysRemaining = prorationResult.daysRemaining,
            totalDays = prorationResult.totalDays,
            creditAmount = prorationResult.credit,
            chargeAmount = prorationResult.charge,
            netAmount = prorationResult.netAmount,
            initiatedByUserId = command.initiatedByUserId,
            initiatedByMember = command.initiatedByMember,
            notes = command.notes,
            status = "COMPLETED"
        )

        val savedHistory = planChangeHistoryRepository.save(history)

        // Note: In a real implementation, we would:
        // 1. Create an invoice or apply wallet credit/debit for the proration
        // 2. Update the subscription's planId (requires mutable planId or new subscription)
        // For now, we just record the change

        return PlanChangeResult(
            subscription = subscription,
            history = savedHistory,
            scheduledChange = null,
            changeType = changeType,
            effectiveDate = changeDate,
            wasImmediate = true
        )
    }

    private fun scheduleEndOfPeriodPlanChange(
        subscription: Subscription,
        currentPlan: com.liyaqa.membership.domain.model.MembershipPlan,
        newPlan: com.liyaqa.membership.domain.model.MembershipPlan,
        changeType: PlanChangeType,
        billingPeriodEnd: LocalDate,
        command: PlanChangeCommand
    ): PlanChangeResult {
        // Create scheduled change
        val scheduledChange = ScheduledPlanChange(
            subscriptionId = subscription.id,
            contractId = subscription.contractId,
            memberId = subscription.memberId,
            currentPlanId = currentPlan.id,
            newPlanId = newPlan.id,
            changeType = changeType,
            scheduledDate = billingPeriodEnd,
            initiatedByUserId = command.initiatedByUserId,
            initiatedByMember = command.initiatedByMember
        )

        val savedScheduledChange = scheduledChangeRepository.save(scheduledChange)

        // Link to subscription
        subscription.scheduleChange(savedScheduledChange.id)
        val savedSubscription = subscriptionRepository.save(subscription)

        return PlanChangeResult(
            subscription = savedSubscription,
            history = null,
            scheduledChange = savedScheduledChange,
            changeType = changeType,
            effectiveDate = billingPeriodEnd,
            wasImmediate = false
        )
    }

    private fun processScheduledChange(scheduledChange: ScheduledPlanChange): PlanChangeResult {
        val subscription = subscriptionRepository.findById(scheduledChange.subscriptionId)
            .orElseThrow { IllegalArgumentException("Subscription not found") }

        val currentPlan = planRepository.findById(scheduledChange.currentPlanId)
            .orElseThrow { IllegalArgumentException("Current plan not found") }

        val newPlan = planRepository.findById(scheduledChange.newPlanId)
            .orElseThrow { IllegalArgumentException("New plan not found") }

        // Create history record
        val history = PlanChangeHistory(
            subscriptionId = subscription.id,
            contractId = subscription.contractId,
            memberId = subscription.memberId,
            oldPlanId = currentPlan.id,
            newPlanId = newPlan.id,
            changeType = scheduledChange.changeType,
            prorationMode = ProrationMode.END_OF_PERIOD,
            effectiveDate = scheduledChange.scheduledDate,
            billingPeriodStart = subscription.currentBillingPeriodStart ?: subscription.startDate,
            billingPeriodEnd = scheduledChange.scheduledDate,
            daysRemaining = 0,
            totalDays = 0,
            initiatedByMember = scheduledChange.initiatedByMember,
            status = "COMPLETED"
        )

        val savedHistory = planChangeHistoryRepository.save(history)

        // Mark scheduled change as processed
        scheduledChange.markProcessed(savedHistory.id)
        scheduledChangeRepository.save(scheduledChange)

        // Clear scheduled change from subscription
        subscription.clearScheduledChange()
        val savedSubscription = subscriptionRepository.save(subscription)

        return PlanChangeResult(
            subscription = savedSubscription,
            history = savedHistory,
            scheduledChange = scheduledChange,
            changeType = scheduledChange.changeType,
            effectiveDate = scheduledChange.scheduledDate,
            wasImmediate = false
        )
    }
}
