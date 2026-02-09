package com.liyaqa.platform.communication.service

import com.liyaqa.platform.communication.dto.DeliveryStatsResponse
import com.liyaqa.platform.communication.dto.NotificationStatsResponse
import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationLogStatus
import com.liyaqa.platform.communication.repository.NotificationLogRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

@Service
@Transactional(readOnly = true)
class NotificationStatsService(
    private val notificationLogRepository: NotificationLogRepository
) {

    fun getNotificationStats(): NotificationStatsResponse {
        val startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS)
        return NotificationStatsResponse(
            totalSent = notificationLogRepository.countByStatus(NotificationLogStatus.SENT),
            totalDelivered = notificationLogRepository.countByStatus(NotificationLogStatus.DELIVERED),
            totalFailed = notificationLogRepository.countByStatus(NotificationLogStatus.FAILED),
            totalPending = notificationLogRepository.countByStatus(NotificationLogStatus.PENDING),
            emailsSentToday = notificationLogRepository.countByChannelAndStatusAndSentAtAfter(
                CommunicationChannel.EMAIL, NotificationLogStatus.SENT, startOfDay
            ),
            smsSentToday = notificationLogRepository.countByChannelAndStatusAndSentAtAfter(
                CommunicationChannel.SMS, NotificationLogStatus.SENT, startOfDay
            )
        )
    }

    fun getAnnouncementDeliveryStats(announcementId: UUID): DeliveryStatsResponse {
        val logs = notificationLogRepository.findByAnnouncementId(
            announcementId,
            org.springframework.data.domain.Pageable.unpaged()
        )
        val content = logs.content
        return DeliveryStatsResponse(
            announcementId = announcementId,
            totalSent = content.count { it.status == NotificationLogStatus.SENT }.toLong(),
            totalDelivered = content.count { it.status == NotificationLogStatus.DELIVERED }.toLong(),
            totalFailed = content.count { it.status == NotificationLogStatus.FAILED }.toLong(),
            totalPending = content.count { it.status == NotificationLogStatus.PENDING }.toLong()
        )
    }
}
