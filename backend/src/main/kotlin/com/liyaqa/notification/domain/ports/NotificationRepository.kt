package com.liyaqa.notification.domain.ports

import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for Notification entities.
 */
interface NotificationRepository {
    fun save(notification: Notification): Notification
    fun saveAll(notifications: List<Notification>): List<Notification>
    fun findById(id: UUID): Optional<Notification>
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Notification>
    fun findByMemberIdAndStatus(memberId: UUID, status: NotificationStatus, pageable: Pageable): Page<Notification>
    fun findByMemberIdAndChannel(memberId: UUID, channel: NotificationChannel, pageable: Pageable): Page<Notification>
    fun findByStatus(status: NotificationStatus, pageable: Pageable): Page<Notification>
    fun findPendingDue(now: Instant, pageable: Pageable): Page<Notification>
    fun findFailedRetryable(pageable: Pageable): Page<Notification>
    fun findByReferenceIdAndType(referenceId: UUID, referenceType: String): List<Notification>
    fun findAll(pageable: Pageable): Page<Notification>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
    fun count(): Long
    fun countByMemberIdAndStatus(memberId: UUID, status: NotificationStatus): Long
    fun countUnreadByMemberId(memberId: UUID): Long
    fun findUnreadByMemberId(memberId: UUID, pageable: Pageable): Page<Notification>

    /**
     * Checks if a notification of the given type was already sent for the reference after a certain time.
     * Used for deduplication to avoid sending duplicate notifications.
     */
    fun existsByReferenceIdAndTypeAndNotificationTypeAfter(
        referenceId: UUID,
        referenceType: String,
        notificationType: NotificationType,
        after: Instant
    ): Boolean

    /**
     * Finds a notification by its WhatsApp message ID.
     * Used for processing WhatsApp webhook status updates.
     */
    fun findByWhatsAppMessageId(whatsappMessageId: String): Notification?
}
