package com.liyaqa.trainer.application.services

import com.liyaqa.notification.application.services.PushNotificationService
import com.liyaqa.shared.infrastructure.email.EmailService
import com.liyaqa.trainer.domain.model.NotificationType
import com.liyaqa.trainer.domain.model.TrainerNotification
import com.liyaqa.trainer.domain.ports.TrainerNotificationRepository
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerNotificationServiceTest {

    @Mock
    private lateinit var notificationRepository: TrainerNotificationRepository

    @Mock
    private lateinit var emailService: EmailService

    @Mock
    private lateinit var pushNotificationService: PushNotificationService

    private lateinit var notificationService: TrainerNotificationService

    private lateinit var testTrainerId: UUID
    private lateinit var testNotification: TrainerNotification

    @BeforeEach
    fun setUp() {
        notificationService = TrainerNotificationService(
            notificationRepository,
            emailService,
            pushNotificationService
        )

        testTrainerId = UUID.randomUUID()

        testNotification = TrainerNotification(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            notificationType = NotificationType.PT_REQUEST,
            titleEn = "New PT Request",
            titleAr = "طلب جديد",
            messageEn = "You have a new PT request",
            messageAr = "لديك طلب جديد",
            sendPush = true,
            sendEmail = false
        )
    }

    // ==================== NOTIFICATION CREATION ====================

    @Test
    fun `createNotification saves notification successfully`() {
        whenever(notificationRepository.save(any())).thenAnswer { it.arguments[0] as TrainerNotification }

        val result = notificationService.createNotification(
            trainerId = testTrainerId,
            type = NotificationType.PT_REQUEST,
            titleEn = "Test",
            titleAr = "اختبار",
            sendPush = true
        )

        assertEquals(testTrainerId, result.trainerId)
        assertEquals(NotificationType.PT_REQUEST, result.notificationType)
        assertTrue(result.sendPush)
        verify(notificationRepository).save(any())
    }

    // ==================== DOMAIN-SPECIFIC HELPERS ====================

    @Test
    fun `notifyPTRequest creates and sends notification`() {
        whenever(notificationRepository.save(any())).thenAnswer { it.arguments[0] as TrainerNotification }
        whenever(notificationRepository.findById(any())).thenAnswer {
            Optional.of(it.arguments[0] as UUID).map { testNotification }
        }

        val result = notificationService.notifyPTRequest(
            trainerId = testTrainerId,
            memberName = "John Doe",
            sessionId = UUID.randomUUID(),
            sessionDate = "2024-01-15",
            sessionTime = "10:00"
        )

        assertEquals(NotificationType.PT_REQUEST, result.notificationType)
        assertTrue(result.titleEn.contains("Request"))
        verify(notificationRepository, times(2)).save(any())
    }

    @Test
    fun `notifyEarningsApproved creates notification with correct details`() {
        whenever(notificationRepository.save(any())).thenAnswer { it.arguments[0] as TrainerNotification }
        whenever(notificationRepository.findById(any())).thenAnswer {
            Optional.of(testNotification)
        }

        val result = notificationService.notifyEarningsApproved(
            trainerId = testTrainerId,
            earningId = UUID.randomUUID(),
            amount = "100.00 SAR",
            earningType = "PT_SESSION"
        )

        assertEquals(NotificationType.EARNINGS_APPROVED, result.notificationType)
        assertTrue(result.messageEn!!.contains("100.00 SAR"))
        verify(notificationRepository, times(2)).save(any())
    }

    // ==================== READ STATUS MANAGEMENT ====================

    @Test
    fun `markAsRead updates read status`() {
        whenever(notificationRepository.findById(testNotification.id)).thenReturn(Optional.of(testNotification))
        whenever(notificationRepository.save(any())).thenAnswer { it.arguments[0] as TrainerNotification }

        val result = notificationService.markAsRead(testNotification.id)

        assertTrue(result.isRead)
        assertNotNull(result.readAt)
        verify(notificationRepository).save(any())
    }

    @Test
    fun `markAllAsRead calls repository method`() {
        notificationService.markAllAsRead(testTrainerId)

        verify(notificationRepository).markAllAsReadForTrainer(testTrainerId)
    }

    @Test
    fun `markAsUnread updates read status to false`() {
        testNotification.isRead = true
        testNotification.readAt = Instant.now()

        whenever(notificationRepository.findById(testNotification.id)).thenReturn(Optional.of(testNotification))
        whenever(notificationRepository.save(any())).thenAnswer { it.arguments[0] as TrainerNotification }

        val result = notificationService.markAsUnread(testNotification.id)

        assertFalse(result.isRead)
        assertNull(result.readAt)
        verify(notificationRepository).save(any())
    }

    // ==================== QUERY OPERATIONS ====================

    @Test
    fun `getNotification returns notification by id`() {
        whenever(notificationRepository.findById(testNotification.id)).thenReturn(Optional.of(testNotification))

        val result = notificationService.getNotification(testNotification.id)

        assertEquals(testNotification.id, result.id)
    }

    @Test
    fun `getNotification throws exception when not found`() {
        whenever(notificationRepository.findById(any())).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            notificationService.getNotification(UUID.randomUUID())
        }
    }

    @Test
    fun `getNotificationsForTrainer returns paginated notifications`() {
        val notifications = listOf(testNotification)
        val page = PageImpl(notifications, PageRequest.of(0, 10), 1)

        whenever(notificationRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10)))
            .thenReturn(page)

        val result = notificationService.getNotificationsForTrainer(testTrainerId, PageRequest.of(0, 10))

        assertEquals(1, result.totalElements)
        assertEquals(testNotification.id, result.content[0].id)
    }

    @Test
    fun `getUnreadNotifications returns only unread notifications`() {
        val notifications = listOf(testNotification)
        val page = PageImpl(notifications, PageRequest.of(0, 10), 1)

        whenever(notificationRepository.findUnreadByTrainerId(testTrainerId, PageRequest.of(0, 10)))
            .thenReturn(page)

        val result = notificationService.getUnreadNotifications(testTrainerId, PageRequest.of(0, 10))

        assertEquals(1, result.totalElements)
        assertFalse(result.content[0].isRead)
    }

    @Test
    fun `countUnread returns correct count`() {
        whenever(notificationRepository.countUnreadByTrainerId(testTrainerId)).thenReturn(5L)

        val result = notificationService.countUnread(testTrainerId)

        assertEquals(5L, result)
    }

    // ==================== CLEANUP ====================

    @Test
    fun `deleteOldReadNotifications removes old notifications`() {
        whenever(notificationRepository.deleteOldReadNotifications(any())).thenReturn(10)

        val result = notificationService.deleteOldReadNotifications(90)

        assertEquals(10, result)
        verify(notificationRepository).deleteOldReadNotifications(any())
    }

    @Test
    fun `deleteNotification deletes notification successfully`() {
        whenever(notificationRepository.existsById(testNotification.id)).thenReturn(true)

        notificationService.deleteNotification(testNotification.id)

        verify(notificationRepository).deleteById(testNotification.id)
    }

    @Test
    fun `deleteNotification throws exception when notification not found`() {
        whenever(notificationRepository.existsById(any())).thenReturn(false)

        assertThrows(IllegalArgumentException::class.java) {
            notificationService.deleteNotification(UUID.randomUUID())
        }
    }
}
