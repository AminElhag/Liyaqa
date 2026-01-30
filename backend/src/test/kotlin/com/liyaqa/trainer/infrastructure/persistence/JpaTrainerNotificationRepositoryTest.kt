package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.trainer.domain.model.NotificationType
import com.liyaqa.trainer.domain.model.TrainerNotification
import com.liyaqa.trainer.domain.ports.TrainerNotificationRepository
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for JpaTrainerNotificationRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JpaTrainerNotificationRepositoryTest {

    @Autowired
    private lateinit var notificationRepository: TrainerNotificationRepository

    private lateinit var testTenantId: UUID
    private lateinit var testTrainerId: UUID

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        testTrainerId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun createTestNotification(
        trainerId: UUID = testTrainerId,
        type: NotificationType = NotificationType.PT_REQUEST,
        isRead: Boolean = false,
        sendPush: Boolean = true,
        sendEmail: Boolean = false,
        sentAt: Instant? = null
    ): TrainerNotification {
        val notification = TrainerNotification(
            id = UUID.randomUUID(),
            trainerId = trainerId,
            notificationType = type,
            titleEn = "Test Notification",
            titleAr = "إشعار تجريبي",
            messageEn = "Test message",
            messageAr = "رسالة تجريبية",
            isRead = isRead,
            sendPush = sendPush,
            sendEmail = sendEmail,
            sentAt = sentAt
        )
        notification.javaClass.superclass.getDeclaredField("tenantId").apply {
            isAccessible = true
            set(notification, testTenantId)
        }
        return notification
    }

    @Test
    fun `save new notification persists to database`() {
        val notification = createTestNotification()
        val savedNotification = notificationRepository.save(notification)

        val foundNotification = notificationRepository.findById(savedNotification.id)
        assertTrue(foundNotification.isPresent)
        assertEquals(notification.trainerId, foundNotification.get().trainerId)
        assertEquals(notification.titleEn, foundNotification.get().titleEn)
        assertNotNull(foundNotification.get().createdAt)
    }

    @Test
    fun `findByTrainerId returns all notifications for trainer`() {
        val notification1 = createTestNotification()
        val notification2 = createTestNotification()
        val notification3 = createTestNotification(trainerId = UUID.randomUUID()) // Different trainer

        notificationRepository.save(notification1)
        notificationRepository.save(notification2)
        notificationRepository.save(notification3)

        val notifications = notificationRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, notifications.totalElements)
    }

    @Test
    fun `findUnreadByTrainerId returns only unread notifications`() {
        val unreadNotification1 = createTestNotification(isRead = false)
        val unreadNotification2 = createTestNotification(isRead = false)
        val readNotification = createTestNotification(isRead = true).apply {
            readAt = Instant.now()
        }

        notificationRepository.save(unreadNotification1)
        notificationRepository.save(unreadNotification2)
        notificationRepository.save(readNotification)

        val unreadNotifications = notificationRepository.findUnreadByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, unreadNotifications.totalElements)
        assertTrue(unreadNotifications.content.all { !it.isRead })
    }

    @Test
    fun `findByTrainerIdAndNotificationType filters by type correctly`() {
        val ptRequest = createTestNotification(type = NotificationType.PT_REQUEST)
        val ptCancelled = createTestNotification(type = NotificationType.PT_CANCELLED)
        val earningsApproved = createTestNotification(type = NotificationType.EARNINGS_APPROVED)

        notificationRepository.save(ptRequest)
        notificationRepository.save(ptCancelled)
        notificationRepository.save(earningsApproved)

        val ptNotifications = notificationRepository.findByTrainerIdAndNotificationType(
            testTrainerId,
            NotificationType.PT_REQUEST,
            PageRequest.of(0, 10)
        )
        assertEquals(1, ptNotifications.totalElements)
        assertEquals(NotificationType.PT_REQUEST, ptNotifications.content[0].notificationType)
    }

    @Test
    fun `countUnreadByTrainerId returns correct count`() {
        val unread1 = createTestNotification(isRead = false)
        val unread2 = createTestNotification(isRead = false)
        val read = createTestNotification(isRead = true).apply { readAt = Instant.now() }

        notificationRepository.save(unread1)
        notificationRepository.save(unread2)
        notificationRepository.save(read)

        val count = notificationRepository.countUnreadByTrainerId(testTrainerId)
        assertEquals(2, count)
    }

    @Test
    fun `findPendingDelivery returns unsent notifications`() {
        val pendingPush = createTestNotification(sendPush = true, sentAt = null)
        val pendingEmail = createTestNotification(sendEmail = true, sentAt = null)
        val sent = createTestNotification(sendPush = true, sentAt = Instant.now())

        notificationRepository.save(pendingPush)
        notificationRepository.save(pendingEmail)
        notificationRepository.save(sent)

        val pendingNotifications = notificationRepository.findPendingDelivery(PageRequest.of(0, 10))
        assertTrue(pendingNotifications.totalElements >= 2)
        assertTrue(pendingNotifications.content.all { it.sentAt == null })
    }

    @Test
    fun `markAllAsReadForTrainer marks all unread as read`() {
        val unread1 = createTestNotification(isRead = false)
        val unread2 = createTestNotification(isRead = false)
        val alreadyRead = createTestNotification(isRead = true).apply { readAt = Instant.now() }

        notificationRepository.save(unread1)
        notificationRepository.save(unread2)
        notificationRepository.save(alreadyRead)

        notificationRepository.markAllAsReadForTrainer(testTrainerId)

        val unreadCount = notificationRepository.countUnreadByTrainerId(testTrainerId)
        assertEquals(0, unreadCount)
    }

    @Test
    fun `deleteOldReadNotifications removes old read notifications`() {
        val oldRead = createTestNotification(isRead = true).apply {
            readAt = Instant.now().minus(100, ChronoUnit.DAYS)
        }
        val recentRead = createTestNotification(isRead = true).apply {
            readAt = Instant.now().minus(1, ChronoUnit.DAYS)
        }
        val unread = createTestNotification(isRead = false)

        notificationRepository.save(oldRead)
        notificationRepository.save(recentRead)
        notificationRepository.save(unread)

        val threshold = Instant.now().minus(90, ChronoUnit.DAYS)
        val deletedCount = notificationRepository.deleteOldReadNotifications(threshold)

        assertTrue(deletedCount >= 1)
    }

    @Test
    fun `mark notification as read updates read status`() {
        val notification = createTestNotification(isRead = false)
        notificationRepository.save(notification)

        notification.markAsRead()
        val updatedNotification = notificationRepository.save(notification)

        val foundNotification = notificationRepository.findById(updatedNotification.id).get()
        assertTrue(foundNotification.isRead)
        assertNotNull(foundNotification.readAt)
    }

    @Test
    fun `mark notification as sent updates sent timestamp`() {
        val notification = createTestNotification(sentAt = null)
        notificationRepository.save(notification)

        notification.markAsSent()
        val updatedNotification = notificationRepository.save(notification)

        val foundNotification = notificationRepository.findById(updatedNotification.id).get()
        assertNotNull(foundNotification.sentAt)
    }

    @Test
    fun `delete removes notification from database`() {
        val notification = createTestNotification()
        val savedNotification = notificationRepository.save(notification)

        notificationRepository.deleteById(savedNotification.id)

        val foundNotification = notificationRepository.findById(savedNotification.id)
        assertFalse(foundNotification.isPresent)
    }
}
