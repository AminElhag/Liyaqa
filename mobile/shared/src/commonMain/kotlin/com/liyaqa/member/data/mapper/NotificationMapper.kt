package com.liyaqa.member.data.mapper

import com.liyaqa.member.data.dto.NotificationLiteDto
import com.liyaqa.member.domain.model.Notification
import com.liyaqa.member.domain.model.NotificationChannel
import com.liyaqa.member.domain.model.NotificationType

/**
 * Mappers for notification-related DTOs to domain models.
 */

/**
 * Maps notification lite DTO to domain Notification.
 */
fun NotificationLiteDto.toDomain(): Notification = Notification(
    id = id,
    type = NotificationType.valueOf(type),
    subject = subject.toDomain(),
    body = body.toDomain(),
    channel = NotificationChannel.valueOf(channel),
    isRead = isRead,
    createdAt = createdAt.toInstant()
)
