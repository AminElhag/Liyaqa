package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.OrganizationAwareEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

/**
 * TrainerNotification entity representing notifications sent to trainers.
 *
 * Key features:
 * - Supports multiple notification types (PT requests, reminders, etc.)
 * - Bilingual messages (English/Arabic)
 * - Tracks read status and delivery status
 * - Supports multiple delivery channels (push, email, SMS)
 * - Can link to related entities (sessions, earnings, etc.)
 * - Includes action URLs for deep linking
 */
@Entity
@Table(name = "trainer_notifications")
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class TrainerNotification(
    id: UUID = UUID.randomUUID(),

    /**
     * Reference to the Trainer who will receive this notification.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * Type of notification for categorization and filtering.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    var notificationType: NotificationType,

    /**
     * Notification title in English.
     */
    @Column(name = "title_en", nullable = false, columnDefinition = "TEXT")
    var titleEn: String,

    /**
     * Notification title in Arabic.
     */
    @Column(name = "title_ar", nullable = false, columnDefinition = "TEXT")
    var titleAr: String,

    /**
     * Notification message body in English.
     */
    @Column(name = "message_en", columnDefinition = "TEXT")
    var messageEn: String? = null,

    /**
     * Notification message body in Arabic.
     */
    @Column(name = "message_ar", columnDefinition = "TEXT")
    var messageAr: String? = null,

    /**
     * ID of related entity (PT session, class session, earnings, etc.).
     */
    @Column(name = "related_entity_id")
    var relatedEntityId: UUID? = null,

    /**
     * Whether the notification has been read by the trainer.
     */
    @Column(name = "is_read", nullable = false)
    var isRead: Boolean = false,

    /**
     * Timestamp when the notification was read.
     */
    @Column(name = "read_at")
    var readAt: Instant? = null,

    /**
     * Whether to send a push notification.
     */
    @Column(name = "send_push", nullable = false)
    var sendPush: Boolean = false,

    /**
     * Whether to send an email notification.
     */
    @Column(name = "send_email", nullable = false)
    var sendEmail: Boolean = false,

    /**
     * Whether to send an SMS notification.
     */
    @Column(name = "send_sms", nullable = false)
    var sendSms: Boolean = false,

    /**
     * Timestamp when notification was successfully sent/delivered.
     */
    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    /**
     * Deep link or URL to navigate to when notification is clicked.
     * Example: "/trainer/pt-sessions/123" or "liyaqa://trainer/pt-sessions/123"
     */
    @Column(name = "action_url", columnDefinition = "TEXT")
    var actionUrl: String? = null

) : OrganizationAwareEntity(id) {

    // ========== Domain Methods ==========

    /**
     * Mark notification as read.
     */
    fun markAsRead() {
        if (!isRead) {
            isRead = true
            readAt = Instant.now()
        }
    }

    /**
     * Mark notification as unread.
     */
    fun markAsUnread() {
        if (isRead) {
            isRead = false
            readAt = null
        }
    }

    /**
     * Mark notification as sent.
     */
    fun markAsSent() {
        if (sentAt == null) {
            sentAt = Instant.now()
        }
    }

    /**
     * Get title in specified language.
     */
    fun getTitle(language: String): String {
        return when (language.lowercase()) {
            "ar" -> titleAr
            else -> titleEn
        }
    }

    /**
     * Get message in specified language.
     */
    fun getMessage(language: String): String? {
        return when (language.lowercase()) {
            "ar" -> messageAr
            else -> messageEn
        }
    }

    // ========== Query Helpers ==========

    /**
     * Check if notification should be delivered via push.
     */
    fun shouldSendPush(): Boolean = sendPush && sentAt == null

    /**
     * Check if notification should be delivered via email.
     */
    fun shouldSendEmail(): Boolean = sendEmail && sentAt == null

    /**
     * Check if notification should be delivered via SMS.
     */
    fun shouldSendSms(): Boolean = sendSms && sentAt == null

    /**
     * Check if notification has been delivered.
     */
    fun isDelivered(): Boolean = sentAt != null

    /**
     * Check if notification is actionable (has action URL).
     */
    fun isActionable(): Boolean = !actionUrl.isNullOrBlank()
}
