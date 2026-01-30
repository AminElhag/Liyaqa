package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.NotificationType
import com.liyaqa.trainer.domain.model.TrainerNotification
import com.liyaqa.trainer.domain.ports.TrainerNotificationRepository
import jakarta.transaction.Transactional
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository for TrainerNotification entity.
 */
interface SpringDataTrainerNotificationRepository : JpaRepository<TrainerNotification, UUID> {
    /**
     * Find all notifications for a trainer.
     */
    fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerNotification>

    /**
     * Find unread notifications for a trainer.
     */
    @Query("""
        SELECT tn FROM TrainerNotification tn
        WHERE tn.trainerId = :trainerId
        AND tn.isRead = false
        ORDER BY tn.createdAt DESC
    """)
    fun findUnreadByTrainerId(@Param("trainerId") trainerId: UUID, pageable: Pageable): Page<TrainerNotification>

    /**
     * Find notifications by trainer and type.
     */
    fun findByTrainerIdAndNotificationType(
        trainerId: UUID,
        type: NotificationType,
        pageable: Pageable
    ): Page<TrainerNotification>

    /**
     * Count unread notifications for a trainer.
     */
    @Query("SELECT COUNT(tn) FROM TrainerNotification tn WHERE tn.trainerId = :trainerId AND tn.isRead = false")
    fun countUnreadByTrainerId(@Param("trainerId") trainerId: UUID): Long

    /**
     * Find notifications pending delivery (not yet sent).
     */
    @Query("""
        SELECT tn FROM TrainerNotification tn
        WHERE tn.sentAt IS NULL
        AND (tn.sendPush = true OR tn.sendEmail = true OR tn.sendSms = true)
        ORDER BY tn.createdAt ASC
    """)
    fun findPendingDelivery(pageable: Pageable): Page<TrainerNotification>

    /**
     * Mark all notifications as read for a trainer.
     */
    @Modifying
    @Query("""
        UPDATE TrainerNotification tn
        SET tn.isRead = true, tn.readAt = :now
        WHERE tn.trainerId = :trainerId
        AND tn.isRead = false
    """)
    fun markAllAsReadForTrainer(@Param("trainerId") trainerId: UUID, @Param("now") now: Instant): Int

    /**
     * Delete old read notifications (for cleanup).
     */
    @Modifying
    @Query("""
        DELETE FROM TrainerNotification tn
        WHERE tn.isRead = true
        AND tn.readAt < :olderThan
    """)
    fun deleteOldReadNotifications(@Param("olderThan") olderThan: Instant): Int
}

/**
 * Adapter implementing TrainerNotificationRepository using Spring Data JPA.
 */
@Repository
class JpaTrainerNotificationRepository(
    private val springDataRepository: SpringDataTrainerNotificationRepository
) : TrainerNotificationRepository {

    override fun save(notification: TrainerNotification): TrainerNotification {
        return springDataRepository.save(notification)
    }

    override fun findById(id: UUID): Optional<TrainerNotification> {
        return springDataRepository.findById(id)
    }

    override fun findAll(pageable: Pageable): Page<TrainerNotification> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun findByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerNotification> {
        return springDataRepository.findByTrainerId(trainerId, pageable)
    }

    override fun findUnreadByTrainerId(trainerId: UUID, pageable: Pageable): Page<TrainerNotification> {
        return springDataRepository.findUnreadByTrainerId(trainerId, pageable)
    }

    override fun findByTrainerIdAndNotificationType(
        trainerId: UUID,
        type: NotificationType,
        pageable: Pageable
    ): Page<TrainerNotification> {
        return springDataRepository.findByTrainerIdAndNotificationType(trainerId, type, pageable)
    }

    override fun countUnreadByTrainerId(trainerId: UUID): Long {
        return springDataRepository.countUnreadByTrainerId(trainerId)
    }

    override fun findPendingDelivery(pageable: Pageable): Page<TrainerNotification> {
        return springDataRepository.findPendingDelivery(pageable)
    }

    @Transactional
    override fun markAllAsReadForTrainer(trainerId: UUID) {
        springDataRepository.markAllAsReadForTrainer(trainerId, Instant.now())
    }

    @Transactional
    override fun deleteOldReadNotifications(olderThan: Instant): Int {
        return springDataRepository.deleteOldReadNotifications(olderThan)
    }

    override fun findAllByIds(ids: List<UUID>): List<TrainerNotification> {
        return springDataRepository.findAllById(ids).toList()
    }
}
