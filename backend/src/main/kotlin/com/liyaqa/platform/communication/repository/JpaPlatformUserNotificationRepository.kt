package com.liyaqa.platform.communication.repository

import com.liyaqa.platform.communication.model.PlatformUserNotification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.util.Optional
import java.util.UUID

interface SpringDataPlatformUserNotificationRepository : JpaRepository<PlatformUserNotification, UUID> {
    fun findByRecipientIdOrderByCreatedAtDesc(recipientId: UUID): List<PlatformUserNotification>
    fun countByRecipientIdAndReadFalse(recipientId: UUID): Long

    @Modifying
    @Transactional
    @Query("UPDATE PlatformUserNotification n SET n.read = true WHERE n.recipientId = :recipientId AND n.read = false")
    fun markAllReadByRecipientId(recipientId: UUID)

    fun deleteByIdAndRecipientId(id: UUID, recipientId: UUID)
}

@Repository
class JpaPlatformUserNotificationRepository(
    private val springDataRepository: SpringDataPlatformUserNotificationRepository
) : PlatformUserNotificationRepository {

    override fun save(notification: PlatformUserNotification): PlatformUserNotification =
        springDataRepository.save(notification)

    override fun findById(id: UUID): Optional<PlatformUserNotification> =
        springDataRepository.findById(id)

    override fun findByRecipientIdOrderByCreatedAtDesc(recipientId: UUID): List<PlatformUserNotification> =
        springDataRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId)

    override fun countByRecipientIdAndReadFalse(recipientId: UUID): Long =
        springDataRepository.countByRecipientIdAndReadFalse(recipientId)

    override fun markAllReadByRecipientId(recipientId: UUID) =
        springDataRepository.markAllReadByRecipientId(recipientId)

    @Transactional
    override fun deleteByIdAndRecipientId(id: UUID, recipientId: UUID) =
        springDataRepository.deleteByIdAndRecipientId(id, recipientId)
}
