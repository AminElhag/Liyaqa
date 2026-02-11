package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.PlatformUserNotificationResponse
import com.liyaqa.platform.communication.repository.PlatformUserNotificationRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service("platformUserNotificationService")
class PlatformUserNotificationService(
    private val repository: PlatformUserNotificationRepository
) {

    fun getNotificationsForUser(userId: UUID): List<PlatformUserNotificationResponse> {
        return repository.findByRecipientIdOrderByCreatedAtDesc(userId)
            .map { PlatformUserNotificationResponse.from(it) }
    }

    @Transactional
    fun markAsRead(id: UUID, userId: UUID) {
        val notification = repository.findById(id)
            .orElseThrow { NoSuchElementException("Notification not found") }
        require(notification.recipientId == userId) { "Not authorized to access this notification" }
        notification.markRead()
        repository.save(notification)
    }

    @Transactional
    fun markAllAsRead(userId: UUID) {
        repository.markAllReadByRecipientId(userId)
    }

    @Transactional
    fun deleteNotification(id: UUID, userId: UUID) {
        repository.deleteByIdAndRecipientId(id, userId)
    }
}
