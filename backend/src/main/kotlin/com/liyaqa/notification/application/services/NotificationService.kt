package com.liyaqa.notification.application.services

import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationPreference
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.notification.domain.ports.NotificationPreferenceRepository
import com.liyaqa.notification.domain.ports.NotificationRepository
import com.liyaqa.notification.infrastructure.sms.SmsService
import com.liyaqa.notification.infrastructure.sms.SmsSendException
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.email.EmailService
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

@Service
@Transactional
class NotificationService(
    private val notificationRepository: NotificationRepository,
    private val preferenceRepository: NotificationPreferenceRepository,
    private val emailService: EmailService,
    private val smsService: SmsService
) {
    private val logger = LoggerFactory.getLogger(NotificationService::class.java)

    // ==================== SENDING NOTIFICATIONS ====================

    /**
     * Sends a notification through the appropriate channel.
     */
    fun sendNotification(notification: Notification): Notification {
        return when (notification.channel) {
            NotificationChannel.EMAIL -> sendEmailNotification(notification)
            NotificationChannel.SMS -> sendSmsNotification(notification)
            NotificationChannel.WHATSAPP -> sendWhatsAppNotification(notification)
            NotificationChannel.PUSH, NotificationChannel.IN_APP -> {
                // Future implementation
                notification.markSent()
                notificationRepository.save(notification)
            }
        }
    }

    /**
     * Sends a WhatsApp notification.
     * WhatsApp sending is handled by WhatsAppService separately due to template requirements.
     * This method marks the notification for WhatsApp processing.
     */
    private fun sendWhatsAppNotification(notification: Notification): Notification {
        // WhatsApp notifications are processed differently - they require templates
        // The actual sending is done by WhatsAppService which needs template variables
        // Here we just mark it as pending for WhatsApp processing
        logger.info("WhatsApp notification queued: ${notification.id} for member ${notification.memberId}")
        return notificationRepository.save(notification)
    }

    /**
     * Sends an email notification.
     */
    private fun sendEmailNotification(notification: Notification): Notification {
        try {
            val preference = getOrCreatePreference(notification.memberId)
            val locale = preference.preferredLanguage

            val subject = notification.subject?.get(locale) ?: "Liyaqa Notification"
            val body = notification.body.get(locale)

            emailService.sendHtmlEmail(
                to = notification.recipientEmail ?: throw IllegalStateException("No email address"),
                subject = subject,
                htmlBody = body
            )

            notification.markSent()
            logger.info("Email notification sent: ${notification.id} for member ${notification.memberId}")
        } catch (e: Exception) {
            logger.error("Failed to send email notification ${notification.id}: ${e.message}", e)
            notification.markFailed(e.message ?: "Unknown error")
        }

        return notificationRepository.save(notification)
    }

    /**
     * Sends an SMS notification.
     */
    private fun sendSmsNotification(notification: Notification): Notification {
        try {
            if (!smsService.isAvailable()) {
                throw SmsSendException("SMS service is not available")
            }

            val preference = getOrCreatePreference(notification.memberId)
            val locale = preference.preferredLanguage
            val message = notification.body.get(locale)

            val messageId = smsService.send(
                to = notification.recipientPhone ?: throw IllegalStateException("No phone number"),
                message = message
            )

            notification.markSent(messageId)
            logger.info("SMS notification sent: ${notification.id} for member ${notification.memberId}")
        } catch (e: Exception) {
            logger.error("Failed to send SMS notification ${notification.id}: ${e.message}", e)
            notification.markFailed(e.message ?: "Unknown error")
        }

        return notificationRepository.save(notification)
    }

    // ==================== CREATING NOTIFICATIONS ====================

    /**
     * Creates and sends an email notification.
     */
    fun sendEmail(
        memberId: UUID,
        email: String,
        type: NotificationType,
        subject: LocalizedText,
        body: LocalizedText,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        referenceId: UUID? = null,
        referenceType: String? = null
    ): Notification {
        val preference = getOrCreatePreference(memberId)

        if (!preference.shouldReceive(type, NotificationChannel.EMAIL)) {
            logger.info("Member $memberId has disabled ${type.name} notifications via email")
            val notification = Notification.forEmail(memberId, type, email, subject, body, priority)
            notification.markFailed("Notification disabled by user preference")
            return notificationRepository.save(notification)
        }

        val notification = Notification.forEmail(memberId, type, email, subject, body, priority)
        if (referenceId != null && referenceType != null) {
            notification.setReference(referenceId, referenceType)
        }

        return sendNotification(notificationRepository.save(notification))
    }

    /**
     * Creates and sends an SMS notification.
     */
    fun sendSms(
        memberId: UUID,
        phone: String,
        type: NotificationType,
        body: LocalizedText,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        referenceId: UUID? = null,
        referenceType: String? = null
    ): Notification {
        val preference = getOrCreatePreference(memberId)

        if (!preference.shouldReceive(type, NotificationChannel.SMS)) {
            logger.info("Member $memberId has disabled ${type.name} notifications via SMS")
            val notification = Notification.forSms(memberId, type, phone, body, priority)
            notification.markFailed("Notification disabled by user preference")
            return notificationRepository.save(notification)
        }

        val notification = Notification.forSms(memberId, type, phone, body, priority)
        if (referenceId != null && referenceType != null) {
            notification.setReference(referenceId, referenceType)
        }

        return sendNotification(notificationRepository.save(notification))
    }

    /**
     * Sends notification via both email and SMS if enabled.
     */
    fun sendMultiChannel(
        memberId: UUID,
        email: String?,
        phone: String?,
        type: NotificationType,
        subject: LocalizedText?,
        body: LocalizedText,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        referenceId: UUID? = null,
        referenceType: String? = null
    ): List<Notification> {
        val notifications = mutableListOf<Notification>()

        if (email != null && subject != null) {
            notifications.add(sendEmail(memberId, email, type, subject, body, priority, referenceId, referenceType))
        }

        if (phone != null) {
            notifications.add(sendSms(memberId, phone, type, body, priority, referenceId, referenceType))
        }

        return notifications
    }

    // ==================== PROCESSING PENDING NOTIFICATIONS ====================

    /**
     * Processes pending notifications that are due for sending.
     * Called by scheduled job.
     */
    fun processPendingNotifications(batchSize: Int = 100): Int {
        val pageable = PageRequest.of(0, batchSize)
        val pending = notificationRepository.findPendingDue(Instant.now(), pageable)

        var processedCount = 0
        for (notification in pending) {
            try {
                sendNotification(notification)
                processedCount++
            } catch (e: Exception) {
                logger.error("Error processing notification ${notification.id}: ${e.message}", e)
            }
        }

        logger.info("Processed $processedCount pending notifications")
        return processedCount
    }

    /**
     * Retries failed notifications that are eligible for retry.
     * Called by scheduled job.
     */
    fun retryFailedNotifications(batchSize: Int = 50): Int {
        val pageable = PageRequest.of(0, batchSize)
        val failed = notificationRepository.findFailedRetryable(pageable)

        var retryCount = 0
        for (notification in failed) {
            try {
                notification.scheduleRetry()
                notificationRepository.save(notification)
                sendNotification(notification)
                retryCount++
            } catch (e: Exception) {
                logger.error("Error retrying notification ${notification.id}: ${e.message}", e)
            }
        }

        logger.info("Retried $retryCount failed notifications")
        return retryCount
    }

    // ==================== READING NOTIFICATIONS ====================

    /**
     * Gets a notification by ID.
     */
    @Transactional(readOnly = true)
    fun getNotification(id: UUID): Notification {
        return notificationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Notification not found: $id") }
    }

    /**
     * Gets notifications for a member.
     */
    @Transactional(readOnly = true)
    fun getNotificationsByMember(memberId: UUID, pageable: Pageable): Page<Notification> {
        return notificationRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Gets unread notification count for a member.
     */
    @Transactional(readOnly = true)
    fun getUnreadCount(memberId: UUID): Long {
        return notificationRepository.countUnreadByMemberId(memberId)
    }

    /**
     * Marks a notification as read.
     */
    fun markAsRead(id: UUID): Notification {
        val notification = notificationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Notification not found: $id") }
        notification.markRead()
        return notificationRepository.save(notification)
    }

    /**
     * Marks all notifications as read for a member.
     * Includes both SENT and DELIVERED notifications that haven't been read.
     */
    fun markAllAsRead(memberId: UUID): Int {
        val pageable = PageRequest.of(0, 1000)
        val unread = notificationRepository.findUnreadByMemberId(memberId, pageable)

        var count = 0
        for (notification in unread) {
            notification.markRead()
            notificationRepository.save(notification)
            count++
        }

        logger.info("Marked $count notifications as read for member $memberId")
        return count
    }

    // ==================== DEDUPLICATION ====================

    /**
     * Checks if a notification of the given type was already sent for the reference within the time window.
     * @param referenceId The reference entity ID (e.g., invoice ID, booking ID)
     * @param referenceType The reference type (e.g., "invoice", "booking")
     * @param type The notification type
     * @param withinHours Hours to look back for duplicates (default 24 hours)
     * @return true if a duplicate exists, false otherwise
     */
    @Transactional(readOnly = true)
    fun isDuplicate(
        referenceId: UUID,
        referenceType: String,
        type: NotificationType,
        withinHours: Long = 24
    ): Boolean {
        val cutoff = Instant.now().minusSeconds(withinHours * 3600)
        return notificationRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
            referenceId, referenceType, type, cutoff
        )
    }

    /**
     * Sends notification only if no duplicate exists within the time window.
     * @return The notification if sent, null if duplicate was detected
     */
    fun sendEmailIfNotDuplicate(
        memberId: UUID,
        email: String,
        type: NotificationType,
        subject: LocalizedText,
        body: LocalizedText,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        referenceId: UUID,
        referenceType: String,
        deduplicationHours: Long = 24
    ): Notification? {
        if (isDuplicate(referenceId, referenceType, type, deduplicationHours)) {
            logger.info("Skipping duplicate notification: type=$type, referenceId=$referenceId")
            return null
        }
        return sendEmail(memberId, email, type, subject, body, priority, referenceId, referenceType)
    }

    /**
     * Sends multi-channel notification only if no duplicate exists within the time window.
     * @return List of notifications sent, empty if duplicate was detected
     */
    fun sendMultiChannelIfNotDuplicate(
        memberId: UUID,
        email: String?,
        phone: String?,
        type: NotificationType,
        subject: LocalizedText?,
        body: LocalizedText,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        referenceId: UUID,
        referenceType: String,
        deduplicationHours: Long = 24
    ): List<Notification> {
        if (isDuplicate(referenceId, referenceType, type, deduplicationHours)) {
            logger.info("Skipping duplicate notification: type=$type, referenceId=$referenceId")
            return emptyList()
        }
        return sendMultiChannel(memberId, email, phone, type, subject, body, priority, referenceId, referenceType)
    }

    // ==================== PREFERENCE MANAGEMENT ====================

    /**
     * Gets or creates notification preferences for a member.
     */
    fun getOrCreatePreference(memberId: UUID): NotificationPreference {
        return preferenceRepository.findByMemberId(memberId)
            .orElseGet {
                val preference = NotificationPreference.createDefault(memberId)
                preferenceRepository.save(preference)
            }
    }

    /**
     * Updates notification preferences for a member.
     */
    fun updatePreferences(
        memberId: UUID,
        emailEnabled: Boolean? = null,
        smsEnabled: Boolean? = null,
        pushEnabled: Boolean? = null,
        subscriptionRemindersEnabled: Boolean? = null,
        invoiceNotificationsEnabled: Boolean? = null,
        classBookingNotificationsEnabled: Boolean? = null,
        classReminder24hEnabled: Boolean? = null,
        classReminder1hEnabled: Boolean? = null,
        marketingEnabled: Boolean? = null,
        preferredLanguage: String? = null
    ): NotificationPreference {
        val preference = getOrCreatePreference(memberId)

        emailEnabled?.let { preference.emailEnabled = it }
        smsEnabled?.let { preference.smsEnabled = it }
        pushEnabled?.let { preference.pushEnabled = it }
        subscriptionRemindersEnabled?.let { preference.subscriptionRemindersEnabled = it }
        invoiceNotificationsEnabled?.let { preference.invoiceNotificationsEnabled = it }
        classBookingNotificationsEnabled?.let { preference.classBookingNotificationsEnabled = it }
        classReminder24hEnabled?.let { preference.classReminder24hEnabled = it }
        classReminder1hEnabled?.let { preference.classReminder1hEnabled = it }
        marketingEnabled?.let { preference.marketingEnabled = it }
        preferredLanguage?.let { preference.setLanguage(it) }

        return preferenceRepository.save(preference)
    }
}
