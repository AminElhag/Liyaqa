package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.PlatformUserNotification
import java.util.Optional
import java.util.UUID

interface PlatformUserNotificationRepository {
    fun save(notification: PlatformUserNotification): PlatformUserNotification
    fun findById(id: UUID): Optional<PlatformUserNotification>
    fun findByRecipientIdOrderByCreatedAtDesc(recipientId: UUID): List<PlatformUserNotification>
    fun countByRecipientIdAndReadFalse(recipientId: UUID): Long
    fun markAllReadByRecipientId(recipientId: UUID)
    fun deleteByIdAndRecipientId(id: UUID, recipientId: UUID)
}
