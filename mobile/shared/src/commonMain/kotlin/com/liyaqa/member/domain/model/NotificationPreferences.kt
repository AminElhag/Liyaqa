package com.liyaqa.member.domain.model

/**
 * Member's notification preferences.
 * Controls which notifications are sent and through which channels.
 */
data class NotificationPreferences(
    val memberId: String,

    // Channel preferences
    val emailEnabled: Boolean,
    val smsEnabled: Boolean,
    val pushEnabled: Boolean,

    // Type preferences
    val subscriptionReminders: Boolean,
    val invoiceAlerts: Boolean,
    val bookingUpdates: Boolean,
    val classReminders: Boolean,
    val marketing: Boolean,

    // Language preference
    val preferredLanguage: String
) {
    /**
     * Returns true if all notification channels are disabled.
     */
    val allChannelsDisabled: Boolean
        get() = !emailEnabled && !smsEnabled && !pushEnabled

    /**
     * Returns true if all notification types are disabled.
     */
    val allTypesDisabled: Boolean
        get() = !subscriptionReminders && !invoiceAlerts && !bookingUpdates && !classReminders && !marketing

    companion object {
        /**
         * Creates default preferences with all notifications enabled.
         */
        fun defaults(memberId: String): NotificationPreferences = NotificationPreferences(
            memberId = memberId,
            emailEnabled = true,
            smsEnabled = true,
            pushEnabled = true,
            subscriptionReminders = true,
            invoiceAlerts = true,
            bookingUpdates = true,
            classReminders = true,
            marketing = false,
            preferredLanguage = "en"
        )
    }
}
