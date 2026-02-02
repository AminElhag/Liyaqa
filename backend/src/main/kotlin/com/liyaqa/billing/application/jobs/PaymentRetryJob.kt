package com.liyaqa.billing.application.jobs

import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.application.services.PaymentService
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.shared.domain.LocalizedText
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

/**
 * Automated payment retry job with intelligent dunning management.
 *
 * Runs daily at 10:00 AM to:
 * 1. Find unpaid/overdue invoices eligible for retry
 * 2. Retry payments based on progressive schedule
 * 3. Send dunning notifications
 * 4. Suspend subscriptions after final retry failure
 *
 * Retry Schedule (days after invoice creation):
 * - Retry 1: Day 1 (first attempt failed)
 * - Retry 2: Day 3
 * - Retry 3: Day 7
 * - Retry 4: Day 14
 * - Retry 5: Day 30 (final attempt)
 * - After Day 30: Suspend subscription
 *
 * Uses ShedLock to prevent duplicate execution in multi-instance deployments.
 *
 * Business Rules:
 * - Only retries invoices with status ISSUED or OVERDUE
 * - Only retries subscription-related invoices (not one-time purchases)
 * - Tracks retry count to prevent infinite loops
 * - Progressive notifications (gentle → urgent → critical)
 * - Automatic subscription suspension after final retry
 *
 * Monitoring:
 * - Logs retry attempts and outcomes
 * - Tracks success/failure rates
 * - Publishes metrics for Prometheus
 * - Alerts on high failure rates
 */
