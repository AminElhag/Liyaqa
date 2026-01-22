package com.liyaqa.notification.api

import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationPreference
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ==================== COMMON ====================

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)

// ==================== NOTIFICATION DTOS ====================

data class NotificationResponse(
    val id: UUID,
    val memberId: UUID,
    val notificationType: NotificationType,
    val channel: NotificationChannel,
    val subject: LocalizedTextResponse?,
    val body: LocalizedTextResponse,
    val status: NotificationStatus,
    val priority: NotificationPriority,
    val recipientEmail: String?,
    val recipientPhone: String?,
    val scheduledAt: Instant?,
    val sentAt: Instant?,
    val deliveredAt: Instant?,
    val readAt: Instant?,
    val failedAt: Instant?,
    val failureReason: String?,
    val referenceId: UUID?,
    val referenceType: String?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(notification: Notification) = NotificationResponse(
            id = notification.id,
            memberId = notification.memberId,
            notificationType = notification.notificationType,
            channel = notification.channel,
            subject = LocalizedTextResponse.fromNullable(notification.subject),
            body = LocalizedTextResponse.from(notification.body),
            status = notification.status,
            priority = notification.priority,
            recipientEmail = notification.recipientEmail,
            recipientPhone = notification.recipientPhone,
            scheduledAt = notification.scheduledAt,
            sentAt = notification.sentAt,
            deliveredAt = notification.deliveredAt,
            readAt = notification.readAt,
            failedAt = notification.failedAt,
            failureReason = notification.failureReason,
            referenceId = notification.referenceId,
            referenceType = notification.referenceType,
            createdAt = notification.createdAt,
            updatedAt = notification.updatedAt
        )
    }
}

data class SendNotificationRequest(
    @field:NotNull(message = "Member ID is required")
    val memberId: UUID,

    @field:NotNull(message = "Notification type is required")
    val notificationType: NotificationType,

    @field:NotNull(message = "Channel is required")
    val channel: NotificationChannel,

    val subjectEn: String? = null,
    val subjectAr: String? = null,

    @field:NotBlank(message = "Body (English) is required")
    val bodyEn: String,

    val bodyAr: String? = null,

    val recipientEmail: String? = null,
    val recipientPhone: String? = null,

    val priority: NotificationPriority = NotificationPriority.NORMAL,

    val scheduledAt: Instant? = null,

    val referenceId: UUID? = null,
    val referenceType: String? = null
)

// ==================== PREFERENCE DTOS ====================

data class NotificationPreferenceResponse(
    val id: UUID,
    val memberId: UUID,
    val emailEnabled: Boolean,
    val smsEnabled: Boolean,
    val pushEnabled: Boolean,
    val subscriptionRemindersEnabled: Boolean,
    val subscriptionReminderDays: Int,
    val invoiceNotificationsEnabled: Boolean,
    val classBookingNotificationsEnabled: Boolean,
    val classReminder24hEnabled: Boolean,
    val classReminder1hEnabled: Boolean,
    val marketingEnabled: Boolean,
    val preferredLanguage: String,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(preference: NotificationPreference) = NotificationPreferenceResponse(
            id = preference.id,
            memberId = preference.memberId,
            emailEnabled = preference.emailEnabled,
            smsEnabled = preference.smsEnabled,
            pushEnabled = preference.pushEnabled,
            subscriptionRemindersEnabled = preference.subscriptionRemindersEnabled,
            subscriptionReminderDays = preference.subscriptionReminderDays,
            invoiceNotificationsEnabled = preference.invoiceNotificationsEnabled,
            classBookingNotificationsEnabled = preference.classBookingNotificationsEnabled,
            classReminder24hEnabled = preference.classReminder24hEnabled,
            classReminder1hEnabled = preference.classReminder1hEnabled,
            marketingEnabled = preference.marketingEnabled,
            preferredLanguage = preference.preferredLanguage,
            createdAt = preference.createdAt,
            updatedAt = preference.updatedAt
        )
    }
}

data class UpdateNotificationPreferenceRequest(
    val emailEnabled: Boolean? = null,
    val smsEnabled: Boolean? = null,
    val pushEnabled: Boolean? = null,
    val subscriptionRemindersEnabled: Boolean? = null,
    val invoiceNotificationsEnabled: Boolean? = null,
    val classBookingNotificationsEnabled: Boolean? = null,
    val classReminder24hEnabled: Boolean? = null,
    val classReminder1hEnabled: Boolean? = null,
    val marketingEnabled: Boolean? = null,
    val preferredLanguage: String? = null
)
