package com.liyaqa.notification.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
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
 * Represents a notification sent to a member.
 * Tracks delivery status across multiple channels.
 */
@Entity
@Table(name = "notifications")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Notification(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    val notificationType: NotificationType,

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", nullable = false)
    val channel: NotificationChannel,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "subject_en")),
        AttributeOverride(name = "ar", column = Column(name = "subject_ar"))
    )
    var subject: LocalizedText? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "body_en", nullable = false, columnDefinition = "TEXT")),
        AttributeOverride(name = "ar", column = Column(name = "body_ar", columnDefinition = "TEXT"))
    )
    var body: LocalizedText,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: NotificationStatus = NotificationStatus.PENDING,

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    var priority: NotificationPriority = NotificationPriority.NORMAL,

    @Column(name = "recipient_email")
    var recipientEmail: String? = null,

    @Column(name = "recipient_phone")
    var recipientPhone: String? = null,

    @Column(name = "scheduled_at")
    var scheduledAt: Instant? = null,

    @Column(name = "sent_at")
    var sentAt: Instant? = null,

    @Column(name = "delivered_at")
    var deliveredAt: Instant? = null,

    @Column(name = "read_at")
    var readAt: Instant? = null,

    @Column(name = "failed_at")
    var failedAt: Instant? = null,

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    var failureReason: String? = null,

    @Column(name = "retry_count", nullable = false)
    var retryCount: Int = 0,

    @Column(name = "max_retries", nullable = false)
    var maxRetries: Int = 3,

    @Column(name = "reference_id")
    var referenceId: UUID? = null,

    @Column(name = "reference_type")
    var referenceType: String? = null,

    @Column(name = "external_id")
    var externalId: String? = null,

    @Column(name = "metadata", columnDefinition = "TEXT")
    var metadata: String? = null,

    // WhatsApp-specific fields
    @Column(name = "whatsapp_message_id")
    var whatsappMessageId: String? = null,

    @Column(name = "whatsapp_status")
    var whatsappStatus: String? = null

) : BaseEntity(id) {

    /**
     * Marks the notification as sent.
     */
    fun markSent(externalId: String? = null) {
        require(status == NotificationStatus.PENDING) { "Can only mark pending notifications as sent" }
        status = NotificationStatus.SENT
        sentAt = Instant.now()
        this.externalId = externalId
    }

    /**
     * Marks the notification as delivered.
     */
    fun markDelivered() {
        require(status == NotificationStatus.SENT) { "Can only mark sent notifications as delivered" }
        status = NotificationStatus.DELIVERED
        deliveredAt = Instant.now()
    }

    /**
     * Marks the notification as read.
     */
    fun markRead() {
        require(status == NotificationStatus.SENT || status == NotificationStatus.DELIVERED) {
            "Can only mark sent or delivered notifications as read"
        }
        status = NotificationStatus.READ
        readAt = Instant.now()
    }

    /**
     * Marks the notification as failed.
     */
    fun markFailed(reason: String) {
        status = NotificationStatus.FAILED
        failedAt = Instant.now()
        failureReason = reason
    }

    /**
     * Increments retry count and resets to pending for retry.
     */
    fun scheduleRetry() {
        require(retryCount < maxRetries) { "Maximum retries exceeded" }
        retryCount++
        status = NotificationStatus.PENDING
        failedAt = null
        failureReason = null
    }

    /**
     * Checks if notification can be retried.
     */
    fun canRetry(): Boolean = status == NotificationStatus.FAILED && retryCount < maxRetries

    /**
     * Checks if notification is due for sending.
     */
    fun isDue(): Boolean {
        if (status != NotificationStatus.PENDING) return false
        if (scheduledAt == null) return true
        return Instant.now().isAfter(scheduledAt)
    }

    /**
     * Checks if notification has been read.
     */
    fun isRead(): Boolean = status == NotificationStatus.READ

    /**
     * Sets a reference to a related entity (e.g., subscription, invoice, booking).
     */
    fun setReference(id: UUID, type: String) {
        referenceId = id
        referenceType = type
    }

    companion object {
        /**
         * Creates a notification for email channel.
         */
        fun forEmail(
            memberId: UUID,
            type: NotificationType,
            email: String,
            subject: LocalizedText,
            body: LocalizedText,
            priority: NotificationPriority = NotificationPriority.NORMAL
        ): Notification {
            return Notification(
                memberId = memberId,
                notificationType = type,
                channel = NotificationChannel.EMAIL,
                recipientEmail = email,
                subject = subject,
                body = body,
                priority = priority
            )
        }

        /**
         * Creates a notification for SMS channel.
         */
        fun forSms(
            memberId: UUID,
            type: NotificationType,
            phone: String,
            body: LocalizedText,
            priority: NotificationPriority = NotificationPriority.NORMAL
        ): Notification {
            return Notification(
                memberId = memberId,
                notificationType = type,
                channel = NotificationChannel.SMS,
                recipientPhone = phone,
                body = body,
                priority = priority
            )
        }

        /**
         * Creates a notification for WhatsApp channel.
         */
        fun forWhatsApp(
            memberId: UUID,
            type: NotificationType,
            phone: String,
            body: LocalizedText,
            priority: NotificationPriority = NotificationPriority.NORMAL
        ): Notification {
            return Notification(
                memberId = memberId,
                notificationType = type,
                channel = NotificationChannel.WHATSAPP,
                recipientPhone = phone,
                body = body,
                priority = priority
            )
        }
    }
}
