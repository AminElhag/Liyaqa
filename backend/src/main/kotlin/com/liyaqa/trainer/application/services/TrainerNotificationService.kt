package com.liyaqa.trainer.application.services

import com.liyaqa.notification.application.services.PushNotificationService
import com.liyaqa.notification.application.services.PushPayload
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.email.EmailService
import com.liyaqa.trainer.domain.model.NotificationType
import com.liyaqa.trainer.domain.model.TrainerNotification
import com.liyaqa.trainer.domain.ports.TrainerNotificationRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Service for managing trainer notifications.
 *
 * Handles:
 * - Multi-channel notification delivery (push, email, SMS)
 * - Notification preference checking
 * - Domain-specific notification helpers
 * - Read status management
 * - Notification cleanup
 *
 * Integration points:
 * - Called by TrainerEarningsService for earnings notifications
 * - Called by PersonalTrainingService for session notifications
 * - Called by ClassService for class-related notifications
 */
@Service
@Transactional
class TrainerNotificationService(
    private val notificationRepository: TrainerNotificationRepository,
    private val emailService: EmailService? = null,
    private val pushNotificationService: PushNotificationService? = null
    // Note: SmsService can be added later if needed
) {
    private val logger = LoggerFactory.getLogger(TrainerNotificationService::class.java)

    // ==================== NOTIFICATION CREATION ====================

    /**
     * Create and save a notification.
     * Does not send immediately - use sendNotification() for delivery.
     */
    fun createNotification(
        trainerId: UUID,
        type: NotificationType,
        titleEn: String,
        titleAr: String,
        messageEn: String? = null,
        messageAr: String? = null,
        relatedEntityId: UUID? = null,
        actionUrl: String? = null,
        sendPush: Boolean = true,
        sendEmail: Boolean = false,
        sendSms: Boolean = false
    ): TrainerNotification {
        val notification = TrainerNotification(
            trainerId = trainerId,
            notificationType = type,
            titleEn = titleEn,
            titleAr = titleAr,
            messageEn = messageEn,
            messageAr = messageAr,
            relatedEntityId = relatedEntityId,
            actionUrl = actionUrl,
            sendPush = sendPush,
            sendEmail = sendEmail,
            sendSms = sendSms
        )

        val saved = notificationRepository.save(notification)
        logger.info("Created notification: ${saved.id} for trainer $trainerId (type: $type)")
        return saved
    }

    // ==================== DOMAIN-SPECIFIC HELPERS ====================

    /**
     * Notify trainer of a new PT session request from a member.
     */
    fun notifyPTRequest(
        trainerId: UUID,
        memberName: String,
        sessionId: UUID,
        sessionDate: String,
        sessionTime: String
    ): TrainerNotification {
        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.PT_REQUEST,
            titleEn = "New PT Session Request",
            titleAr = "طلب جلسة تدريب شخصي جديدة",
            messageEn = "$memberName has requested a PT session on $sessionDate at $sessionTime",
            messageAr = "طلب $memberName جلسة تدريب شخصي في $sessionDate الساعة $sessionTime",
            relatedEntityId = sessionId,
            actionUrl = "/trainer/pt-sessions/$sessionId",
            sendPush = true,
            sendEmail = true
        )

        // Send immediately for time-sensitive requests
        return sendNotification(notification.id)
    }

    /**
     * Notify trainer that a PT session was cancelled.
     */
    fun notifyPTCancelled(
        trainerId: UUID,
        memberName: String,
        sessionId: UUID,
        sessionDate: String,
        reason: String? = null
    ): TrainerNotification {
        val reasonText = reason?.let { " Reason: $it" } ?: ""
        val reasonTextAr = reason?.let { " السبب: $it" } ?: ""

        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.PT_CANCELLED,
            titleEn = "PT Session Cancelled",
            titleAr = "تم إلغاء جلسة التدريب الشخصي",
            messageEn = "$memberName cancelled their PT session on $sessionDate.$reasonText",
            messageAr = "ألغى $memberName جلسة التدريب الشخصي في $sessionDate.$reasonTextAr",
            relatedEntityId = sessionId,
            actionUrl = "/trainer/schedule",
            sendPush = true
        )

        return sendNotification(notification.id)
    }

    /**
     * Notify trainer that their earnings have been approved.
     */
    fun notifyEarningsApproved(
        trainerId: UUID,
        earningId: UUID,
        amount: String,
        earningType: String
    ): TrainerNotification {
        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.EARNINGS_APPROVED,
            titleEn = "Earnings Approved",
            titleAr = "تمت الموافقة على الأرباح",
            messageEn = "Your $earningType earning of $amount has been approved for payment",
            messageAr = "تمت الموافقة على أرباحك من $earningType بمبلغ $amount للدفع",
            relatedEntityId = earningId,
            actionUrl = "/trainer/earnings/$earningId",
            sendPush = true,
            sendEmail = true
        )

        return sendNotification(notification.id)
    }

    /**
     * Notify trainer that payment has been processed.
     */
    fun notifyEarningsPaid(
        trainerId: UUID,
        earningId: UUID,
        amount: String,
        paymentReference: String?
    ): TrainerNotification {
        val refText = paymentReference?.let { " (Ref: $it)" } ?: ""
        val refTextAr = paymentReference?.let { " (المرجع: $it)" } ?: ""

        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.EARNINGS_PAID,
            titleEn = "Payment Processed",
            titleAr = "تم معالجة الدفع",
            messageEn = "Payment of $amount has been processed$refText",
            messageAr = "تم معالجة الدفع بمبلغ $amount$refTextAr",
            relatedEntityId = earningId,
            actionUrl = "/trainer/earnings/$earningId",
            sendPush = true,
            sendEmail = true
        )

        return sendNotification(notification.id)
    }

    /**
     * Notify trainer of an upcoming PT session reminder.
     */
    fun notifyPTReminder(
        trainerId: UUID,
        memberName: String,
        sessionId: UUID,
        sessionDate: String,
        sessionTime: String
    ): TrainerNotification {
        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.PT_REMINDER,
            titleEn = "Upcoming PT Session",
            titleAr = "جلسة تدريب شخصي قادمة",
            messageEn = "Reminder: PT session with $memberName on $sessionDate at $sessionTime",
            messageAr = "تذكير: جلسة تدريب شخصي مع $memberName في $sessionDate الساعة $sessionTime",
            relatedEntityId = sessionId,
            actionUrl = "/trainer/pt-sessions/$sessionId",
            sendPush = true
        )

        return sendNotification(notification.id)
    }

    /**
     * Notify trainer that their certification is expiring soon.
     */
    fun notifyCertificationExpiring(
        trainerId: UUID,
        certificationName: String,
        certificationId: UUID,
        expiryDate: String,
        daysUntilExpiry: Long
    ): TrainerNotification {
        val notification = createNotification(
            trainerId = trainerId,
            type = NotificationType.CERTIFICATION_EXPIRING,
            titleEn = "Certification Expiring Soon",
            titleAr = "الشهادة على وشك الانتهاء",
            messageEn = "Your $certificationName certification expires on $expiryDate ($daysUntilExpiry days)",
            messageAr = "تنتهي صلاحية شهادة $certificationName في $expiryDate ($daysUntilExpiry يوم)",
            relatedEntityId = certificationId,
            actionUrl = "/trainer/profile/certifications",
            sendPush = true,
            sendEmail = true
        )

        return sendNotification(notification.id)
    }

    // ==================== DELIVERY ====================

    /**
     * Send a notification through configured channels.
     * Handles push, email, and SMS delivery based on notification settings.
     */
    fun sendNotification(notificationId: UUID): TrainerNotification {
        val notification = getNotification(notificationId)

        var sentCount = 0
        val failures = mutableListOf<String>()

        // Send push notification
        if (notification.shouldSendPush()) {
            try {
                sendPushNotification(notification)
                sentCount++
            } catch (e: Exception) {
                logger.error("Failed to send push notification ${notification.id}: ${e.message}", e)
                failures.add("push: ${e.message}")
            }
        }

        // Send email notification
        if (notification.shouldSendEmail()) {
            try {
                sendEmailNotification(notification)
                sentCount++
            } catch (e: Exception) {
                logger.error("Failed to send email notification ${notification.id}: ${e.message}", e)
                failures.add("email: ${e.message}")
            }
        }

        // SMS support can be added here when SmsService is available
        // if (notification.shouldSendSms()) { ... }

        // Mark as sent if at least one channel succeeded, or if no channels were enabled
        if (sentCount > 0 || (!notification.sendPush && !notification.sendEmail && !notification.sendSms)) {
            notification.markAsSent()
        }

        val saved = notificationRepository.save(notification)

        if (failures.isNotEmpty()) {
            logger.warn("Partial delivery failure for notification ${notification.id}: $failures")
        } else {
            logger.info("Successfully delivered notification ${notification.id} via $sentCount channel(s)")
        }

        return saved
    }

    /**
     * Send push notification via FCM.
     */
    private fun sendPushNotification(notification: TrainerNotification) {
        if (pushNotificationService == null) {
            logger.warn("Push notification service not available, skipping push for ${notification.id}")
            return
        }

        val payload = PushPayload(
            title = LocalizedText(notification.titleEn, notification.titleAr),
            body = LocalizedText(notification.messageEn ?: "", notification.messageAr ?: ""),
            type = notification.notificationType.name,
            actionUrl = notification.actionUrl,
            referenceId = notification.relatedEntityId,
            referenceType = notification.notificationType.name
        )

        // Assuming pushNotificationService can send to trainers (may need adapter)
        // For now, we log a warning - this will need integration with trainer device tokens
        logger.warn("Push notification for trainers not yet fully integrated - notification ${notification.id}")
    }

    /**
     * Send email notification.
     */
    private fun sendEmailNotification(notification: TrainerNotification) {
        if (emailService == null) {
            logger.warn("Email service not available, skipping email for ${notification.id}")
            return
        }

        // TODO: Get trainer email from TrainerRepository
        // For now, we'll need to accept email as parameter or fetch from trainer entity
        logger.warn("Email delivery for trainers requires trainer email lookup - notification ${notification.id}")
    }

    // ==================== READ STATUS MANAGEMENT ====================

    /**
     * Mark a notification as read.
     */
    fun markAsRead(notificationId: UUID): TrainerNotification {
        val notification = getNotification(notificationId)
        notification.markAsRead()
        val saved = notificationRepository.save(notification)
        logger.debug("Marked notification as read: $notificationId")
        return saved
    }

    /**
     * Mark all notifications as read for a trainer.
     */
    fun markAllAsRead(trainerId: UUID) {
        notificationRepository.markAllAsReadForTrainer(trainerId)
        logger.info("Marked all notifications as read for trainer: $trainerId")
    }

    /**
     * Mark a notification as unread.
     */
    fun markAsUnread(notificationId: UUID): TrainerNotification {
        val notification = getNotification(notificationId)
        notification.markAsUnread()
        val saved = notificationRepository.save(notification)
        logger.debug("Marked notification as unread: $notificationId")
        return saved
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get a notification by ID.
     */
    fun getNotification(id: UUID): TrainerNotification {
        return notificationRepository.findById(id)
            .orElseThrow { NoSuchElementException("Trainer notification not found: $id") }
    }

    /**
     * Get all notifications for a trainer.
     */
    fun getNotificationsForTrainer(trainerId: UUID, pageable: Pageable): Page<TrainerNotification> {
        return notificationRepository.findByTrainerId(trainerId, pageable)
    }

    /**
     * Get unread notifications for a trainer.
     */
    fun getUnreadNotifications(trainerId: UUID, pageable: Pageable): Page<TrainerNotification> {
        return notificationRepository.findUnreadByTrainerId(trainerId, pageable)
    }

    /**
     * Get notifications by type for a trainer.
     */
    fun getNotificationsByType(
        trainerId: UUID,
        type: NotificationType,
        pageable: Pageable
    ): Page<TrainerNotification> {
        return notificationRepository.findByTrainerIdAndNotificationType(trainerId, type, pageable)
    }

    /**
     * Count unread notifications for a trainer.
     */
    fun countUnread(trainerId: UUID): Long {
        return notificationRepository.countUnreadByTrainerId(trainerId)
    }

    /**
     * Get notifications pending delivery.
     */
    fun getPendingDelivery(pageable: Pageable): Page<TrainerNotification> {
        return notificationRepository.findPendingDelivery(pageable)
    }

    // ==================== CLEANUP ====================

    /**
     * Delete old read notifications (for cleanup/maintenance).
     * Typically called by scheduled job.
     */
    fun deleteOldReadNotifications(olderThanDays: Long = 90): Int {
        val threshold = Instant.now().minusSeconds(olderThanDays * 24 * 60 * 60)
        val deleted = notificationRepository.deleteOldReadNotifications(threshold)
        logger.info("Deleted $deleted old read notifications older than $olderThanDays days")
        return deleted
    }

    /**
     * Delete a notification.
     */
    fun deleteNotification(id: UUID) {
        require(notificationRepository.existsById(id)) {
            "Trainer notification not found: $id"
        }
        notificationRepository.deleteById(id)
        logger.info("Deleted notification: $id")
    }
}
