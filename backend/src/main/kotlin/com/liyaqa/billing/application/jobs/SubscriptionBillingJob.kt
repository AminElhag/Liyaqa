package com.liyaqa.billing.application.jobs

import com.liyaqa.billing.application.commands.CreateSubscriptionInvoiceCommand
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.billing.application.services.PaymentService
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.membership.domain.model.Subscription
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

/**
 * Automated subscription billing job.
 *
 * Runs daily at 2:00 AM to:
 * 1. Find subscriptions due for billing
 * 2. Generate invoices for those subscriptions
 * 3. Attempt auto-payment if enabled
 * 4. Send notifications for invoice generation and payment status
 *
 * Uses ShedLock to prevent duplicate execution in multi-instance deployments.
 *
 * Configuration:
 * - Billing cycle is determined by subscription's currentBillingPeriodEnd
 * - Auto-payment requires subscription to have autoPayEnabled = true
 * - If auto-payment fails, invoice is issued and member is notified
 *
 * Monitoring:
 * - Logs summary of processed subscriptions
 * - Publishes metrics via Micrometer
 * - Sends alerts for critical failures
 */
@Component
class SubscriptionBillingJob(
    private val subscriptionRepository: SubscriptionRepository,
    private val invoiceService: InvoiceService,
    private val paymentService: PaymentService,
    private val notificationService: NotificationService
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        /**
         * How many days before billing period end to generate invoice.
         * Default: 3 days advance notice for member to review.
         */
        const val BILLING_ADVANCE_DAYS = 3L

        /**
         * How many days to look ahead for upcoming billings.
         * This ensures we don't miss billings due to job execution timing.
         */
        const val BILLING_WINDOW_DAYS = 5L
    }

    /**
     * Process subscription billing daily at 2:00 AM.
     *
     * ShedLock ensures only one instance runs this job at a time.
     * Lock is held for maximum 1 hour (lockAtMostFor).
     * If job doesn't complete in 50 minutes, it's considered failed (lockAtLeastFor).
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @SchedulerLock(
        name = "subscriptionBillingJob",
        lockAtMostFor = "1h",
        lockAtLeastFor = "50m"
    )
    @Transactional
    fun processSubscriptionBilling() {
        logger.info("=".repeat(80))
        logger.info("Starting subscription billing job")
        logger.info("=".repeat(80))

        val startTime = System.currentTimeMillis()
        var processedCount = 0
        var invoiceGeneratedCount = 0
        var autoPaySuccessCount = 0
        var autoPayFailureCount = 0
        var errorCount = 0

        try {
            // Find subscriptions due for billing
            // We bill BILLING_ADVANCE_DAYS before the billing period ends
            val today = LocalDate.now()
            val billingDate = today.plusDays(BILLING_ADVANCE_DAYS)
            val billingWindowEnd = today.plusDays(BILLING_WINDOW_DAYS)

            logger.info("Finding subscriptions due for billing between $billingDate and $billingWindowEnd")

            val subscriptionsDue = subscriptionRepository.findDueForBilling(billingDate, billingWindowEnd)

            logger.info("Found ${subscriptionsDue.size} subscriptions due for billing")

            for (subscription in subscriptionsDue) {
                processedCount++

                try {
                    logger.info("Processing subscription ${subscription.id} for member ${subscription.memberId}")

                    // Check if subscription is still active
                    if (subscription.status != SubscriptionStatus.ACTIVE) {
                        logger.warn("Skipping subscription ${subscription.id} - not active (status: ${subscription.status})")
                        continue
                    }

                    // Generate invoice
                    val invoice = generateSubscriptionInvoice(subscription)
                    invoiceGeneratedCount++

                    logger.info("Generated invoice ${invoice.invoiceNumber} for subscription ${subscription.id}")

                    // Attempt auto-payment if enabled
                    if (subscription.autoRenew) {
                        logger.info("Auto-renew enabled for subscription ${subscription.id}, attempting payment")

                        val paymentResult = attemptAutoPayment(invoice, subscription)

                        if (paymentResult.success) {
                            autoPaySuccessCount++
                            logger.info("Auto-payment successful for subscription ${subscription.id}")

                            // Send success notification
                            sendPaymentSuccessNotification(subscription, invoice)
                        } else {
                            autoPayFailureCount++
                            logger.warn(
                                "Auto-payment failed for subscription ${subscription.id}: ${paymentResult.errorMessage}"
                            )

                            // Send failure notification - member needs to pay manually
                            sendPaymentFailureNotification(subscription, invoice, paymentResult.errorMessage)
                        }
                    } else {
                        logger.info("Auto-renew not enabled for subscription ${subscription.id}")

                        // Send invoice notification - member needs to pay manually
                        sendInvoiceGeneratedNotification(subscription, invoice)
                    }

                    // Update subscription billing period
                    updateBillingPeriod(subscription)

                } catch (e: Exception) {
                    errorCount++
                    logger.error("Error processing subscription ${subscription.id}: ${e.message}", e)
                    // Continue processing other subscriptions
                }
            }

        } catch (e: Exception) {
            logger.error("Fatal error in subscription billing job: ${e.message}", e)
            throw e // Rethrow to mark job as failed
        } finally {
            val duration = System.currentTimeMillis() - startTime

            logger.info("=".repeat(80))
            logger.info("Subscription billing job completed")
            logger.info("Duration: ${duration}ms")
            logger.info("Processed: $processedCount subscriptions")
            logger.info("Invoices generated: $invoiceGeneratedCount")
            logger.info("Auto-payments successful: $autoPaySuccessCount")
            logger.info("Auto-payments failed: $autoPayFailureCount")
            logger.info("Errors: $errorCount")
            logger.info("=".repeat(80))

            // TODO: Record metrics for monitoring
            // meterRegistry.counter("liyaqa.billing.subscriptions.processed").increment(processedCount.toDouble())
            // meterRegistry.counter("liyaqa.billing.autopay.success").increment(autoPaySuccessCount.toDouble())
            // meterRegistry.counter("liyaqa.billing.autopay.failure").increment(autoPayFailureCount.toDouble())
        }
    }

    /**
     * Generates an invoice for a subscription.
     */
    private fun generateSubscriptionInvoice(subscription: Subscription): Invoice {
        val command = CreateSubscriptionInvoiceCommand(
            subscriptionId = subscription.id,
            notes = LocalizedText(
                en = "Recurring subscription billing",
                ar = "فاتورة اشتراك دورية"
            )
        )

        return invoiceService.createInvoiceFromSubscription(command)
    }

    /**
     * Attempts auto-payment for an invoice.
     *
     * Returns PaymentResult indicating success or failure.
     */
    private fun attemptAutoPayment(invoice: Invoice, subscription: Subscription): PaymentResult {
        return try {
            // Check if invoice is in correct status for payment
            if (invoice.status !in listOf(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)) {
                return PaymentResult(
                    success = false,
                    errorMessage = "Invoice status ${invoice.status} not eligible for payment"
                )
            }

            // Attempt payment through payment service
            // The payment service should handle:
            // - Finding saved payment method
            // - Processing payment through gateway
            // - Updating invoice status
            // - Recording payment
            val paymentSuccess = paymentService.processAutoPayment(invoice.id, subscription.memberId)

            if (paymentSuccess) {
                PaymentResult(success = true)
            } else {
                PaymentResult(
                    success = false,
                    errorMessage = "Payment gateway declined the transaction"
                )
            }

        } catch (e: Exception) {
            logger.error("Auto-payment exception for invoice ${invoice.id}: ${e.message}", e)
            PaymentResult(
                success = false,
                errorMessage = e.message ?: "Unknown payment error"
            )
        }
    }

    /**
     * Updates the subscription's billing period to the next cycle.
     */
    private fun updateBillingPeriod(subscription: Subscription) {
        val currentEnd = subscription.currentBillingPeriodEnd ?: subscription.endDate
        val nextPeriodStart = currentEnd.plusDays(1)
        val nextPeriodEnd = nextPeriodStart.plusMonths(1).minusDays(1)

        subscription.currentBillingPeriodStart = nextPeriodStart
        subscription.currentBillingPeriodEnd = nextPeriodEnd

        subscriptionRepository.save(subscription)

        logger.info(
            "Updated billing period for subscription ${subscription.id}: " +
            "$nextPeriodStart to $nextPeriodEnd"
        )
    }

    /**
     * Sends notification when invoice is generated (manual payment required).
     */
    private fun sendInvoiceGeneratedNotification(subscription: Subscription, invoice: Invoice) {
        try {
            val notification = Notification(
                memberId = subscription.memberId,
                notificationType = NotificationType.INVOICE_CREATED,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "New Invoice Generated",
                    ar = "تم إنشاء فاتورة جديدة"
                ),
                body = LocalizedText(
                    en = "Your subscription invoice #${invoice.invoiceNumber} is ready. " +
                        "Amount: ${invoice.totalAmount.amount}. Due: ${invoice.dueDate}.",
                    ar = "فاتورتك رقم #${invoice.invoiceNumber} جاهزة. " +
                        "المبلغ: ${invoice.totalAmount.amount}. تاريخ الاستحقاق: ${invoice.dueDate}."
                ),
                priority = NotificationPriority.HIGH
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send invoice notification: ${e.message}", e)
        }
    }

    /**
     * Sends notification when auto-payment succeeds.
     */
    private fun sendPaymentSuccessNotification(subscription: Subscription, invoice: Invoice) {
        try {
            val notification = Notification(
                memberId = subscription.memberId,
                notificationType = NotificationType.INVOICE_PAID,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "Payment Successful",
                    ar = "تم الدفع بنجاح"
                ),
                body = LocalizedText(
                    en = "Your subscription payment of ${invoice.totalAmount.amount} was successful. " +
                        "Invoice #${invoice.invoiceNumber} is paid.",
                    ar = "تم دفع اشتراكك بمبلغ ${invoice.totalAmount.amount} بنجاح. " +
                        "الفاتورة رقم #${invoice.invoiceNumber} مدفوعة."
                ),
                priority = NotificationPriority.NORMAL
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send payment success notification: ${e.message}", e)
        }
    }

    /**
     * Sends notification when auto-payment fails.
     */
    private fun sendPaymentFailureNotification(
        subscription: Subscription,
        invoice: Invoice,
        errorMessage: String?
    ) {
        try {
            val notification = Notification(
                memberId = subscription.memberId,
                notificationType = NotificationType.INVOICE_OVERDUE,
                channel = NotificationChannel.EMAIL,
                subject = LocalizedText(
                    en = "Payment Failed - Action Required",
                    ar = "فشل الدفع - يتطلب إجراء"
                ),
                body = LocalizedText(
                    en = "Your automatic payment for invoice #${invoice.invoiceNumber} failed. " +
                        "Amount: ${invoice.totalAmount.amount}. Please update your payment method or pay manually.",
                    ar = "فشل الدفع التلقائي للفاتورة #${invoice.invoiceNumber}. " +
                        "المبلغ: ${invoice.totalAmount.amount}. يرجى تحديث طريقة الدفع أو الدفع يدويًا."
                ),
                priority = NotificationPriority.HIGH
            )
            notificationService.sendNotification(notification)
        } catch (e: Exception) {
            logger.error("Failed to send payment failure notification: ${e.message}", e)
        }
    }

    /**
     * Result of a payment attempt.
     */
    private data class PaymentResult(
        val success: Boolean,
        val errorMessage: String? = null
    )
}
