package com.liyaqa.platform.application.services

import com.liyaqa.platform.domain.model.DunningSequence
import com.liyaqa.platform.domain.model.DunningStatus
import com.liyaqa.platform.domain.model.DunningStep
import com.liyaqa.platform.domain.ports.DunningSequenceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Service for managing dunning (payment recovery) sequences.
 * Handles automated retry logic and notification scheduling.
 */
@Service
@Transactional
class DunningService(
    private val dunningRepository: DunningSequenceRepository
) {
    /**
     * Creates a new dunning sequence for a failed payment.
     */
    fun createDunning(
        organizationId: UUID,
        subscriptionId: UUID,
        invoiceId: UUID,
        amount: BigDecimal,
        currency: String,
        failureReason: String?
    ): DunningSequence {
        // Check if dunning already exists for this invoice
        dunningRepository.findByInvoiceId(invoiceId).ifPresent {
            throw IllegalStateException("Dunning sequence already exists for invoice: $invoiceId")
        }

        val dunning = DunningSequence.create(
            organizationId = organizationId,
            subscriptionId = subscriptionId,
            invoiceId = invoiceId,
            amount = amount,
            currency = currency,
            failureReason = failureReason
        )

        return dunningRepository.save(dunning)
    }

    /**
     * Gets a dunning sequence by ID.
     */
    @Transactional(readOnly = true)
    fun getById(id: UUID): DunningSequence {
        return dunningRepository.findById(id)
            .orElseThrow { NoSuchElementException("Dunning sequence not found: $id") }
    }

    /**
     * Gets active dunning for an organization.
     */
    @Transactional(readOnly = true)
    fun getActiveByOrganizationId(organizationId: UUID): DunningSequence? {
        return dunningRepository.findActiveByOrganizationId(organizationId).orElse(null)
    }

    /**
     * Gets dunning by subscription ID.
     */
    @Transactional(readOnly = true)
    fun getBySubscriptionId(subscriptionId: UUID): DunningSequence? {
        return dunningRepository.findBySubscriptionId(subscriptionId).orElse(null)
    }

    /**
     * Gets dunning by invoice ID.
     */
    @Transactional(readOnly = true)
    fun getByInvoiceId(invoiceId: UUID): DunningSequence? {
        return dunningRepository.findByInvoiceId(invoiceId).orElse(null)
    }

    /**
     * Records a retry attempt result.
     */
    fun recordRetryAttempt(dunningId: UUID, success: Boolean, result: String): DunningSequence {
        val dunning = getById(dunningId)
        dunning.recordRetryAttempt(success, result)
        return dunningRepository.save(dunning)
    }

    /**
     * Marks the dunning as recovered.
     */
    fun markRecovered(dunningId: UUID, method: String): DunningSequence {
        val dunning = getById(dunningId)
        dunning.recover(method)
        return dunningRepository.save(dunning)
    }

    /**
     * Marks the dunning as recovered by organization ID.
     */
    fun markRecoveredByOrganization(organizationId: UUID, method: String): DunningSequence? {
        val dunning = getActiveByOrganizationId(organizationId) ?: return null
        dunning.recover(method)
        return dunningRepository.save(dunning)
    }

    /**
     * Suspends the subscription due to non-payment.
     */
    fun suspendSubscription(dunningId: UUID): DunningSequence {
        val dunning = getById(dunningId)
        dunning.suspend()
        return dunningRepository.save(dunning)
    }

    /**
     * Deactivates the account.
     */
    fun deactivateAccount(dunningId: UUID): DunningSequence {
        val dunning = getById(dunningId)
        dunning.deactivate()
        return dunningRepository.save(dunning)
    }

    /**
     * Manually resolves a dunning sequence.
     */
    fun resolveManually(dunningId: UUID, notes: String?): DunningSequence {
        val dunning = getById(dunningId)
        dunning.resolveManually(notes)
        return dunningRepository.save(dunning)
    }

    /**
     * Escalates to CSM.
     */
    fun escalateToCsm(dunningId: UUID, csmId: UUID? = null): DunningSequence {
        val dunning = getById(dunningId)
        dunning.escalateToCsm(csmId)
        return dunningRepository.save(dunning)
    }

    /**
     * Assigns a CSM.
     */
    fun assignCsm(dunningId: UUID, csmId: UUID): DunningSequence {
        val dunning = getById(dunningId)
        dunning.assignCsm(csmId)
        return dunningRepository.save(dunning)
    }

    /**
     * Adds notes to a dunning sequence.
     */
    fun addNotes(dunningId: UUID, notes: String): DunningSequence {
        val dunning = getById(dunningId)
        dunning.notes = if (dunning.notes.isNullOrEmpty()) notes else "${dunning.notes}\n\n$notes"
        return dunningRepository.save(dunning)
    }

    /**
     * Records a notification step as sent.
     */
    fun markStepSent(dunningId: UUID, stepId: UUID): DunningSequence {
        val dunning = getById(dunningId)
        val step = dunning.steps.find { it.id == stepId }
            ?: throw NoSuchElementException("Step not found: $stepId")
        step.markAsSent()
        return dunningRepository.save(dunning)
    }

    /**
     * Records a click on a notification.
     */
    fun recordStepClick(dunningId: UUID, stepId: UUID): DunningSequence {
        val dunning = getById(dunningId)
        val step = dunning.steps.find { it.id == stepId }
            ?: throw NoSuchElementException("Step not found: $stepId")
        step.recordClick()
        return dunningRepository.save(dunning)
    }

    /**
     * Gets dunning sequences ready for retry.
     */
    @Transactional(readOnly = true)
    fun getReadyForRetry(): List<DunningSequence> {
        return dunningRepository.findWithRetryDue(LocalDate.now())
    }

    /**
     * Gets dunning sequences ready for suspension.
     */
    @Transactional(readOnly = true)
    fun getReadyForSuspension(): List<DunningSequence> {
        return dunningRepository.findReadyForSuspension(DunningSequence.DEFAULT_SUSPENSION_DAY)
    }

    /**
     * Gets dunning sequences ready for deactivation.
     */
    @Transactional(readOnly = true)
    fun getReadyForDeactivation(): List<DunningSequence> {
        return dunningRepository.findReadyForDeactivation(DunningSequence.DEFAULT_DEACTIVATION_DAY)
    }

    /**
     * Gets all active dunning sequences.
     */
    @Transactional(readOnly = true)
    fun getActive(pageable: Pageable): Page<DunningSequence> {
        return dunningRepository.findActive(pageable)
    }

    /**
     * Gets dunning sequences by status.
     */
    @Transactional(readOnly = true)
    fun getByStatus(status: DunningStatus, pageable: Pageable): Page<DunningSequence> {
        return dunningRepository.findByStatus(status, pageable)
    }

    /**
     * Gets dunning sequences escalated to CSM.
     */
    @Transactional(readOnly = true)
    fun getEscalated(pageable: Pageable): Page<DunningSequence> {
        return dunningRepository.findEscalatedToCsm(pageable)
    }

    /**
     * Gets dunning sequences assigned to a CSM.
     */
    @Transactional(readOnly = true)
    fun getByCsm(csmId: UUID, pageable: Pageable): Page<DunningSequence> {
        return dunningRepository.findByCsmId(csmId, pageable)
    }

    /**
     * Gets dunning by organization.
     */
    @Transactional(readOnly = true)
    fun getByOrganization(organizationId: UUID, pageable: Pageable): Page<DunningSequence> {
        return dunningRepository.findByOrganizationId(organizationId, pageable)
    }

    /**
     * Gets dunning statistics.
     */
    @Transactional(readOnly = true)
    fun getStatistics(): DunningStatistics {
        return DunningStatistics(
            activeCount = dunningRepository.countActive(),
            suspendedCount = dunningRepository.countByStatus(DunningStatus.SUSPENDED),
            recoveredCount = dunningRepository.countByStatus(DunningStatus.RECOVERED),
            deactivatedCount = dunningRepository.countByStatus(DunningStatus.DEACTIVATED),
            recoveryRate = dunningRepository.getRecoveryRate()
        )
    }

    /**
     * Processes all dunning sequences that need action.
     * This would typically be called by a scheduled job.
     */
    fun processScheduledActions(): DunningProcessResult {
        var retriesAttempted = 0
        var suspensions = 0
        var deactivations = 0
        var notificationsSent = 0

        // Process retries
        for (dunning in getReadyForRetry()) {
            // In a real implementation, this would call the payment processor
            retriesAttempted++
        }

        // Process suspensions
        for (dunning in getReadyForSuspension()) {
            suspendSubscription(dunning.id)
            suspensions++
        }

        // Process deactivations
        for (dunning in getReadyForDeactivation()) {
            deactivateAccount(dunning.id)
            deactivations++
        }

        // Process notification steps
        for (dunning in dunningRepository.findActive(Pageable.ofSize(1000)).content) {
            val pendingStep = dunning.getNextPendingStep()
            if (pendingStep != null) {
                // In a real implementation, this would send the notification
                pendingStep.markAsSent()
                dunningRepository.save(dunning)
                notificationsSent++

                if (pendingStep.escalateToCsm) {
                    escalateToCsm(dunning.id)
                }
            }
        }

        return DunningProcessResult(
            retriesAttempted = retriesAttempted,
            suspensions = suspensions,
            deactivations = deactivations,
            notificationsSent = notificationsSent
        )
    }
}

/**
 * Dunning statistics for platform dashboard.
 */
data class DunningStatistics(
    val activeCount: Long,
    val suspendedCount: Long,
    val recoveredCount: Long,
    val deactivatedCount: Long,
    val recoveryRate: Double
) {
    val recoveryPercent: Double
        get() = recoveryRate * 100
}

/**
 * Result of processing scheduled dunning actions.
 */
data class DunningProcessResult(
    val retriesAttempted: Int,
    val suspensions: Int,
    val deactivations: Int,
    val notificationsSent: Int
)
