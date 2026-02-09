package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.model.NotificationLogStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.UUID

interface NotificationLogRepository {
    fun save(log: NotificationLog): NotificationLog
    fun findByAnnouncementId(announcementId: UUID, pageable: Pageable): Page<NotificationLog>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<NotificationLog>
    fun findAll(pageable: Pageable): Page<NotificationLog>
    fun countByStatus(status: NotificationLogStatus): Long
    fun countByChannelAndStatusAndSentAtAfter(
        channel: CommunicationChannel,
        status: NotificationLogStatus,
        after: Instant
    ): Long
}
