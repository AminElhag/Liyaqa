package com.liyaqa.shared.infrastructure.jobs

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.platform.application.services.ClientInvoiceService
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Pageable
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

/**
 * Scheduled jobs for background processing.
 * Uses ShedLock to ensure jobs run only once across multiple instances.
 */
@Component
class ScheduledJobs(
    private val subscriptionRepository: SubscriptionRepository,
    private val invoiceService: InvoiceService,
    private val attendanceService: AttendanceService,
    private val authService: AuthService,
    private val clientInvoiceService: ClientInvoiceService,
    private val membershipPlanService: MembershipPlanService
) {
    private val logger = LoggerFactory.getLogger(ScheduledJobs::class.java)

    /**
     * Expires subscriptions that have passed their end date.
     * Runs daily at 1:00 AM.
     */
    @Scheduled(cron = "0 0 1 * * *")
    @SchedulerLock(name = "expireSubscriptions", lockAtLeastFor = "5m", lockAtMostFor = "30m")
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
     * Deactivates membership plans that have passed their availability end date.
     * Runs daily at 1:30 AM.
     */
    @Scheduled(cron = "0 30 1 * * *")
    @SchedulerLock(name = "expireMembershipPlans", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun expireMembershipPlans() {
        logger.info("Running membership plan expiration job...")

        val expiredPlans = membershipPlanService.deactivateExpiredPlans()

        for (plan in expiredPlans) {
            logger.info("Deactivated expired membership plan: ${plan.id} (${plan.name.en})")
        }

        logger.info("Membership plan expiration job completed. Deactivated ${expiredPlans.size} plans.")
    }

    /**
     * Marks overdue invoices that have passed their due date.
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @SchedulerLock(name = "markOverdueInvoices", lockAtLeastFor = "5m", lockAtMostFor = "30m")
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
    @SchedulerLock(name = "autoCheckoutMembers", lockAtLeastFor = "5m", lockAtMostFor = "30m")
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
    @SchedulerLock(name = "cleanupExpiredTokens", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    @Transactional
    fun cleanupExpiredTokens() {
        logger.info("Running token cleanup job...")
        authService.cleanupExpiredResetTokens()
        logger.info("Token cleanup job completed.")
    }

    // ============================================
    // Platform/B2B Billing Jobs
    // ============================================

    /**
     * Generates monthly client invoices for all active B2B subscriptions.
     * Runs on the 1st of each month at 6:00 AM.
     */
    @Scheduled(cron = "0 0 6 1 * *")
    @SchedulerLock(name = "generateMonthlyClientInvoices", lockAtLeastFor = "10m", lockAtMostFor = "1h")
    @Transactional
    fun generateMonthlyClientInvoices() {
        logger.info("Running monthly client invoice generation job...")

        val generatedCount = clientInvoiceService.generateMonthlyInvoices()

        logger.info("Monthly client invoice generation completed. Generated $generatedCount invoices.")
    }

    /**
     * Marks overdue client invoices (B2B).
     * Runs daily at 3:00 AM.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @SchedulerLock(name = "markOverdueClientInvoices", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun markOverdueClientInvoices() {
        logger.info("Running client invoice overdue job...")

        val overdueCount = clientInvoiceService.markOverdueInvoices()

        logger.info("Client invoice overdue job completed. Marked $overdueCount invoices as overdue.")
    }
}
