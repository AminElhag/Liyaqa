package com.liyaqa.member.data.dto

import kotlinx.serialization.Serializable

/**
 * Notification DTOs matching backend notification-related responses.
 */

/**
 * Notification response.
 * Matches backend NotificationLiteResponse from /api/me/notifications.
 */
@Serializable
data class NotificationLiteDto(
    val id: String,
    val type: String, // NotificationType enum as string
    val subject: LocalizedTextDto,
    val body: LocalizedTextDto,
    val channel: String, // NotificationChannel enum as string
    val isRead: Boolean,
    val createdAt: String // ISO-8601 Instant
)

/**
 * Unread notification count response.
 */
@Serializable
data class UnreadCountDto(
    val count: Int
)
