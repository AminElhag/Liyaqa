package com.liyaqa.notification.infrastructure.persistence

import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.notification.domain.ports.NotificationRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

interface SpringDataNotificationRepository : JpaRepository<Notification, UUID> {
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Notification>
    fun findByMemberIdAndStatus(memberId: UUID, status: NotificationStatus, pageable: Pageable): Page<Notification>
    fun findByMemberIdAndChannel(memberId: UUID, channel: NotificationChannel, pageable: Pageable): Page<Notification>
    fun findByStatus(status: NotificationStatus, pageable: Pageable): Page<Notification>
    fun findByReferenceIdAndReferenceType(referenceId: UUID, referenceType: String): List<Notification>
    fun countByMemberIdAndStatus(memberId: UUID, status: NotificationStatus): Long

    @Query("""
        SELECT n FROM Notification n
        WHERE n.status = 'PENDING'
        AND (n.scheduledAt IS NULL OR n.scheduledAt <= :now)
        ORDER BY n.priority DESC, n.createdAt ASC
    """)
    fun findPendingDue(@Param("now") now: Instant, pageable: Pageable): Page<Notification>

    @Query("""
        SELECT n FROM Notification n
        WHERE n.status = 'FAILED'
        AND n.retryCount < n.maxRetries
        ORDER BY n.failedAt ASC
    """)
    fun findFailedRetryable(pageable: Pageable): Page<Notification>

    @Query("""
        SELECT COUNT(n) FROM Notification n
        WHERE n.memberId = :memberId
        AND n.status IN ('SENT', 'DELIVERED')
        AND n.readAt IS NULL
    """)
    fun countUnreadByMemberId(@Param("memberId") memberId: UUID): Long

    @Query("""
        SELECT n FROM Notification n
        WHERE n.memberId = :memberId
        AND n.status IN ('SENT', 'DELIVERED')
        AND n.readAt IS NULL
        ORDER BY n.createdAt DESC
    """)
    fun findUnreadByMemberId(@Param("memberId") memberId: UUID, pageable: Pageable): Page<Notification>

    @Query("""
        SELECT COUNT(n) > 0 FROM Notification n
        WHERE n.referenceId = :referenceId
        AND n.referenceType = :referenceType
        AND n.notificationType = :notificationType
        AND n.createdAt > :after
    """)
    fun existsByReferenceIdAndTypeAndNotificationTypeAfter(
        @Param("referenceId") referenceId: UUID,
        @Param("referenceType") referenceType: String,
        @Param("notificationType") notificationType: NotificationType,
        @Param("after") after: Instant
    ): Boolean

    fun findByWhatsappMessageId(whatsappMessageId: String): Notification?
}

@Repository
class JpaNotificationRepository(
    private val springDataRepository: SpringDataNotificationRepository
) : NotificationRepository {

    override fun save(notification: Notification): Notification =
        springDataRepository.save(notification)

    override fun saveAll(notifications: List<Notification>): List<Notification> =
        springDataRepository.saveAll(notifications)

    override fun findById(id: UUID): Optional<Notification> =
        springDataRepository.findById(id)

    override fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Notification> =
        springDataRepository.findByMemberId(memberId, pageable)

    override fun findByMemberIdAndStatus(
        memberId: UUID,
        status: NotificationStatus,
        pageable: Pageable
    ): Page<Notification> =
        springDataRepository.findByMemberIdAndStatus(memberId, status, pageable)

    override fun findByMemberIdAndChannel(
        memberId: UUID,
        channel: NotificationChannel,
        pageable: Pageable
    ): Page<Notification> =
        springDataRepository.findByMemberIdAndChannel(memberId, channel, pageable)

    override fun findByStatus(status: NotificationStatus, pageable: Pageable): Page<Notification> =
        springDataRepository.findByStatus(status, pageable)

    override fun findPendingDue(now: Instant, pageable: Pageable): Page<Notification> =
        springDataRepository.findPendingDue(now, pageable)

    override fun findFailedRetryable(pageable: Pageable): Page<Notification> =
        springDataRepository.findFailedRetryable(pageable)

    override fun findByReferenceIdAndType(referenceId: UUID, referenceType: String): List<Notification> =
        springDataRepository.findByReferenceIdAndReferenceType(referenceId, referenceType)

    override fun findAll(pageable: Pageable): Page<Notification> =
        springDataRepository.findAll(pageable)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByMemberIdAndStatus(memberId: UUID, status: NotificationStatus): Long =
        springDataRepository.countByMemberIdAndStatus(memberId, status)

    override fun countUnreadByMemberId(memberId: UUID): Long =
        springDataRepository.countUnreadByMemberId(memberId)

    override fun findUnreadByMemberId(memberId: UUID, pageable: Pageable): Page<Notification> =
        springDataRepository.findUnreadByMemberId(memberId, pageable)

    override fun existsByReferenceIdAndTypeAndNotificationTypeAfter(
        referenceId: UUID,
        referenceType: String,
        notificationType: NotificationType,
        after: Instant
    ): Boolean = springDataRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
        referenceId, referenceType, notificationType, after
    )

    override fun findByWhatsAppMessageId(whatsappMessageId: String): Notification? =
        springDataRepository.findByWhatsappMessageId(whatsappMessageId)
}
