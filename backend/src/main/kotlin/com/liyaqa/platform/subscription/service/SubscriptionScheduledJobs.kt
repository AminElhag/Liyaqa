package com.liyaqa.platform.subscription.service

import com.liyaqa.platform.subscription.model.SubscriptionStatus
import com.liyaqa.platform.subscription.repository.TenantSubscriptionRepository
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Component
class SubscriptionScheduledJobs(
    private val tenantSubscriptionRepository: TenantSubscriptionRepository,
    private val subscriptionInvoiceService: SubscriptionInvoiceService
) {
    private val log = LoggerFactory.getLogger(SubscriptionScheduledJobs::class.java)

    @Scheduled(cron = "0 0 4 * * *")
    @SchedulerLock(name = "checkExpiringTrials", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    @Transactional
    fun checkExpiringTrials() {
        val today = LocalDate.now()

        // Expire trials that are past their trial end date
        val expiredTrials = tenantSubscriptionRepository.findByStatusAndTrialEndsAtBefore(
            SubscriptionStatus.TRIAL, today
        )
        for (trial in expiredTrials) {
            trial.expire()
            tenantSubscriptionRepository.save(trial)
            log.info("Expired trial subscription for tenant {}", trial.tenantId)
        }

        // Warn about trials expiring in 3 days
        val warningTrials = tenantSubscriptionRepository.findByStatusAndTrialEndsAtBetween(
            SubscriptionStatus.TRIAL, today, today.plusDays(3)
        )
        for (trial in warningTrials) {
            log.warn("Trial expiring soon for tenant {} (ends: {})", trial.tenantId, trial.trialEndsAt)
            // TODO: Send notification to tenant
        }
    }

    @Scheduled(cron = "0 30 4 * * *")
    @SchedulerLock(name = "checkOverdueInvoices", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    @Transactional
    fun checkOverdueInvoices() {
        val overdueCount = subscriptionInvoiceService.markOverdueInvoices()
        if (overdueCount > 0) {
            log.info("Marked {} invoices as overdue", overdueCount)
        }

        // Mark subscriptions with overdue invoices as past due
        val overdueInvoices = subscriptionInvoiceService.getOutstandingInvoices()
            .filter { it.status == com.liyaqa.platform.subscription.model.InvoiceStatus.OVERDUE && it.subscriptionId != null }

        for (invoice in overdueInvoices) {
            val sub = tenantSubscriptionRepository.findById(invoice.subscriptionId!!).orElse(null)
            if (sub != null && sub.status == SubscriptionStatus.ACTIVE) {
                sub.markPastDue()
                tenantSubscriptionRepository.save(sub)
                log.info("Marked subscription {} as past due for tenant {}", sub.id, sub.tenantId)
            }
        }
    }

    @Scheduled(cron = "0 0 5 * * *")
    @SchedulerLock(name = "generateUpcomingInvoices", lockAtMostFor = "PT30M", lockAtLeastFor = "PT5M")
    @Transactional
    fun generateUpcomingInvoices() {
        val count = subscriptionInvoiceService.generateAutoInvoices()
        if (count > 0) {
            log.info("Auto-generated {} subscription invoices", count)
        }
    }
}
