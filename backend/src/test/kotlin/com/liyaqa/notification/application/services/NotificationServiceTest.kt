package com.liyaqa.notification.application.services

import com.liyaqa.notification.domain.model.Notification
import com.liyaqa.notification.domain.model.NotificationChannel
import com.liyaqa.notification.domain.model.NotificationPreference
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationStatus
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.notification.domain.ports.NotificationPreferenceRepository
import com.liyaqa.notification.domain.ports.NotificationRepository
import com.liyaqa.notification.infrastructure.sms.SmsService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.notification.domain.ports.EmailService
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NotificationServiceTest {

    @Mock
    private lateinit var notificationRepository: NotificationRepository

    @Mock
    private lateinit var preferenceRepository: NotificationPreferenceRepository

    @Mock
    private lateinit var emailService: EmailService

    @Mock
    private lateinit var smsService: SmsService

    @Mock
    private lateinit var pushNotificationService: PushNotificationService

    private lateinit var notificationService: NotificationService

    private val testMemberId = UUID.randomUUID()
    private val testEmail = "test@example.com"
    private val testPhone = "+1234567890"

    @BeforeEach
    fun setUp() {
        notificationService = NotificationService(
            notificationRepository,
            preferenceRepository,
            emailService,
            smsService,
            pushNotificationService
        )

        // Default: preferences enabled
        whenever(preferenceRepository.findByMemberId(any())) doReturn Optional.of(createDefaultPreference())
        whenever(preferenceRepository.save(any<NotificationPreference>())) doReturn createDefaultPreference()
    }

    @Test
    fun `sendEmail should send email notification when preferences enabled`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.EMAIL)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendEmail(
            memberId = testMemberId,
            email = testEmail,
            type = NotificationType.WELCOME,
            subject = LocalizedText(en = "Welcome"),
            body = LocalizedText(en = "Welcome message")
        )

        // Then
        assertNotNull(result)
        verify(emailService).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
    }

    @Test
    fun `sendEmail should not send when email notifications disabled`() {
        // Given
        val preference = createDefaultPreference()
        preference.emailEnabled = false
        whenever(preferenceRepository.findByMemberId(testMemberId)) doReturn Optional.of(preference)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendEmail(
            memberId = testMemberId,
            email = testEmail,
            type = NotificationType.WELCOME,
            subject = LocalizedText(en = "Welcome"),
            body = LocalizedText(en = "Welcome message")
        )

        // Then
        assertNotNull(result)
        assertEquals(NotificationStatus.FAILED, result.status)
        verify(emailService, never()).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
    }

    @Test
    fun `sendSms should send SMS notification when preferences enabled`() {
        // Given
        whenever(smsService.isAvailable()) doReturn true
        whenever(smsService.send(any(), any())) doReturn "message-id"
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendSms(
            memberId = testMemberId,
            phone = testPhone,
            type = NotificationType.WELCOME,
            body = LocalizedText(en = "Welcome message")
        )

        // Then
        assertNotNull(result)
        verify(smsService).send(any<String>(), any<String>())
    }

    @Test
    fun `sendSms should not send when SMS notifications disabled`() {
        // Given
        val preference = createDefaultPreference()
        preference.smsEnabled = false
        whenever(preferenceRepository.findByMemberId(testMemberId)) doReturn Optional.of(preference)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendSms(
            memberId = testMemberId,
            phone = testPhone,
            type = NotificationType.WELCOME,
            body = LocalizedText(en = "Welcome message")
        )

        // Then
        assertNotNull(result)
        assertEquals(NotificationStatus.FAILED, result.status)
        verify(smsService, never()).send(any<String>(), any<String>())
    }

    @Test
    fun `getNotification should return notification when found`() {
        // Given
        val notification = createTestNotification()
        whenever(notificationRepository.findById(notification.id)) doReturn Optional.of(notification)

        // When
        val result = notificationService.getNotification(notification.id)

        // Then
        assertEquals(notification.id, result.id)
    }

    @Test
    fun `getNotification should throw when notification not found`() {
        // Given
        val notificationId = UUID.randomUUID()
        whenever(notificationRepository.findById(notificationId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            notificationService.getNotification(notificationId)
        }
    }

    @Test
    fun `getUnreadCount should return unread count for member`() {
        // Given
        whenever(notificationRepository.countUnreadByMemberId(testMemberId)) doReturn 5L

        // When
        val result = notificationService.getUnreadCount(testMemberId)

        // Then
        assertEquals(5L, result)
    }

    @Test
    fun `markAsRead should mark notification as read`() {
        // Given
        val sentNotification = Notification(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            notificationType = NotificationType.WELCOME,
            channel = NotificationChannel.EMAIL,
            body = LocalizedText(en = "Test body"),
            subject = LocalizedText(en = "Test subject"),
            recipientEmail = testEmail
        )
        // Set status to SENT via reflection since markSent() requires PENDING
        val statusField = sentNotification.javaClass.getDeclaredField("status")
        statusField.isAccessible = true
        statusField.set(sentNotification, NotificationStatus.SENT)

        whenever(notificationRepository.findById(sentNotification.id)) doReturn Optional.of(sentNotification)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.markAsRead(sentNotification.id)

        // Then
        assertEquals(NotificationStatus.READ, result.status)
    }

    @Test
    fun `isDuplicate should return true when duplicate exists`() {
        // Given
        val referenceId = UUID.randomUUID()
        val referenceType = "invoice"
        val type = NotificationType.INVOICE_CREATED

        whenever(
            notificationRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
                any(), any(), any(), any()
            )
        ) doReturn true

        // When
        val result = notificationService.isDuplicate(referenceId, referenceType, type, 24)

        // Then
        assertTrue(result)
    }

    @Test
    fun `isDuplicate should return false when no duplicate exists`() {
        // Given
        val referenceId = UUID.randomUUID()
        val referenceType = "invoice"
        val type = NotificationType.INVOICE_CREATED

        whenever(
            notificationRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
                any(), any(), any(), any()
            )
        ) doReturn false

        // When
        val result = notificationService.isDuplicate(referenceId, referenceType, type, 24)

        // Then
        assertFalse(result)
    }

    @Test
    fun `sendEmailIfNotDuplicate should return null when duplicate exists`() {
        // Given
        val referenceId = UUID.randomUUID()

        whenever(
            notificationRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
                any(), any(), any(), any()
            )
        ) doReturn true

        // When
        val result = notificationService.sendEmailIfNotDuplicate(
            memberId = testMemberId,
            email = testEmail,
            type = NotificationType.INVOICE_CREATED,
            subject = LocalizedText(en = "Invoice"),
            body = LocalizedText(en = "Invoice details"),
            referenceId = referenceId,
            referenceType = "invoice"
        )

        // Then
        assertNull(result)
    }

    @Test
    fun `sendEmailIfNotDuplicate should send email when no duplicate exists`() {
        // Given
        val referenceId = UUID.randomUUID()

        whenever(
            notificationRepository.existsByReferenceIdAndTypeAndNotificationTypeAfter(
                any(), any(), any(), any()
            )
        ) doReturn false
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendEmailIfNotDuplicate(
            memberId = testMemberId,
            email = testEmail,
            type = NotificationType.INVOICE_CREATED,
            subject = LocalizedText(en = "Invoice"),
            body = LocalizedText(en = "Invoice details"),
            referenceId = referenceId,
            referenceType = "invoice"
        )

        // Then
        assertNotNull(result)
    }

    @Test
    fun `getOrCreatePreference should create default preference when none exists`() {
        // Given
        whenever(preferenceRepository.findByMemberId(testMemberId)) doReturn Optional.empty()
        whenever(preferenceRepository.save(any<NotificationPreference>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.getOrCreatePreference(testMemberId)

        // Then
        assertNotNull(result)
        verify(preferenceRepository).save(any<NotificationPreference>())
    }

    @Test
    fun `updatePreferences should update existing preferences`() {
        // Given
        val preference = createDefaultPreference()
        whenever(preferenceRepository.findByMemberId(testMemberId)) doReturn Optional.of(preference)
        whenever(preferenceRepository.save(any<NotificationPreference>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.updatePreferences(
            memberId = testMemberId,
            emailEnabled = false,
            smsEnabled = false
        )

        // Then
        assertNotNull(result)
        assertFalse(result.emailEnabled)
        assertFalse(result.smsEnabled)
    }

    private fun createTestNotification(
        id: UUID = UUID.randomUUID(),
        memberId: UUID = testMemberId,
        channel: NotificationChannel = NotificationChannel.EMAIL,
        status: NotificationStatus = NotificationStatus.PENDING
    ) = Notification(
        id = id,
        memberId = memberId,
        notificationType = NotificationType.WELCOME,
        channel = channel,
        body = LocalizedText(en = "Test body"),
        subject = LocalizedText(en = "Test subject"),
        status = status,
        recipientEmail = if (channel == NotificationChannel.EMAIL) testEmail else null,
        recipientPhone = if (channel == NotificationChannel.SMS) testPhone else null
    )

    private fun createDefaultPreference() = NotificationPreference.createDefault(testMemberId)

    // ===== sendNotification Tests =====

    @Test
    fun `sendNotification should route EMAIL notifications correctly`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.EMAIL)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        verify(emailService).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
        verify(notificationRepository).save(any<Notification>())
    }

    @Test
    fun `sendNotification should route SMS notifications correctly`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.SMS)
        whenever(smsService.isAvailable()) doReturn true
        whenever(smsService.send(any(), any())) doReturn "msg-123"
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        verify(smsService).send(any<String>(), any<String>())
        verify(notificationRepository).save(any<Notification>())
    }

    @Test
    fun `sendNotification should route PUSH notifications correctly`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.PUSH)
        val pushResult = PushResult(successCount = 1, failureCount = 0, invalidTokens = emptyList())
        whenever(pushNotificationService.sendToMember(any(), any(), any())) doReturn pushResult
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        verify(pushNotificationService).sendToMember(any(), any(), any())
        verify(notificationRepository).save(any<Notification>())
    }

    @Test
    fun `sendNotification should route IN_APP notifications correctly`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.IN_APP)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        verify(notificationRepository).save(any<Notification>())
        verify(emailService, never()).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
        verify(smsService, never()).send(any<String>(), any<String>())
    }

    @Test
    fun `sendNotification should route WHATSAPP notifications correctly`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.WHATSAPP)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        verify(notificationRepository).save(any<Notification>())
        // WhatsApp is queued, not sent immediately
        verify(emailService, never()).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
    }

    // ===== sendPush Tests =====

    @Test
    fun `sendPush should send push notification when service available`() {
        // Given
        val pushResult = PushResult(successCount = 1, failureCount = 0, invalidTokens = emptyList())
        whenever(pushNotificationService.sendToMember(any(), any(), any())) doReturn pushResult
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendPush(
            memberId = testMemberId,
            type = NotificationType.CLASS_BOOKING_CONFIRMED,
            title = LocalizedText(en = "Booking Confirmed"),
            body = LocalizedText(en = "Your booking is confirmed")
        )

        // Then
        assertNotNull(result)
        verify(pushNotificationService).sendToMember(any(), any(), any())
    }

    // ===== sendMultiChannel Tests =====

    @Test
    fun `sendMultiChannel should send to multiple channels`() {
        // Given
        whenever(smsService.isAvailable()) doReturn true
        whenever(smsService.send(any(), any())) doReturn "msg-123"
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val results = notificationService.sendMultiChannel(
            memberId = testMemberId,
            email = testEmail,
            phone = testPhone,
            type = NotificationType.INVOICE_PAID,
            subject = LocalizedText(en = "Invoice Paid"),
            body = LocalizedText(en = "Payment confirmed")
        )

        // Then
        assertEquals(2, results.size)
        verify(emailService).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
        verify(smsService).send(any<String>(), any<String>())
    }

    @Test
    fun `sendMultiChannel should filter by enabled preferences`() {
        // Given
        val preference = createDefaultPreference().apply {
            emailEnabled = true
            smsEnabled = false
        }
        whenever(preferenceRepository.findByMemberId(any())) doReturn Optional.of(preference)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val results = notificationService.sendMultiChannel(
            memberId = testMemberId,
            email = testEmail,
            phone = testPhone,
            type = NotificationType.INVOICE_PAID,
            subject = LocalizedText(en = "Invoice Paid"),
            body = LocalizedText(en = "Payment confirmed")
        )

        // Then
        // Both notifications created (sendEmail and sendSms called), but SMS marked as failed due to preferences
        assertEquals(2, results.size)
        verify(emailService).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
        verify(smsService, never()).send(any<String>(), any<String>()) // SMS not actually sent due to preference
    }

    // ===== processPendingNotifications Tests =====

    @Test
    fun `processPendingNotifications should process pending notifications`() {
        // Given
        val pendingNotification1 = createTestNotification(status = NotificationStatus.PENDING)
        val pendingNotification2 = createTestNotification(status = NotificationStatus.PENDING)
        whenever(notificationRepository.findPendingDue(any(), any()))
            .thenReturn(PageImpl(listOf(pendingNotification1, pendingNotification2)))
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val count = notificationService.processPendingNotifications(batchSize = 10)

        // Then
        assertEquals(2, count)
        verify(emailService, times(2)).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
    }

    @Test
    fun `processPendingNotifications should return zero when no pending notifications`() {
        // Given
        whenever(notificationRepository.findPendingDue(any(), any()))
            .thenReturn(PageImpl(emptyList()))

        // When
        val count = notificationService.processPendingNotifications()

        // Then
        assertEquals(0, count)
    }

    // ===== retryFailedNotifications Tests =====

    @Test
    fun `retryFailedNotifications should retry failed notifications`() {
        // Given
        val failedNotification = createTestNotification(status = NotificationStatus.FAILED)
        whenever(notificationRepository.findFailedRetryable(any()))
            .thenReturn(PageImpl(listOf(failedNotification)))
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val count = notificationService.retryFailedNotifications(batchSize = 10)

        // Then
        assertEquals(1, count)
        verify(emailService).sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>())
    }

    // ===== getNotificationsByMember Tests =====

    @Test
    fun `getNotificationsByMember should return paginated notifications`() {
        // Given
        val notification1 = createTestNotification()
        val notification2 = createTestNotification()
        val pageable = PageRequest.of(0, 10)
        whenever(notificationRepository.findByMemberId(testMemberId, pageable))
            .thenReturn(PageImpl(listOf(notification1, notification2)))

        // When
        val result = notificationService.getNotificationsByMember(testMemberId, pageable)

        // Then
        assertEquals(2, result.content.size)
        verify(notificationRepository).findByMemberId(testMemberId, pageable)
    }

    // Note: sendMultiChannelIfNotDuplicate and markAllAsRead tests removed as these methods
    // don't exist in the current NotificationService implementation

    // ===== Error Handling Tests =====

    @Test
    fun `sendEmail should mark notification as failed when email service throws exception`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.EMAIL)
        whenever(emailService.sendEmail(any<String>(), any<String>(), any<String>(), any<Boolean>()))
            .thenThrow(RuntimeException("Email service down"))
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        assertEquals(NotificationStatus.FAILED, result.status)
        verify(notificationRepository).save(any<Notification>())
    }

    @Test
    fun `sendSms should mark notification as failed when SMS service unavailable`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.SMS)
        whenever(smsService.isAvailable()) doReturn false
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        assertEquals(NotificationStatus.FAILED, result.status)
        verify(notificationRepository).save(any<Notification>())
    }

    @Test
    fun `sendPush should mark notification as failed when push service is null`() {
        // Given
        val pushlessService = NotificationService(
            notificationRepository,
            preferenceRepository,
            emailService,
            smsService,
            null // No push service
        )
        val notification = createTestNotification(channel = NotificationChannel.PUSH)
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = pushlessService.sendNotification(notification)

        // Then
        assertEquals(NotificationStatus.FAILED, result.status)
        assertNotNull(result.failureReason)
        assertTrue(result.failureReason!!.contains("not configured"))
    }

    @Test
    fun `sendPush should mark as failed when all devices fail`() {
        // Given
        val notification = createTestNotification(channel = NotificationChannel.PUSH)
        val pushResult = PushResult(successCount = 0, failureCount = 3, invalidTokens = emptyList())
        whenever(pushNotificationService.sendToMember(any(), any(), any())) doReturn pushResult
        whenever(notificationRepository.save(any<Notification>())).thenAnswer { it.getArgument(0) }

        // When
        val result = notificationService.sendNotification(notification)

        // Then
        assertEquals(NotificationStatus.FAILED, result.status)
    }
}
