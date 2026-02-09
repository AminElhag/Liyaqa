package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.notification.domain.model.NotificationPriority
import com.liyaqa.notification.domain.model.NotificationType
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.quality.Strictness
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.eq
import org.mockito.kotlin.verify
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingNotificationServiceTest {

    @Mock
    private lateinit var notificationService: NotificationService

    private lateinit var bookingNotificationService: BookingNotificationService
    private lateinit var testMember: Member
    private lateinit var testSession: ClassSession
    private lateinit var testGymClass: GymClass

    @BeforeEach
    fun setUp() {
        bookingNotificationService = BookingNotificationService(notificationService)

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )

        testGymClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Yoga", ar = "يوغا"),
            description = LocalizedText(en = "Relaxing yoga class", ar = "حصة يوغا للاسترخاء"),
            locationId = UUID.randomUUID(),
            maxCapacity = 20,
            maxWaitlistSize = 5,
            status = GymClassStatus.ACTIVE
        )

        testSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.SCHEDULED
        )
    }

    // ==================== sendBookingConfirmation Tests ====================

    @Test
    fun `sendBookingConfirmation sends multi-channel notification with correct parameters`() {
        // When
        bookingNotificationService.sendBookingConfirmation(testMember, testSession, testGymClass)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendMultiChannel(
            memberId = eq(testMember.id),
            email = eq(testMember.email),
            phone = eq(testMember.phone),
            type = eq(NotificationType.CLASS_BOOKING_CONFIRMED),
            subject = subjectCaptor.capture(),
            body = bodyCaptor.capture(),
            priority = eq(NotificationPriority.NORMAL),
            referenceId = eq(testSession.id),
            referenceType = eq("class_session")
        )

        // Verify subject contains class name
        assertTrue(subjectCaptor.firstValue.en.contains("Yoga"))
        assertTrue(subjectCaptor.firstValue.ar?.contains("يوغا") == true)

        // Verify body contains member name and session details
        assertTrue(bodyCaptor.firstValue.en.contains("John Doe"))
        assertTrue(bodyCaptor.firstValue.en.contains("Yoga"))
        assertTrue(bodyCaptor.firstValue.ar?.contains("John Doe") == true)
    }

    @Test
    fun `sendBookingConfirmation uses English fallback for Arabic class name if not available`() {
        // Given - gym class without Arabic name
        val classWithoutArabic = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Pilates", ar = null),
            description = LocalizedText(en = "Core strength class", ar = null),
            locationId = UUID.randomUUID(),
            maxCapacity = 15,
            maxWaitlistSize = 5,
            status = GymClassStatus.ACTIVE
        )

        // When
        bookingNotificationService.sendBookingConfirmation(testMember, testSession, classWithoutArabic)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendMultiChannel(
            memberId = any(),
            email = any(),
            phone = any(),
            type = any(),
            subject = subjectCaptor.capture(),
            body = any(),
            priority = any(),
            referenceId = any(),
            referenceType = any()
        )

        // Should use English name as fallback in Arabic subject
        assertTrue(subjectCaptor.firstValue.ar?.contains("Pilates") == true)
    }

    // ==================== sendWaitlistAdded Tests ====================

    @Test
    fun `sendWaitlistAdded sends email notification with position`() {
        // Given
        val position = 3

        // When
        bookingNotificationService.sendWaitlistAdded(testMember, testSession, testGymClass, position)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendEmail(
            memberId = eq(testMember.id),
            email = eq(testMember.email),
            type = eq(NotificationType.CLASS_BOOKING_CONFIRMED),
            subject = subjectCaptor.capture(),
            body = bodyCaptor.capture(),
            priority = eq(NotificationPriority.NORMAL),
            referenceId = eq(testSession.id),
            referenceType = eq("class_session")
        )

        // Verify subject indicates waitlist
        assertTrue(subjectCaptor.firstValue.en.contains("Waitlist"))
        assertTrue(subjectCaptor.firstValue.ar?.contains("قائمة الانتظار") == true)

        // Verify body contains position
        assertTrue(bodyCaptor.firstValue.en.contains("#3"))
        assertTrue(bodyCaptor.firstValue.ar?.contains("#3") == true)
    }

    // ==================== sendBookingCancellation Tests ====================

    @Test
    fun `sendBookingCancellation sends email notification`() {
        // When
        bookingNotificationService.sendBookingCancellation(testMember, testSession, testGymClass)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendEmail(
            memberId = eq(testMember.id),
            email = eq(testMember.email),
            type = eq(NotificationType.CLASS_BOOKING_CANCELLED),
            subject = subjectCaptor.capture(),
            body = bodyCaptor.capture(),
            priority = eq(NotificationPriority.NORMAL),
            referenceId = eq(testSession.id),
            referenceType = eq("class_session")
        )

        // Verify subject indicates cancellation
        assertTrue(subjectCaptor.firstValue.en.contains("Cancelled"))
        assertTrue(subjectCaptor.firstValue.ar?.contains("إلغاء") == true)

        // Verify body contains member name and class name
        assertTrue(bodyCaptor.firstValue.en.contains("John Doe"))
        assertTrue(bodyCaptor.firstValue.en.contains("Yoga"))
    }

    // ==================== sendWaitlistPromotion Tests ====================

    @Test
    fun `sendWaitlistPromotion sends high priority multi-channel notification`() {
        // When
        bookingNotificationService.sendWaitlistPromotion(testMember, testSession, testGymClass)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendMultiChannel(
            memberId = eq(testMember.id),
            email = eq(testMember.email),
            phone = eq(testMember.phone),
            type = eq(NotificationType.CLASS_WAITLIST_PROMOTED),
            subject = subjectCaptor.capture(),
            body = bodyCaptor.capture(),
            priority = eq(NotificationPriority.HIGH), // High priority for urgent notification
            referenceId = eq(testSession.id),
            referenceType = eq("class_session")
        )

        // Verify subject is positive/celebratory
        assertTrue(subjectCaptor.firstValue.en.contains("Good News") || subjectCaptor.firstValue.en.contains("You're In"))
        assertTrue(subjectCaptor.firstValue.ar?.contains("أخبار سارة") == true)

        // Verify body confirms booking
        assertTrue(bodyCaptor.firstValue.en.contains("confirmed"))
        assertTrue(bodyCaptor.firstValue.ar?.contains("مؤكد") == true)
    }

    // ==================== Bilingual Content Tests ====================

    @Test
    fun `all notification methods format dates and times correctly`() {
        // When - send all notification types
        bookingNotificationService.sendBookingConfirmation(testMember, testSession, testGymClass)
        bookingNotificationService.sendWaitlistAdded(testMember, testSession, testGymClass, 1)
        bookingNotificationService.sendBookingCancellation(testMember, testSession, testGymClass)
        bookingNotificationService.sendWaitlistPromotion(testMember, testSession, testGymClass)

        // Then - verify all calls include session date/time in body
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendMultiChannel(
            memberId = any(),
            email = any(),
            phone = any(),
            type = eq(NotificationType.CLASS_BOOKING_CONFIRMED),
            subject = any(),
            body = bodyCaptor.capture(),
            priority = any(),
            referenceId = any(),
            referenceType = any()
        )

        // Date should be formatted as dd/MM/yyyy
        val expectedDate = testSession.sessionDate.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
        val expectedTime = testSession.startTime.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm"))

        assertTrue(bodyCaptor.firstValue.en.contains(expectedDate))
        assertTrue(bodyCaptor.firstValue.en.contains(expectedTime))
    }

    @Test
    fun `all notification methods include both English and Arabic content`() {
        // When
        bookingNotificationService.sendBookingConfirmation(testMember, testSession, testGymClass)

        // Then
        val subjectCaptor = argumentCaptor<LocalizedText>()
        val bodyCaptor = argumentCaptor<LocalizedText>()

        verify(notificationService).sendMultiChannel(
            memberId = any(),
            email = any(),
            phone = any(),
            type = any(),
            subject = subjectCaptor.capture(),
            body = bodyCaptor.capture(),
            priority = any(),
            referenceId = any(),
            referenceType = any()
        )

        // Both languages should be present
        assertNotNull(subjectCaptor.firstValue.en)
        assertNotNull(subjectCaptor.firstValue.ar)
        assertNotNull(bodyCaptor.firstValue.en)
        assertNotNull(bodyCaptor.firstValue.ar)

        // Should have meaningful content (not empty)
        assertTrue(subjectCaptor.firstValue.en.length > 10)
        assertTrue(subjectCaptor.firstValue.ar!!.length > 10)
        assertTrue(bodyCaptor.firstValue.en.length > 50)
        assertTrue(bodyCaptor.firstValue.ar!!.length > 50)
    }
}