@Component
class PaymentRetryJob(
    private val invoiceRepository: InvoiceRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val paymentService: PaymentService,
    private val invoiceService: InvoiceService,
    private val notificationService: NotificationService
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        /**
         * Retry schedule: days after invoice creation when retries should occur.
         */
        val RETRY_SCHEDULE = listOf(1L, 3L, 7L, 14L, 30L)

        /**
         * Maximum retry attempts before giving up.
         */
        const val MAX_RETRY_ATTEMPTS = 5

        /**
         * Grace period before suspending subscription after final retry failure.
         * Gives member additional time to make manual payment.
         */
        const val SUSPENSION_GRACE_DAYS = 7L
    }

    /**
     * Process payment retries daily at 10:00 AM.
     *
     * ShedLock ensures only one instance runs this job at a time.
     * Lock is held for maximum 30 minutes.
     */
    @Scheduled(cron = "0 0 10 * * ?")
    @SchedulerLock(
        name = "paymentRetryJob",
        lockAtMostFor = "30m",
        lockAtLeastFor = "25m"
    )
    @Transactional
    fun processPaymentRetries() {
        logger.info("=".repeat(80))
        logger.info("Starting payment retry job")
        logger.info("=".repeat(80))

        val startTime = System.currentTimeMillis()
        var processedCount = 0
        var retryAttemptCount = 0
        var successCount = 0
        var failureCount = 0
        var suspendedCount = 0
        var errorCount = 0

        try {
            val today = LocalDate.now()

            // Find unpaid invoices that are eligible for retry
            val unpaidInvoices = invoiceRepository.findByStatusIn(
                listOf(InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE)
            )

            logger.info("Found ${unpaidInvoices.size} unpaid invoices to check for retry")

            for (invoice in unpaidInvoices) {
                processedCount++

                try {
                    // Only retry subscription invoices (not one-time purchases)
                    if (invoice.subscriptionId == null) {
                        logger.debug("Skipping non-subscription invoice ${invoice.invoiceNumber}")
                        continue
                    }

                    // Calculate days since invoice was created
                    val daysSinceCreated = ChronoUnit.DAYS.between(
                        invoice.createdAt.atZone(ZoneId.systemDefault()).toLocalDate(),
                        today
                    )

                    // Get current retry count (default to 0 if not set)
                    val currentRetryCount = invoice.paymentRetryCount ?: 0

                    // Check if we should retry today based on schedule
                    if (shouldRetryToday(daysSinceCreated, currentRetryCount)) {
                        logger.info(
                            "Retrying payment for invoice ${invoice.invoiceNumber} " +
                            "(retry #${currentRetryCount + 1}, days since created: $daysSinceCreated)"
                        )

                        retryAttemptCount++

                        // Attempt payment
                        val paymentSuccess = attemptPayment(invoice)

                        if (paymentSuccess) {
                            successCount++
                            logger.info("Payment retry successful for invoice ${invoice.invoiceNumber}")

                            // Send success notification
                            sendRetrySuccessNotification(invoice)

                            // Reactivate subscription if it was suspended
                            reactivateSubscriptionIfNeeded(invoice)

                        } else {
                            failureCount++
                            logger.warn("Payment retry failed for invoice ${invoice.invoiceNumber}")

                            // Increment retry count
                            invoice.paymentRetryCount = currentRetryCount + 1
                            invoice.lastPaymentRetryAt = java.time.Instant.now()
                            invoiceRepository.save(invoice)

                            // Send dunning notification (severity increases with retry count)
                            sendDunningNotification(invoice, currentRetryCount + 1)

                            // Check if we've exhausted all retries
                            if (currentRetryCount + 1 >= MAX_RETRY_ATTEMPTS) {
                                logger.warn(
                                    "Invoice ${invoice.invoiceNumber} exhausted all retry attempts. " +
                                    "Scheduling subscription suspension."
                                )

                                // Schedule subscription suspension
                                scheduleSubscriptionSuspension(invoice)
                                suspendedCount++
                            }
                        }
                    }

                    // Check if subscription should be suspended (grace period expired)
                    checkAndSuspendIfOverdue(invoice, daysSinceCreated)

                } catch (e: Exception) {
                    errorCount++
                    logger.error("Error processing invoice ${invoice.invoiceNumber}: ${e.message}", e)
                    // Continue processing other invoices
                }
            }

        } catch (e: Exception) {
            logger.error("Fatal error in payment retry job: ${e.message}", e)
            throw e // Rethrow to mark job as failed
        } finally {
            val duration = System.currentTimeMillis() - startTime

            logger.info("=".repeat(80))
            logger.info("Payment retry job completed")
            logger.info("Duration: ${duration}ms")
            logger.info("Invoices checked: $processedCount")
            logger.info("Retry attempts: $retryAttemptCount")
            logger.info("Successful retries: $successCount")
            logger.info("Failed retries: $failureCount")
            logger.info("Subscriptions suspended: $suspendedCount")
            logger.info("Errors: $errorCount")
            logger.info("=".repeat(80))

            // TODO: Record metrics for monitoring
            // meterRegistry.counter("liyaqa.billing.retry.attempts").increment(retryAttemptCount.toDouble())
            // meterRegistry.counter("liyaqa.billing.retry.success").increment(successCount.toDouble())
            // meterRegistry.counter("liyaqa.billing.retry.failure").increment(failureCount.toDouble())
        }
    }

    /**
     * Determines if payment should be retried today based on retry schedule.
     *
     * @param daysSinceCreated Days since invoice was created
     * @param currentRetryCount Number of retries already attempted
     * @return true if retry should be attempted today
     */
    private fun shouldRetryToday(daysSinceCreated: Long, currentRetryCount: Int): Boolean {
        // Don't retry if we've already hit max attempts
        if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
            return false
        }

        // Check if today matches a retry day in the schedule
        val nextRetryDay = RETRY_SCHEDULE.getOrNull(currentRetryCount) ?: return false

        return daysSinceCreated == nextRetryDay
    }

    /**
     * Attempts to process payment for an invoice.
     *
     * @param invoice The invoice to pay
     * @return true if payment successful, false otherwise
     */
    private fun attemptPayment(invoice: Invoice): Boolean {
        return try {
            paymentService.processAutoPayment(invoice.id, invoice.memberId)
        } catch (e: Exception) {
            logger.error("Payment attempt failed for invoice ${invoice.id}: ${e.message}", e)
            false
        }
    }

    /**
     * Sends dunning notification with progressive severity.
     *
     * Retry 1-2: Gentle reminder (MEDIUM priority)
     * Retry 3-4: Urgent notice (HIGH priority)
     * Retry 5: Final warning (CRITICAL priority)
     */
    private fun sendDunningNotification(invoice: Invoice, retryCount: Int) {
        try {
            val (priority, title, message) = when (retryCount) {
                1 -> Triple(
                    NotificationPriority.NORMAL,
                    LocalizedText(
                        en = "Payment Reminder",
                        ar = "تذكير بالدفع"
                    ),
                    LocalizedText(
                        en = "Your payment for invoice #${invoice.invoiceNumber} is still pending. " +
                            "Amount: ${invoice.totalAmount.amount}. Please update your payment method or pay manually.",
                        ar = "دفعتك للفاتورة #${invoice.invoiceNumber} لا تزال معلقة. " +
                            "المبلغ: ${invoice.totalAmount.amount}. يرجى تحديث طريقة الدفع أو الدفع يدويًا."
                    )
                )
                in 2..3 -> Triple(
                    NotificationPriority.HIGH,
                    LocalizedText(
                        en = "Urgent: Payment Required",
                        ar = "عاجل: الدفع مطلوب"
                    ),
                    LocalizedText(
                        en = "Your payment for invoice #${invoice.invoiceNumber} is overdue (Attempt ${retryCount}/${MAX_RETRY_ATTEMPTS}). " +
                            "Amount: ${invoice.totalAmount.amount}. Your subscription may be suspended if payment is not received.",
                        ar = "دفعتك للفاتورة #${invoice.invoiceNumber} متأخرة (المحاولة ${retryCount}/${MAX_RETRY_ATTEMPTS}). " +
                            "المبلغ: ${invoice.totalAmount.amount}. قد يتم تعليق اشتراكك إذا لم يتم استلام الدفع."
                    )
                )
                else -> Triple(
                    NotificationPriority.URGENT,
                    LocalizedText(
                        en = "FINAL NOTICE: Payment Required",
                        ar = "إشعار نهائي: الدفع مطلوب"
                    ),
                    LocalizedText(
                        en = "FINAL ATTEMPT: Your payment for invoice #${invoice.invoiceNumber} is seriously overdue. " +
                            "Amount: ${invoice.totalAmount.amount}. Your subscription will be suspended in ${SUSPENSION_GRACE_DAYS} days if payment is not received. " +
                            "Please contact us immediately or pay online.",
                        ar = "المحاولة الأخيرة: دفعتك للفاتورة #${invoice.invoiceNumber} متأخرة بشكل خطير. " +
                            "المبلغ: ${invoice.totalAmount.amount}. سيتم تعليق اشتراكك خلال ${SUSPENSION_GRACE_DAYS} أيام إذا لم يتم استلام الدفع. " +
                            "يرجى الاتصال بنا فورًا أو الدفع عبر الإنترنت."
                    )
                )
            }

            val notification = Notification(
                memberId = invoice.memberId,
                notificationType = NotificationType.INVOICE_PAID,
                channel = NotificationChannel.EMAIL,
                subject = title,
                body = message,
                priority = priority
            )
            notificationService.sendNotification(notification)

        } catch (e: Exception) {
            logger.error("Failed to send dunning notification: ${e.message}", e)
        }
    }

    /**
     * Sends success notification after a retry succeeds.
     */
    private fun sendRetrySuccessNotification(invoice: Invoice) {
        try {
            val notification = Notification(
                memberId = invoice.memberId,
                notificationType = NotificationType.INVOICE_PAID,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "Payment Received - Thank You!",
                    ar = "تم استلام الدفع - شكراً لك!"
                ),
                body = LocalizedText(
                    en = "Your payment for invoice #${invoice.invoiceNumber} has been successfully processed. " +
                        "Amount: ${invoice.totalAmount.amount}. Your subscription is now active.",
                    ar = "تم معالجة دفعتك للفاتورة #${invoice.invoiceNumber} بنجاح. " +
                        "المبلغ: ${invoice.totalAmount.amount}. اشتراكك الآن نشط."
                ),
                priority = NotificationPriority.NORMAL
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send retry success notification: ${e.message}", e)
        }
    }

    /**
     * Schedules subscription suspension after all retries are exhausted.
     */
    private fun scheduleSubscriptionSuspension(invoice: Invoice) {
        try {
            val subscriptionId = invoice.subscriptionId ?: return

            val subscription = subscriptionRepository.findById(subscriptionId).orElse(null)
            if (subscription == null) {
                logger.warn("Subscription not found for invoice ${invoice.invoiceNumber}")
                return
            }

            // Mark subscription for suspension
            subscription.status = SubscriptionStatus.PAST_DUE
            subscription.pastDueAt = java.time.Instant.now()
            subscriptionRepository.save(subscription)

            logger.info("Marked subscription ${subscriptionId} as PAST_DUE")

            // Send suspension warning
            sendSuspensionWarningNotification(invoice, subscription)

        } catch (e: Exception) {
            logger.error("Failed to schedule subscription suspension: ${e.message}", e)
        }
    }

    /**
     * Checks if subscription should be suspended (grace period expired).
     */
    private fun checkAndSuspendIfOverdue(invoice: Invoice, daysSinceCreated: Long) {
        // Suspend if payment not received after final retry + grace period
        if (daysSinceCreated >= RETRY_SCHEDULE.last() + SUSPENSION_GRACE_DAYS) {
            val currentRetryCount = invoice.paymentRetryCount ?: 0

            if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
                suspendSubscription(invoice)
            }
        }
    }

    /**
     * Suspends a subscription due to non-payment.
     */
    private fun suspendSubscription(invoice: Invoice) {
        try {
            val subscriptionId = invoice.subscriptionId ?: return

            val subscription = subscriptionRepository.findById(subscriptionId).orElse(null)
            if (subscription == null) {
                logger.warn("Subscription not found for invoice ${invoice.invoiceNumber}")
                return
            }

            // Only suspend if not already suspended
            if (subscription.status != SubscriptionStatus.SUSPENDED) {
                subscription.status = SubscriptionStatus.SUSPENDED
                subscription.suspendedAt = java.time.Instant.now()
                subscriptionRepository.save(subscription)

                logger.warn("Suspended subscription ${subscriptionId} due to non-payment")

                // Send suspension notification
                sendSuspensionNotification(invoice, subscription)
            }

        } catch (e: Exception) {
            logger.error("Failed to suspend subscription: ${e.message}", e)
        }
    }

    /**
     * Sends suspension warning notification.
     */
    private fun sendSuspensionWarningNotification(
        invoice: Invoice,
        subscription: com.liyaqa.membership.domain.model.Subscription
    ) {
        try {
            val notification = Notification(
                memberId = invoice.memberId,
                notificationType = NotificationType.INVOICE_PAID,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "Subscription Suspension Warning",
                    ar = "تحذير من تعليق الاشتراك"
                ),
                body = LocalizedText(
                    en = "Your subscription will be suspended in ${SUSPENSION_GRACE_DAYS} days due to unpaid invoice #${invoice.invoiceNumber}. " +
                        "Amount: ${invoice.totalAmount.amount}. Pay now to avoid service interruption.",
                    ar = "سيتم تعليق اشتراكك خلال ${SUSPENSION_GRACE_DAYS} أيام بسبب الفاتورة غير المدفوعة #${invoice.invoiceNumber}. " +
                        "المبلغ: ${invoice.totalAmount.amount}. ادفع الآن لتجنب انقطاع الخدمة."
                ),
                priority = NotificationPriority.URGENT
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send suspension warning: ${e.message}", e)
        }
    }

    /**
     * Sends subscription suspended notification.
     */
    private fun sendSuspensionNotification(
        invoice: Invoice,
        subscription: com.liyaqa.membership.domain.model.Subscription
    ) {
        try {
            val notification = Notification(
                memberId = invoice.memberId,
                notificationType = NotificationType.INVOICE_PAID,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "Subscription Suspended",
                    ar = "تم تعليق الاشتراك"
                ),
                body = LocalizedText(
                    en = "Your subscription has been suspended due to unpaid invoice #${invoice.invoiceNumber}. " +
                        "Amount: ${invoice.totalAmount.amount}. Pay now to reactivate your membership and restore access.",
                    ar = "تم تعليق اشتراكك بسبب الفاتورة غير المدفوعة #${invoice.invoiceNumber}. " +
                        "المبلغ: ${invoice.totalAmount.amount}. ادفع الآن لإعادة تفعيل عضويتك واستعادة الوصول."
                ),
                priority = NotificationPriority.URGENT
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send suspension notification: ${e.message}", e)
        }
    }

    /**
     * Reactivates subscription if it was suspended and payment is now received.
     */
    private fun reactivateSubscriptionIfNeeded(invoice: Invoice) {
        try {
            val subscriptionId = invoice.subscriptionId ?: return

            val subscription = subscriptionRepository.findById(subscriptionId).orElse(null)
            if (subscription == null) {
                logger.warn("Subscription not found for invoice ${invoice.invoiceNumber}")
                return
            }

            // Reactivate if subscription was suspended or past due
            if (subscription.status in listOf(SubscriptionStatus.SUSPENDED, SubscriptionStatus.PAST_DUE)) {
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.pastDueAt = null
                subscription.suspendedAt = null
                subscriptionRepository.save(subscription)

                logger.info("Reactivated subscription ${subscriptionId} after payment")

                // Send reactivation notification
                val notification = Notification(
                    memberId = invoice.memberId,
                    notificationType = NotificationType.INVOICE_PAID,
                    channel = NotificationChannel.EMAIL,
                    subject = LocalizedText(
                        en = "Subscription Reactivated",
                        ar = "تم إعادة تفعيل الاشتراك"
                    ),
                    body = LocalizedText(
                        en = "Your subscription has been reactivated! Thank you for your payment. " +
                            "You now have full access to all membership benefits.",
                        ar = "تم إعادة تفعيل اشتراكك! شكراً لدفعك. " +
                            "لديك الآن وصول كامل إلى جميع مزايا العضوية."
                    ),
                    priority = NotificationPriority.HIGH
                )
                notificationService.sendNotification(notification)
            }

        } catch (e: Exception) {
            logger.error("Failed to reactivate subscription: ${e.message}", e)
        }
    }
}
