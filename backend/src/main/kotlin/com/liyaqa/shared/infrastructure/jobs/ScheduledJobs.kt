package com.liyaqa.shared.infrastructure.jobs

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Scheduled jobs for background processing.
 */
@Component
class ScheduledJobs(
    private val subscriptionRepository: SubscriptionRepository,
    private val invoiceService: InvoiceService,
    private val attendanceService: AttendanceService,
    private val authService: AuthService
) {
    private val logger = LoggerFactory.getLogger(ScheduledJobs::class.java)

    /**
     * Expires subscriptions that have passed their end date.
     * Runs daily at 1:00 AM.
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    fun expireSubscriptions() {
        logger.info("Running subscription expiration job...")

        val today = LocalDate.now()
        var expiredCount = 0

        // Find all active subscriptions that have expired
        val activeSubscriptions = subscriptionRepository.findByStatus(
            SubscriptionStatus.ACTIVE,
            Pageable.unpaged()
        )

        for (subscription in activeSubscriptions) {
            if (subscription.isExpired()) {
                subscription.expire()
                subscriptionRepository.save(subscription)
                expiredCount++
            }
        }

        logger.info("Subscription expiration job completed. Expired $expiredCount subscriptions.")
    }

    /**
     * Marks overdue invoices that have passed their due date.
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    fun markOverdueInvoices() {
        logger.info("Running invoice overdue job...")

        val overdueCount = invoiceService.markOverdueInvoices()

        logger.info("Invoice overdue job completed. Marked $overdueCount invoices as overdue.")
    }

    /**
     * Auto-checks out members who are still checked in from the previous day.
     * Runs daily at midnight.
     */
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    fun autoCheckoutMembers() {
        logger.info("Running auto-checkout job...")

        val checkedOutCount = attendanceService.autoCheckoutPreviousDayMembers()

        logger.info("Auto-checkout job completed. Auto-checked out $checkedOutCount members.")
    }

    /**
     * Cleanup job for expired password reset tokens.
     * Runs every hour.
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    fun cleanupExpiredTokens() {
        logger.info("Running token cleanup job...")
        authService.cleanupExpiredResetTokens()
        logger.info("Token cleanup job completed.")
    }
}
