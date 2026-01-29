package com.liyaqa.platform.domain.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.CollectionTable
import jakarta.persistence.Column
import jakarta.persistence.ElementCollection
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToMany
import jakarta.persistence.OrderBy
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Represents a dunning (payment recovery) process for a failed subscription payment.
 * Tracks the sequence of retry attempts and notifications.
 *
 * This is a platform-level entity for B2B payment recovery.
 */
@Entity
@Table(name = "dunning_sequences")
class DunningSequence(
    id: UUID = UUID.randomUUID(),

    /**
     * The organization this dunning sequence is for.
     */
    @Column(name = "organization_id", nullable = false)
    var organizationId: UUID,

    /**
     * The subscription with the failed payment.
     */
    @Column(name = "subscription_id", nullable = false)
    var subscriptionId: UUID,

    /**
     * The invoice with the failed payment.
     */
    @Column(name = "invoice_id", nullable = false)
    var invoiceId: UUID,

    /**
     * Original payment amount.
     */
    @Column(name = "amount", nullable = false)
    var amount: java.math.BigDecimal,

    /**
     * Currency code.
     */
    @Column(name = "currency", nullable = false)
    var currency: String = "SAR",

    /**
     * Current status of the dunning process.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: DunningStatus = DunningStatus.ACTIVE,

    /**
     * Date of initial payment failure.
     */
    @Column(name = "failed_at", nullable = false)
    var failedAt: Instant = Instant.now(),

    /**
     * Number of automatic retry attempts made.
     */
    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0,

    /**
     * Maximum retry attempts allowed.
     */
    @Column(name = "max_retries", nullable = false)
    var maxRetries: Int = 3,

    /**
     * Date of next scheduled retry.
     */
    @Column(name = "next_retry_date")
    var nextRetryDate: LocalDate? = null,

    /**
     * Date of last retry attempt.
     */
    @Column(name = "last_retry_at")
    var lastRetryAt: Instant? = null,

    /**
     * Result of last retry attempt.
     */
    @Column(name = "last_retry_result")
    var lastRetryResult: String? = null,

    /**
     * Day number when subscription gets suspended (relative to failedAt).
     */
    @Column(name = "suspension_day", nullable = false)
    var suspensionDay: Int = 10,

    /**
     * Day number when account gets deactivated (relative to failedAt).
     */
    @Column(name = "deactivation_day", nullable = false)
    var deactivationDay: Int = 30,

    /**
     * Whether subscription has been suspended.
     */
    @Column(name = "is_suspended", nullable = false)
    var isSuspended: Boolean = false,

    /**
     * Date when subscription was suspended.
     */
    @Column(name = "suspended_at")
    var suspendedAt: Instant? = null,

    /**
     * Date when payment was recovered.
     */
    @Column(name = "recovered_at")
    var recoveredAt: Instant? = null,

    /**
     * Recovery method used (e.g., "automatic_retry", "manual_payment", "card_updated").
     */
    @Column(name = "recovery_method")
    var recoveryMethod: String? = null,

    /**
     * Reason for failure (from payment processor).
     */
    @Column(name = "failure_reason")
    var failureReason: String? = null,

    /**
     * Whether CSM has been escalated.
     */
    @Column(name = "csm_escalated", nullable = false)
    var csmEscalated: Boolean = false,

    /**
     * When CSM was escalated.
     */
    @Column(name = "csm_escalated_at")
    var csmEscalatedAt: Instant? = null,

    /**
     * CSM assigned to handle this dunning.
     */
    @Column(name = "csm_id")
    var csmId: UUID? = null,

    /**
     * Notes from CSM or support.
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null

) : OrganizationLevelEntity(id) {

    /**
     * Dunning steps (notifications sent).
     */
    @OneToMany(mappedBy = "dunningSequence", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dayAfterFailure ASC")
    var steps: MutableList<DunningStep> = mutableListOf()

    companion object {
        // Default retry schedule (days after failure)
        val DEFAULT_RETRY_DAYS = listOf(0, 3, 7)

        // Thresholds
        const val DEFAULT_SUSPENSION_DAY = 10
        const val DEFAULT_DEACTIVATION_DAY = 30

        /**
         * Creates a new dunning sequence for a failed payment.
         */
        fun create(
            organizationId: UUID,
            subscriptionId: UUID,
            invoiceId: UUID,
            amount: java.math.BigDecimal,
            currency: String,
            failureReason: String?
        ): DunningSequence {
            val dunning = DunningSequence(
                organizationId = organizationId,
                subscriptionId = subscriptionId,
                invoiceId = invoiceId,
                amount = amount,
                currency = currency,
                failedAt = Instant.now(),
                failureReason = failureReason,
                nextRetryDate = LocalDate.now().plusDays(3) // First retry in 3 days
            )

            // Add default notification steps
            dunning.steps.addAll(createDefaultSteps(dunning))

            return dunning
        }

        /**
         * Creates the default notification steps.
         */
        private fun createDefaultSteps(dunning: DunningSequence): List<DunningStep> {
            return listOf(
                DunningStep(
                    dunningSequence = dunning,
                    dayAfterFailure = 0,
                    channels = "IN_APP",
                    description = "In-app alert: Payment failed",
                    template = "payment_failed_alert"
                ),
                DunningStep(
                    dunningSequence = dunning,
                    dayAfterFailure = 1,
                    channels = "SMS,EMAIL",
                    description = "SMS + Email: Payment failed, please update card",
                    template = "payment_failed_day1",
                    includePaymentLink = true
                ),
                DunningStep(
                    dunningSequence = dunning,
                    dayAfterFailure = 3,
                    channels = "EMAIL",
                    description = "Email: Action required - Update payment method",
                    template = "payment_failed_day3",
                    includePaymentLink = true
                ),
                DunningStep(
                    dunningSequence = dunning,
                    dayAfterFailure = 5,
                    channels = "PUSH,EMAIL",
                    description = "Push + Email: Warning about service interruption",
                    template = "payment_failed_day5",
                    includePaymentLink = true
                ),
                DunningStep(
                    dunningSequence = dunning,
                    dayAfterFailure = 7,
                    channels = "EMAIL",
                    description = "Email: Final notice before suspension",
                    template = "payment_failed_final",
                    includePaymentLink = true,
                    escalateToCsm = true
                )
            )
        }
    }

    // ============================================
    // Domain Methods - Retry Management
    // ============================================

    /**
     * Records a retry attempt result.
     */
    fun recordRetryAttempt(success: Boolean, result: String) {
        retryCount++
        lastRetryAt = Instant.now()
        lastRetryResult = result

        if (success) {
            recover("automatic_retry")
        } else {
            scheduleNextRetry()
        }
    }

    /**
     * Schedules the next retry based on the retry schedule.
     */
    private fun scheduleNextRetry() {
        if (retryCount < maxRetries) {
            val daysUntilNextRetry = when (retryCount) {
                1 -> 3
                2 -> 4  // Day 7 (0 + 3 + 4)
                else -> null
            }
            nextRetryDate = daysUntilNextRetry?.let {
                LocalDate.now().plusDays(it.toLong())
            }
        } else {
            nextRetryDate = null
        }
    }

    /**
     * Checks if a retry is due today.
     */
    fun isRetryDue(): Boolean {
        return status == DunningStatus.ACTIVE &&
               retryCount < maxRetries &&
               nextRetryDate != null &&
               !LocalDate.now().isBefore(nextRetryDate)
    }

    // ============================================
    // Domain Methods - Status Transitions
    // ============================================

    /**
     * Marks the dunning as recovered (payment successful).
     */
    fun recover(method: String) {
        status = DunningStatus.RECOVERED
        recoveredAt = Instant.now()
        recoveryMethod = method
        nextRetryDate = null

        // If subscription was suspended, it should be reactivated
        // (handled by the calling service)
    }

    /**
     * Suspends the subscription due to non-payment.
     */
    fun suspend() {
        if (!isSuspended) {
            isSuspended = true
            suspendedAt = Instant.now()
            status = DunningStatus.SUSPENDED
        }
    }

    /**
     * Deactivates the account.
     */
    fun deactivate() {
        status = DunningStatus.DEACTIVATED
    }

    /**
     * Manually resolves the dunning sequence.
     */
    fun resolveManually(notes: String?) {
        status = DunningStatus.RESOLVED
        this.notes = notes
        nextRetryDate = null
    }

    // ============================================
    // Domain Methods - Escalation
    // ============================================

    /**
     * Escalates to CSM.
     */
    fun escalateToCsm(csmId: UUID? = null) {
        if (!csmEscalated) {
            csmEscalated = true
            csmEscalatedAt = Instant.now()
            this.csmId = csmId
        }
    }

    /**
     * Assigns a CSM to handle this dunning.
     */
    fun assignCsm(csmId: UUID) {
        this.csmId = csmId
    }

    // ============================================
    // Domain Methods - Step Management
    // ============================================

    /**
     * Records a notification step being sent.
     */
    fun recordStepSent(step: DunningStep) {
        step.dunningSequence = this
        steps.add(step)
    }

    /**
     * Gets the next step to execute based on days since failure.
     */
    fun getNextPendingStep(): DunningStep? {
        val daysSinceFailure = getDaysSinceFailure()
        return steps.find {
            !it.isSent && it.dayAfterFailure <= daysSinceFailure
        }
    }

    // ============================================
    // Domain Methods - Queries
    // ============================================

    /**
     * Gets the number of days since the initial failure.
     */
    fun getDaysSinceFailure(): Int {
        return java.time.Duration.between(failedAt, Instant.now()).toDays().toInt()
    }

    /**
     * Checks if suspension is due.
     */
    fun isSuspensionDue(): Boolean {
        return status == DunningStatus.ACTIVE &&
               !isSuspended &&
               getDaysSinceFailure() >= suspensionDay
    }

    /**
     * Checks if deactivation is due.
     */
    fun isDeactivationDue(): Boolean {
        return status == DunningStatus.SUSPENDED &&
               getDaysSinceFailure() >= deactivationDay
    }

    /**
     * Checks if dunning is still active.
     */
    fun isActive(): Boolean = status == DunningStatus.ACTIVE

    /**
     * Checks if payment was recovered.
     */
    fun isRecovered(): Boolean = status == DunningStatus.RECOVERED

    /**
     * Gets the number of notifications sent.
     */
    fun getNotificationsSent(): Int = steps.count { it.isSent }

    /**
     * Gets a timeline of events.
     */
    fun getTimeline(): List<DunningEvent> {
        val events = mutableListOf<DunningEvent>()

        // Initial failure
        events.add(DunningEvent(failedAt, "PAYMENT_FAILED", "Payment of $amount $currency failed: $failureReason"))

        // Retry attempts
        lastRetryAt?.let {
            events.add(DunningEvent(it, "RETRY_ATTEMPTED", "Retry attempt #$retryCount: $lastRetryResult"))
        }

        // Notifications
        steps.filter { it.isSent }.forEach { step ->
            step.sentAt?.let {
                events.add(DunningEvent(it, "NOTIFICATION_SENT", "Sent via ${step.channels}: ${step.description}"))
            }
        }

        // Suspension
        suspendedAt?.let {
            events.add(DunningEvent(it, "SUBSCRIPTION_SUSPENDED", "Subscription suspended due to non-payment"))
        }

        // Recovery
        recoveredAt?.let {
            events.add(DunningEvent(it, "PAYMENT_RECOVERED", "Payment recovered via $recoveryMethod"))
        }

        return events.sortedBy { it.timestamp }
    }

}

/**
 * Represents a single notification step in the dunning sequence.
 */
@Entity
@Table(name = "dunning_steps")
class DunningStep(
    @jakarta.persistence.Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    /**
     * Parent dunning sequence.
     */
    @jakarta.persistence.ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dunning_sequence_id", nullable = false)
    var dunningSequence: DunningSequence,

    /**
     * Day after initial failure to send this notification.
     */
    @Column(name = "day_after_failure", nullable = false)
    var dayAfterFailure: Int,

    /**
     * Notification channels (comma-separated: EMAIL, SMS, PUSH, IN_APP).
     */
    @Column(name = "channels", nullable = false)
    var channels: String,

    /**
     * Description of this step.
     */
    @Column(name = "description", nullable = false)
    var description: String,

    /**
     * Email/notification template to use.
     */
    @Column(name = "template", nullable = false)
    var template: String,

    /**
     * Whether to include a direct payment link.
     */
    @Column(name = "include_payment_link", nullable = false)
    var includePaymentLink: Boolean = false,

    /**
     * Whether to escalate to CSM at this step.
     */
    @Column(name = "escalate_to_csm", nullable = false)
    var escalateToCsm: Boolean = false,

    /**
     * Whether this step has been sent.
     */
    @Column(name = "is_sent", nullable = false)
    var isSent: Boolean = false,

    /**
     * When this step was sent.
     */
    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    /**
     * Whether the notification was clicked/opened.
     */
    @Column(name = "clicked", nullable = false)
    var clicked: Boolean = false,

    /**
     * When the notification was clicked.
     */
    @Column(name = "clicked_at")
    var clickedAt: Instant? = null
) {
    /**
     * Marks this step as sent.
     */
    fun markAsSent() {
        isSent = true
        sentAt = Instant.now()
    }

    /**
     * Records a click on this notification.
     */
    fun recordClick() {
        if (!clicked) {
            clicked = true
            clickedAt = Instant.now()
        }
    }

    /**
     * Gets the channels as a list.
     */
    fun getChannelList(): List<NotificationChannel> {
        return channels.split(",").mapNotNull {
            try { NotificationChannel.valueOf(it.trim()) } catch (e: Exception) { null }
        }
    }
}

/**
 * Represents an event in the dunning timeline.
 */
data class DunningEvent(
    val timestamp: Instant,
    val type: String,
    val description: String
)
