package com.liyaqa.notification.infrastructure.jobs

import com.liyaqa.billing.domain.model.InvoiceStatus
import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.shared.domain.LocalizedText
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Scheduled jobs for sending notifications.
 * Uses ShedLock to ensure jobs run only once across multiple instances.
 */
@Component
class NotificationJobs(
    private val notificationService: NotificationService,
    private val subscriptionRepository: SubscriptionRepository,
    private val memberRepository: MemberRepository,
    private val sessionRepository: ClassSessionRepository,
    private val bookingRepository: ClassBookingRepository,
    private val invoiceRepository: InvoiceRepository
) {
    private val logger = LoggerFactory.getLogger(NotificationJobs::class.java)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    // ==================== PROCESS PENDING NOTIFICATIONS ====================

    /**
     * Processes pending notifications that are due for sending.
     * Runs every 5 minutes.
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @SchedulerLock(name = "processPendingNotifications", lockAtLeastFor = "1m", lockAtMostFor = "10m")
    @Transactional
    fun processPendingNotifications() {
        logger.debug("Processing pending notifications...")
        val processed = notificationService.processPendingNotifications()
        if (processed > 0) {
            logger.info("Processed $processed pending notifications")
        }
    }

    /**
     * Retries failed notifications.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedRate = 900000) // 15 minutes
    @SchedulerLock(name = "retryFailedNotifications", lockAtLeastFor = "1m", lockAtMostFor = "15m")
    @Transactional
    fun retryFailedNotifications() {
        logger.debug("Retrying failed notifications...")
        val retried = notificationService.retryFailedNotifications()
        if (retried > 0) {
            logger.info("Retried $retried failed notifications")
        }
    }

    // ==================== SUBSCRIPTION REMINDERS ====================

    /**
     * Sends reminders for subscriptions expiring in 7 days.
     * Runs daily at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @SchedulerLock(name = "subscriptionExpiring7Days", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendSubscriptionExpiring7DaysReminders() {
        logger.info("Sending 7-day subscription expiry reminders...")

        val expiringDate = LocalDate.now().plusDays(7)
        val subscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
            SubscriptionStatus.ACTIVE,
            expiringDate,
            expiringDate,
            PageRequest.of(0, 1000)
        )

        var sentCount = 0
        for (subscription in subscriptions) {
            try {
                val member = memberRepository.findById(subscription.memberId).orElse(null) ?: continue

                val subject = LocalizedText(
                    en = "Your subscription expires in 7 days",
                    ar = "اشتراكك ينتهي خلال 7 أيام"
                )
                val body = LocalizedText(
                    en = "Dear ${member.firstName}, your subscription will expire on ${subscription.endDate}. Please renew to continue enjoying our services.",
                    ar = "عزيزي ${member.firstName}، سينتهي اشتراكك في ${subscription.endDate}. يرجى التجديد لمواصلة الاستمتاع بخدماتنا."
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.SUBSCRIPTION_EXPIRING_7_DAYS,
                    subject = subject,
                    body = body,
                    referenceId = subscription.id,
                    referenceType = "subscription",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending 7-day reminder for subscription ${subscription.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount 7-day subscription expiry reminders")
    }

    /**
     * Sends reminders for subscriptions expiring in 3 days.
     * Runs daily at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @SchedulerLock(name = "subscriptionExpiring3Days", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendSubscriptionExpiring3DaysReminders() {
        logger.info("Sending 3-day subscription expiry reminders...")

        val expiringDate = LocalDate.now().plusDays(3)
        val subscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
            SubscriptionStatus.ACTIVE,
            expiringDate,
            expiringDate,
            PageRequest.of(0, 1000)
        )

        var sentCount = 0
        for (subscription in subscriptions) {
            try {
                val member = memberRepository.findById(subscription.memberId).orElse(null) ?: continue

                val subject = LocalizedText(
                    en = "Your subscription expires in 3 days",
                    ar = "اشتراكك ينتهي خلال 3 أيام"
                )
                val body = LocalizedText(
                    en = "Dear ${member.firstName}, your subscription will expire on ${subscription.endDate}. Renew now to avoid interruption.",
                    ar = "عزيزي ${member.firstName}، سينتهي اشتراكك في ${subscription.endDate}. جدد الآن لتجنب الانقطاع."
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.SUBSCRIPTION_EXPIRING_3_DAYS,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.HIGH,
                    referenceId = subscription.id,
                    referenceType = "subscription",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending 3-day reminder for subscription ${subscription.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount 3-day subscription expiry reminders")
    }

    /**
     * Sends reminders for subscriptions expiring tomorrow.
     * Runs daily at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @SchedulerLock(name = "subscriptionExpiring1Day", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendSubscriptionExpiring1DayReminders() {
        logger.info("Sending 1-day subscription expiry reminders...")

        val expiringDate = LocalDate.now().plusDays(1)
        val subscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
            SubscriptionStatus.ACTIVE,
            expiringDate,
            expiringDate,
            PageRequest.of(0, 1000)
        )

        var sentCount = 0
        for (subscription in subscriptions) {
            try {
                val member = memberRepository.findById(subscription.memberId).orElse(null) ?: continue

                val subject = LocalizedText(
                    en = "Your subscription expires TOMORROW",
                    ar = "اشتراكك ينتهي غداً"
                )
                val body = LocalizedText(
                    en = "Dear ${member.firstName}, your subscription expires tomorrow! Renew now to continue your fitness journey.",
                    ar = "عزيزي ${member.firstName}، ينتهي اشتراكك غداً! جدد الآن لمواصلة رحلتك الرياضية."
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.SUBSCRIPTION_EXPIRING_1_DAY,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.URGENT,
                    referenceId = subscription.id,
                    referenceType = "subscription",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending 1-day reminder for subscription ${subscription.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount 1-day subscription expiry reminders")
    }

    // ==================== CLASS BOOKING REMINDERS ====================

    /**
     * Sends reminders for classes starting in 24 hours.
     * Runs hourly.
     */
    @Scheduled(cron = "0 0 * * * *")
    @SchedulerLock(name = "classReminder24Hours", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendClassReminder24Hours() {
        logger.info("Sending 24-hour class reminders...")

        val tomorrow = LocalDate.now().plusDays(1)
        val sessions = sessionRepository.findBySessionDate(tomorrow, PageRequest.of(0, 1000))
            .filter { it.status == SessionStatus.SCHEDULED }

        var sentCount = 0
        for (session in sessions) {
            val bookings = bookingRepository.findBySessionIdAndStatus(session.id, BookingStatus.CONFIRMED)

            for (booking in bookings) {
                try {
                    val member = memberRepository.findById(booking.memberId).orElse(null) ?: continue

                    val subject = LocalizedText(
                        en = "Class reminder: Tomorrow at ${session.startTime}",
                        ar = "تذكير بالحصة: غداً الساعة ${session.startTime}"
                    )
                    val body = LocalizedText(
                        en = "Dear ${member.firstName}, reminder: You have a class booked for tomorrow at ${session.startTime}. See you there!",
                        ar = "عزيزي ${member.firstName}، تذكير: لديك حصة محجوزة غداً الساعة ${session.startTime}. نراك هناك!"
                    )

                    val sent = notificationService.sendMultiChannelIfNotDuplicate(
                        memberId = member.id,
                        email = member.email,
                        phone = member.phone,
                        type = NotificationType.CLASS_BOOKING_REMINDER_24H,
                        subject = subject,
                        body = body,
                        referenceId = booking.id,
                        referenceType = "booking",
                        deduplicationHours = 24
                    )
                    if (sent.isNotEmpty()) sentCount++
                } catch (e: Exception) {
                    logger.error("Error sending 24h class reminder for booking ${booking.id}: ${e.message}")
                }
            }
        }

        logger.info("Sent $sentCount 24-hour class reminders")
    }

    /**
     * Sends reminders for classes starting in 1 hour.
     * Runs every 15 minutes.
     */
    @Scheduled(cron = "0 */15 * * * *")
    @SchedulerLock(name = "classReminder1Hour", lockAtLeastFor = "2m", lockAtMostFor = "15m")
    @Transactional
    fun sendClassReminder1Hour() {
        logger.debug("Checking for 1-hour class reminders...")

        val now = LocalDateTime.now()
        val oneHourLater = now.plusHours(1)

        val sessions = sessionRepository.findBySessionDate(now.toLocalDate(), PageRequest.of(0, 1000))
            .filter { session ->
                session.status == SessionStatus.SCHEDULED &&
                    session.startDateTime().isAfter(now) &&
                    session.startDateTime().isBefore(oneHourLater.plusMinutes(15))
            }

        var sentCount = 0
        for (session in sessions) {
            val bookings = bookingRepository.findBySessionIdAndStatus(session.id, BookingStatus.CONFIRMED)

            for (booking in bookings) {
                try {
                    val member = memberRepository.findById(booking.memberId).orElse(null) ?: continue

                    val body = LocalizedText(
                        en = "Your class starts in 1 hour at ${session.startTime}. Get ready!",
                        ar = "تبدأ حصتك خلال ساعة واحدة الساعة ${session.startTime}. استعد!"
                    )

                    // Only SMS for 1-hour reminder (more urgent, immediate)
                    if (member.phone != null) {
                        notificationService.sendSms(
                            memberId = member.id,
                            phone = member.phone!!,
                            type = NotificationType.CLASS_BOOKING_REMINDER_1H,
                            body = body,
                            priority = NotificationPriority.HIGH,
                            referenceId = booking.id,
                            referenceType = "booking"
                        )
                        sentCount++
                    }
                } catch (e: Exception) {
                    logger.error("Error sending 1h class reminder for booking ${booking.id}: ${e.message}")
                }
            }
        }

        if (sentCount > 0) {
            logger.info("Sent $sentCount 1-hour class reminders")
        }
    }

    // ==================== NO-SHOW PROCESSING ====================

    /**
     * Processes no-shows for sessions that have ended.
     * Members with CONFIRMED bookings who didn't check in are marked as NO_SHOW.
     * Runs every 30 minutes.
     */
    @Scheduled(cron = "0 */30 * * * *")
    @SchedulerLock(name = "processNoShows", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun processNoShows() {
        logger.info("Processing no-shows for completed sessions...")

        val now = LocalDateTime.now()
        // Get all sessions from yesterday and today that should have ended
        val yesterday = LocalDate.now().minusDays(1)
        val today = LocalDate.now()

        var noShowCount = 0

        // Process yesterday's sessions
        val yesterdaySessions = sessionRepository.findBySessionDate(yesterday, PageRequest.of(0, 1000))
            .filter { it.status == SessionStatus.SCHEDULED || it.status == SessionStatus.IN_PROGRESS || it.status == SessionStatus.COMPLETED }

        // Process today's sessions that have ended
        val todaySessions = sessionRepository.findBySessionDate(today, PageRequest.of(0, 1000))
            .filter { session ->
                (session.status == SessionStatus.SCHEDULED || session.status == SessionStatus.IN_PROGRESS || session.status == SessionStatus.COMPLETED) &&
                    session.endDateTime().isBefore(now)
            }

        val allEndedSessions = yesterdaySessions + todaySessions

        for (session in allEndedSessions) {
            // Mark session as completed if it's still scheduled or in progress
            if (session.status == SessionStatus.SCHEDULED || session.status == SessionStatus.IN_PROGRESS) {
                session.complete()
                sessionRepository.save(session)
            }

            // Find all CONFIRMED bookings (didn't check in)
            val confirmedBookings = bookingRepository.findBySessionIdAndStatus(session.id, BookingStatus.CONFIRMED)

            for (booking in confirmedBookings) {
                try {
                    booking.markNoShow()
                    bookingRepository.save(booking)
                    noShowCount++

                    // Optionally send notification about no-show (for member records)
                    logger.debug("Marked booking ${booking.id} as no-show for member ${booking.memberId}")
                } catch (e: Exception) {
                    logger.error("Error marking booking ${booking.id} as no-show: ${e.message}")
                }
            }
        }

        if (noShowCount > 0) {
            logger.info("Processed $noShowCount no-shows")
        }
    }

    // ==================== INVOICE REMINDERS ====================

    /**
     * Sends reminders for invoices due in 3 days.
     * Runs daily at 10:00 AM.
     */
    @Scheduled(cron = "0 0 10 * * *")
    @SchedulerLock(name = "invoiceDue3Days", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendInvoiceDue3DaysReminders() {
        logger.info("Sending 3-day invoice due reminders...")

        val dueDate = LocalDate.now().plusDays(3)
        val invoices = invoiceRepository.findIssuedInvoicesDueOn(dueDate, PageRequest.of(0, 1000))

        var sentCount = 0
        for (invoice in invoices) {
            try {
                val member = memberRepository.findById(invoice.memberId).orElse(null) ?: continue

                val dueDateFormatted = invoice.dueDate?.format(dateFormatter) ?: "N/A"
                val totalAmount = "${invoice.totalAmount.currency} ${invoice.totalAmount.amount}"

                val subject = LocalizedText(
                    en = "Invoice #${invoice.invoiceNumber} due in 3 days",
                    ar = "الفاتورة #${invoice.invoiceNumber} تستحق خلال 3 أيام"
                )
                val body = LocalizedText(
                    en = """
                        <p>Dear ${member.fullName},</p>
                        <p>This is a friendly reminder that your invoice #${invoice.invoiceNumber} for <strong>$totalAmount</strong> is due on <strong>$dueDateFormatted</strong>.</p>
                        <p>Please ensure payment is made by the due date to avoid any late fees.</p>
                        <p>Best regards,<br>Liyaqa Team</p>
                    """.trimIndent(),
                    ar = """
                        <p>عزيزي ${member.fullName}،</p>
                        <p>هذا تذكير ودي بأن فاتورتك #${invoice.invoiceNumber} بمبلغ <strong>$totalAmount</strong> تستحق في <strong>$dueDateFormatted</strong>.</p>
                        <p>يرجى التأكد من الدفع قبل تاريخ الاستحقاق لتجنب أي رسوم تأخير.</p>
                        <p>مع تحيات،<br>فريق لياقة</p>
                    """.trimIndent()
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.INVOICE_DUE_SOON,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.HIGH,
                    referenceId = invoice.id,
                    referenceType = "invoice",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending 3-day invoice reminder for invoice ${invoice.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount 3-day invoice due reminders")
    }

    /**
     * Sends reminders for invoices due tomorrow.
     * Runs daily at 10:00 AM.
     */
    @Scheduled(cron = "0 0 10 * * *")
    @SchedulerLock(name = "invoiceDue1Day", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendInvoiceDue1DayReminders() {
        logger.info("Sending 1-day invoice due reminders...")

        val dueDate = LocalDate.now().plusDays(1)
        val invoices = invoiceRepository.findIssuedInvoicesDueOn(dueDate, PageRequest.of(0, 1000))

        var sentCount = 0
        for (invoice in invoices) {
            try {
                val member = memberRepository.findById(invoice.memberId).orElse(null) ?: continue

                val totalAmount = "${invoice.totalAmount.currency} ${invoice.totalAmount.amount}"

                val subject = LocalizedText(
                    en = "URGENT: Invoice #${invoice.invoiceNumber} due TOMORROW",
                    ar = "عاجل: الفاتورة #${invoice.invoiceNumber} تستحق غداً"
                )
                val body = LocalizedText(
                    en = """
                        <p>Dear ${member.fullName},</p>
                        <p><strong>Important:</strong> Your invoice #${invoice.invoiceNumber} for <strong>$totalAmount</strong> is due tomorrow!</p>
                        <p>Please make payment today to avoid any service interruption or late fees.</p>
                        <p>Best regards,<br>Liyaqa Team</p>
                    """.trimIndent(),
                    ar = """
                        <p>عزيزي ${member.fullName}،</p>
                        <p><strong>مهم:</strong> فاتورتك #${invoice.invoiceNumber} بمبلغ <strong>$totalAmount</strong> تستحق غداً!</p>
                        <p>يرجى الدفع اليوم لتجنب أي انقطاع في الخدمة أو رسوم تأخير.</p>
                        <p>مع تحيات،<br>فريق لياقة</p>
                    """.trimIndent()
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.INVOICE_DUE_SOON,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.URGENT,
                    referenceId = invoice.id,
                    referenceType = "invoice",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending 1-day invoice reminder for invoice ${invoice.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount 1-day invoice due reminders")
    }

    /**
     * Sends notifications for newly overdue invoices.
     * Runs daily at 11:00 AM (after the overdue marking job at 2 AM).
     */
    @Scheduled(cron = "0 0 11 * * *")
    @SchedulerLock(name = "overdueInvoiceNotifications", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendOverdueInvoiceNotifications() {
        logger.info("Sending overdue invoice notifications...")

        // Find invoices that became overdue yesterday (to avoid duplicate notifications)
        val yesterday = LocalDate.now().minusDays(1)
        val overdueInvoices = invoiceRepository.findIssuedInvoicesPastDueDate(yesterday, PageRequest.of(0, 1000))
            .filter { it.status == InvoiceStatus.OVERDUE }

        var sentCount = 0
        for (invoice in overdueInvoices) {
            try {
                val member = memberRepository.findById(invoice.memberId).orElse(null) ?: continue

                val dueDateFormatted = invoice.dueDate?.format(dateFormatter) ?: "N/A"
                val totalAmount = "${invoice.totalAmount.currency} ${invoice.totalAmount.amount}"

                val subject = LocalizedText(
                    en = "OVERDUE: Invoice #${invoice.invoiceNumber}",
                    ar = "متأخرة: الفاتورة #${invoice.invoiceNumber}"
                )
                val body = LocalizedText(
                    en = """
                        <p>Dear ${member.fullName},</p>
                        <p><strong>Your invoice #${invoice.invoiceNumber} is now overdue.</strong></p>
                        <p>Amount: <strong>$totalAmount</strong><br>
                        Due Date: <strong>$dueDateFormatted</strong></p>
                        <p>Please make payment immediately to avoid any service interruption.</p>
                        <p>If you have already made payment, please disregard this notice.</p>
                        <p>Best regards,<br>Liyaqa Team</p>
                    """.trimIndent(),
                    ar = """
                        <p>عزيزي ${member.fullName}،</p>
                        <p><strong>فاتورتك #${invoice.invoiceNumber} أصبحت متأخرة الآن.</strong></p>
                        <p>المبلغ: <strong>$totalAmount</strong><br>
                        تاريخ الاستحقاق: <strong>$dueDateFormatted</strong></p>
                        <p>يرجى الدفع فوراً لتجنب أي انقطاع في الخدمة.</p>
                        <p>إذا قمت بالدفع بالفعل، يرجى تجاهل هذا الإشعار.</p>
                        <p>مع تحيات،<br>فريق لياقة</p>
                    """.trimIndent()
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.INVOICE_OVERDUE,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.URGENT,
                    referenceId = invoice.id,
                    referenceType = "invoice",
                    deduplicationHours = 24
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending overdue notification for invoice ${invoice.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount overdue invoice notifications")
    }

    // ==================== SUBSCRIPTION EXPIRED NOTIFICATIONS ====================

    /**
     * Sends notifications for subscriptions that expired yesterday.
     * Runs daily at 8:00 AM.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @SchedulerLock(name = "subscriptionExpiredNotifications", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendSubscriptionExpiredNotifications() {
        logger.info("Sending subscription expired notifications...")

        val yesterday = LocalDate.now().minusDays(1)
        val expiredSubscriptions = subscriptionRepository.findByStatusAndEndDateBetween(
            SubscriptionStatus.EXPIRED,
            yesterday,
            yesterday,
            PageRequest.of(0, 1000)
        )

        var sentCount = 0
        for (subscription in expiredSubscriptions) {
            try {
                val member = memberRepository.findById(subscription.memberId).orElse(null) ?: continue

                val subject = LocalizedText(
                    en = "Your Subscription Has Expired - Liyaqa",
                    ar = "انتهى اشتراكك - لياقة"
                )
                val body = LocalizedText(
                    en = """
                        <h2>Your Subscription Has Expired</h2>
                        <p>Dear ${member.firstName},</p>
                        <p>Your gym subscription expired on <strong>${subscription.endDate.format(dateFormatter)}</strong>.</p>
                        <p>To continue enjoying our facilities and services, please renew your subscription.</p>
                        <p>We hope to see you back soon!</p>
                        <p>Best regards,<br>Liyaqa Team</p>
                    """.trimIndent(),
                    ar = """
                        <h2>انتهى اشتراكك</h2>
                        <p>عزيزي ${member.firstName}،</p>
                        <p>انتهى اشتراكك في النادي بتاريخ <strong>${subscription.endDate.format(dateFormatter)}</strong>.</p>
                        <p>للاستمرار في الاستفادة من مرافقنا وخدماتنا، يرجى تجديد اشتراكك.</p>
                        <p>نأمل أن نراك قريباً!</p>
                        <p>مع تحيات،<br>فريق لياقة</p>
                    """.trimIndent()
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.SUBSCRIPTION_EXPIRED,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.HIGH,
                    referenceId = subscription.id,
                    referenceType = "subscription",
                    deduplicationHours = 48
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending expired notification for subscription ${subscription.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount subscription expired notifications")
    }

    // ==================== LOW CLASSES REMAINING NOTIFICATIONS ====================

    /**
     * Sends notifications for subscriptions with low classes remaining (3 or fewer).
     * Runs daily at 10:30 AM.
     */
    @Scheduled(cron = "0 30 10 * * *")
    @SchedulerLock(name = "lowClassesRemainingNotifications", lockAtLeastFor = "5m", lockAtMostFor = "30m")
    @Transactional
    fun sendLowClassesRemainingNotifications() {
        logger.info("Sending low classes remaining notifications...")

        val activeSubscriptions = subscriptionRepository.findByStatus(
            SubscriptionStatus.ACTIVE,
            PageRequest.of(0, 5000)
        )

        val lowClassesThreshold = 3
        var sentCount = 0

        for (subscription in activeSubscriptions) {
            // Skip unlimited subscriptions
            val classesRemaining = subscription.classesRemaining ?: continue

            // Only notify if 1-3 classes remaining
            if (classesRemaining <= 0 || classesRemaining > lowClassesThreshold) continue

            try {
                val member = memberRepository.findById(subscription.memberId).orElse(null) ?: continue

                val subject = LocalizedText(
                    en = "Low Classes Remaining - $classesRemaining left",
                    ar = "حصص قليلة متبقية - $classesRemaining متبقية"
                )
                val body = LocalizedText(
                    en = """
                        <h2>You're Running Low on Classes!</h2>
                        <p>Dear ${member.firstName},</p>
                        <p>You have <strong>$classesRemaining class(es)</strong> remaining in your subscription.</p>
                        <p>Subscription ends: ${subscription.endDate.format(dateFormatter)}</p>
                        <p>Consider renewing your subscription to continue your fitness journey without interruption.</p>
                        <p>Best regards,<br>Liyaqa Team</p>
                    """.trimIndent(),
                    ar = """
                        <h2>الحصص المتبقية قليلة!</h2>
                        <p>عزيزي ${member.firstName}،</p>
                        <p>لديك <strong>$classesRemaining حصة/حصص</strong> متبقية في اشتراكك.</p>
                        <p>ينتهي الاشتراك: ${subscription.endDate.format(dateFormatter)}</p>
                        <p>ننصحك بتجديد اشتراكك لمواصلة رحلتك الرياضية دون انقطاع.</p>
                        <p>مع تحيات،<br>فريق لياقة</p>
                    """.trimIndent()
                )

                val sent = notificationService.sendMultiChannelIfNotDuplicate(
                    memberId = member.id,
                    email = member.email,
                    phone = member.phone,
                    type = NotificationType.LOW_CLASSES_REMAINING,
                    subject = subject,
                    body = body,
                    priority = NotificationPriority.NORMAL,
                    referenceId = subscription.id,
                    referenceType = "subscription",
                    deduplicationHours = 72 // Only send once every 3 days
                )
                if (sent.isNotEmpty()) sentCount++
            } catch (e: Exception) {
                logger.error("Error sending low classes notification for subscription ${subscription.id}: ${e.message}")
            }
        }

        logger.info("Sent $sentCount low classes remaining notifications")
    }
}
