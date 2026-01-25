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
import com.liyaqa.shared.infrastructure.email.EmailService
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
        verify(emailService).sendHtmlEmail(any(), any(), any())
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
        verify(emailService, never()).sendHtmlEmail(any(), any(), any())
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
        verify(smsService).send(any(), any())
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
        verify(smsService, never()).send(any(), any())
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
}
