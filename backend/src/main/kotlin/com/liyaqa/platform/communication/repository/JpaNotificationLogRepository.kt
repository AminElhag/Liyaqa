package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.CommunicationChannel
import com.liyaqa.platform.communication.model.NotificationLog
import com.liyaqa.platform.communication.model.NotificationLogStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

interface SpringDataNotificationLogRepository : JpaRepository<NotificationLog, UUID> {
    fun findByAnnouncementId(announcementId: UUID, pageable: Pageable): Page<NotificationLog>
    fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<NotificationLog>
    fun countByStatus(status: NotificationLogStatus): Long
    fun countByChannelAndStatusAndSentAtAfter(
        channel: CommunicationChannel,
        status: NotificationLogStatus,
        after: Instant
    ): Long
}

@Repository
class JpaNotificationLogRepository(
    private val springDataRepository: SpringDataNotificationLogRepository
) : NotificationLogRepository {

    override fun save(log: NotificationLog): NotificationLog =
        springDataRepository.save(log)

    override fun findByAnnouncementId(announcementId: UUID, pageable: Pageable): Page<NotificationLog> =
        springDataRepository.findByAnnouncementId(announcementId, pageable)

    override fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<NotificationLog> =
        springDataRepository.findByTenantId(tenantId, pageable)

    override fun findAll(pageable: Pageable): Page<NotificationLog> =
        springDataRepository.findAll(pageable)

    override fun countByStatus(status: NotificationLogStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByChannelAndStatusAndSentAtAfter(
        channel: CommunicationChannel,
        status: NotificationLogStatus,
        after: Instant
    ): Long = springDataRepository.countByChannelAndStatusAndSentAtAfter(channel, status, after)
}
