package com.liyaqa.notification.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Stores a member's notification preferences.
 * Controls which notifications they receive and through which channels.
 */
@Entity
@Table(name = "notification_preferences")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class NotificationPreference(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true)
    val memberId: UUID,

    // Channel preferences
    @Column(name = "email_enabled", nullable = false)
    var emailEnabled: Boolean = true,

    @Column(name = "sms_enabled", nullable = false)
    var smsEnabled: Boolean = true,

    @Column(name = "whatsapp_enabled")
    var whatsappEnabled: Boolean = true,

    @Column(name = "push_enabled", nullable = false)
    var pushEnabled: Boolean = true,

    // Subscription notifications
    @Column(name = "subscription_reminders_enabled", nullable = false)
    var subscriptionRemindersEnabled: Boolean = true,

    @Column(name = "subscription_reminder_days", nullable = false)
    var subscriptionReminderDays: Int = 7,

    // Invoice notifications
    @Column(name = "invoice_notifications_enabled", nullable = false)
    var invoiceNotificationsEnabled: Boolean = true,

    // Class booking notifications
    @Column(name = "class_booking_notifications_enabled", nullable = false)
    var classBookingNotificationsEnabled: Boolean = true,

    @Column(name = "class_reminder_24h_enabled", nullable = false)
    var classReminder24hEnabled: Boolean = true,

    @Column(name = "class_reminder_1h_enabled", nullable = false)
    var classReminder1hEnabled: Boolean = true,

    // Marketing/promotional
    @Column(name = "marketing_enabled", nullable = false)
    var marketingEnabled: Boolean = false,

    // Language preference
    @Column(name = "preferred_language", nullable = false)
    var preferredLanguage: String = "en"

) : BaseEntity(id) {

    /**
     * Checks if member should receive notification for given type and channel.
     */
    fun shouldReceive(type: NotificationType, channel: NotificationChannel): Boolean {
        // Check channel enabled
        val channelEnabled = when (channel) {
            NotificationChannel.EMAIL -> emailEnabled
            NotificationChannel.SMS -> smsEnabled
            NotificationChannel.WHATSAPP -> whatsappEnabled
            NotificationChannel.PUSH -> pushEnabled
            NotificationChannel.IN_APP -> true
        }
        if (!channelEnabled) return false

        // Check notification type enabled
        return when (type) {
            // Subscription lifecycle notifications
            NotificationType.SUBSCRIPTION_CREATED,
            NotificationType.SUBSCRIPTION_EXPIRING_7_DAYS,
            NotificationType.SUBSCRIPTION_EXPIRING_3_DAYS,
            NotificationType.SUBSCRIPTION_EXPIRING_1_DAY,
            NotificationType.SUBSCRIPTION_EXPIRED,
            NotificationType.SUBSCRIPTION_FROZEN,
            NotificationType.SUBSCRIPTION_UNFROZEN,
            NotificationType.SUBSCRIPTION_CANCELLED,
            NotificationType.SUBSCRIPTION_RENEWED,
            NotificationType.LOW_CLASSES_REMAINING -> subscriptionRemindersEnabled

            // Invoice notifications
            NotificationType.INVOICE_CREATED,
            NotificationType.INVOICE_DUE_SOON,
            NotificationType.INVOICE_OVERDUE,
            NotificationType.INVOICE_PAID -> invoiceNotificationsEnabled

            // Class booking notifications
            NotificationType.CLASS_BOOKING_CONFIRMED,
            NotificationType.CLASS_BOOKING_CANCELLED,
            NotificationType.CLASS_WAITLIST_PROMOTED,
            NotificationType.CLASS_SESSION_CANCELLED -> classBookingNotificationsEnabled

            // Class reminders
            NotificationType.CLASS_BOOKING_REMINDER_24H -> classReminder24hEnabled
            NotificationType.CLASS_BOOKING_REMINDER_1H -> classReminder1hEnabled

            // Always send these (important account/security notifications)
            NotificationType.CHECK_IN_CONFIRMATION,
            NotificationType.WELCOME,
            NotificationType.PASSWORD_RESET,
            NotificationType.PASSWORD_CHANGED,
            NotificationType.ACCOUNT_LOCKED,
            NotificationType.MEMBER_SUSPENDED,
            NotificationType.MEMBER_REACTIVATED,
            NotificationType.CUSTOM -> true
        }
    }

    /**
     * Enables all notifications.
     */
    fun enableAll() {
        emailEnabled = true
        smsEnabled = true
        whatsappEnabled = true
        pushEnabled = true
        subscriptionRemindersEnabled = true
        invoiceNotificationsEnabled = true
        classBookingNotificationsEnabled = true
        classReminder24hEnabled = true
        classReminder1hEnabled = true
    }

    /**
     * Disables all optional notifications (keeps essential ones).
     */
    fun disableAll() {
        subscriptionRemindersEnabled = false
        invoiceNotificationsEnabled = false
        classBookingNotificationsEnabled = false
        classReminder24hEnabled = false
        classReminder1hEnabled = false
        marketingEnabled = false
    }

    /**
     * Updates the preferred language.
     */
    fun setLanguage(language: String) {
        require(language == "en" || language == "ar") { "Supported languages: en, ar" }
        preferredLanguage = language
    }

    companion object {
        /**
         * Creates default preferences for a new member.
         */
        fun createDefault(memberId: UUID): NotificationPreference {
            return NotificationPreference(memberId = memberId)
        }
    }
}
