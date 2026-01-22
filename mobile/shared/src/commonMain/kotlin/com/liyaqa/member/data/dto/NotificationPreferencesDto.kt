package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Notification preferences DTOs matching backend NotificationController responses.
 */

/**
 * Notification preferences response.
 * Matches backend NotificationPreferencesResponse.
 */
@Serializable
data class NotificationPreferencesDto(
    val memberId: String,
    val channelPreferences: ChannelPreferencesDto,
    val typePreferences: TypePreferencesDto,
    val preferredLanguage: String
)

/**
 * Channel preferences (email, sms, push).
 */
@Serializable
data class ChannelPreferencesDto(
    val emailEnabled: Boolean = true,
    val smsEnabled: Boolean = true,
    val pushEnabled: Boolean = true
)

/**
 * Type preferences for different notification categories.
 */
@Serializable
data class TypePreferencesDto(
    val subscriptionReminders: Boolean = true,
    val invoiceAlerts: Boolean = true,
    val bookingUpdates: Boolean = true,
    val classReminders: Boolean = true,
    val marketing: Boolean = false
)

/**
 * Request to update notification preferences.
 * Matches backend UpdateNotificationPreferencesRequest.
 */
@Serializable
data class UpdatePreferencesRequestDto(
    val channelPreferences: ChannelPreferencesDto? = null,
    val typePreferences: TypePreferencesDto? = null,
    val preferredLanguage: String? = null
)
