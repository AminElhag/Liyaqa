package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.quality.Strictness
import org.mockito.kotlin.*
import java.time.LocalDate
import java.time.LocalTime
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingWaitlistServiceTest {

    @Mock
    private lateinit var bookingRepository: ClassBookingRepository

    @Mock
    private lateinit var sessionRepository: ClassSessionRepository

    @Mock
    private lateinit var gymClassRepository: GymClassRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var notificationService: BookingNotificationService

    private lateinit var waitlistService: BookingWaitlistService
    private lateinit var testSession: ClassSession
    private lateinit var testGymClass: GymClass
    private lateinit var testMember: Member

    @BeforeEach
    fun setUp() {
        waitlistService = BookingWaitlistService(
            bookingRepository,
            sessionRepository,
            gymClassRepository,
            memberRepository,
            notificationService
        )

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
            currentBookings = 19, // Almost full
            waitlistCount = 1,
            status = SessionStatus.SCHEDULED
        )
    }

    // ==================== promoteFromWaitlist Tests ====================

    @Test
    fun `promoteFromWaitlist promotes first waitlisted booking to confirmed`() {
        // Given
        val waitlistedBooking = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = testMember.id,
            position = 1,
            subscriptionId = UUID.randomUUID()
        )

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(waitlistedBooking))
            .doReturn(emptyList()) // After promotion, waitlist is empty
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { it.arguments[0] }
        whenever(memberRepository.findById(testMember.id)).doReturn(Optional.of(testMember))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))

        // When
        waitlistService.promoteFromWaitlist(testSession.id, testSession, testGymClass)

        // Then - verify booking was saved (promoted)
        verify(bookingRepository, atLeastOnce()).save(any<ClassBooking>())
        verify(sessionRepository).save(any<ClassSession>())
        verify(notificationService).sendWaitlistPromotion(testMember, testSession, testGymClass)
    }

    @Test
    fun `promoteFromWaitlist does nothing when waitlist is empty`() {
        // Given
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(emptyList())

        // When
        waitlistService.promoteFromWaitlist(testSession.id, testSession, testGymClass)

        // Then
        verify(bookingRepository, never()).save(any<ClassBooking>())
        verify(sessionRepository, never()).save(any<ClassSession>())
        verify(notificationService, never()).sendWaitlistPromotion(any(), any(), any())
    }

    @Test
    fun `promoteFromWaitlist loads session and gymClass when not provided`() {
        // Given
        val waitlistedBooking = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = testMember.id,
            position = 1,
            subscriptionId = UUID.randomUUID()
        )

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(waitlistedBooking))
            .doReturn(emptyList()) // After promotion
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }
        whenever(sessionRepository.findById(testSession.id)).doReturn(Optional.of(testSession))
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { it.arguments[0] }
        whenever(memberRepository.findById(testMember.id)).doReturn(Optional.of(testMember))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))

        // When - pass null for session and gymClass
        waitlistService.promoteFromWaitlist(testSession.id, null, null)

        // Then
        verify(sessionRepository).findById(testSession.id)
        verify(gymClassRepository).findById(testGymClass.id)
        verify(notificationService).sendWaitlistPromotion(testMember, testSession, testGymClass)
    }

    @Test
    fun `promoteFromWaitlist reorders remaining waitlist after promotion`() {
        // Given - 3 people on waitlist
        val booking1 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 1,
            subscriptionId = UUID.randomUUID()
        )
        val booking2 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 2,
            subscriptionId = UUID.randomUUID()
        )
        val booking3 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 3,
            subscriptionId = UUID.randomUUID()
        )

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(booking1, booking2, booking3))
            .doReturn(listOf(booking2, booking3)) // After promotion, remaining waitlist

        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { it.arguments[0] }
        whenever(memberRepository.findById(any())).doReturn(Optional.of(testMember))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))

        // When
        waitlistService.promoteFromWaitlist(testSession.id, testSession, testGymClass)

        // Then - verify bookings were saved (promotion + reordering)
        verify(bookingRepository, atLeast(3)).save(any<ClassBooking>())
        // At least: 1 save for promotion + 2 saves for reordering
    }

    @Test
    fun `promoteFromWaitlist handles notification failure gracefully`() {
        // Given
        val waitlistedBooking = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = testMember.id,
            position = 1,
            subscriptionId = UUID.randomUUID()
        )

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(waitlistedBooking))
            .doReturn(emptyList()) // After promotion
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { it.arguments[0] }
        whenever(memberRepository.findById(testMember.id)).doReturn(Optional.of(testMember))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))

        // Notification fails
        doThrow(RuntimeException("Email service down"))
            .whenever(notificationService).sendWaitlistPromotion(any(), any(), any())

        // When/Then - should not throw exception
        assertDoesNotThrow {
            waitlistService.promoteFromWaitlist(testSession.id, testSession, testGymClass)
        }

        // Verify booking was still saved despite notification failure
        verify(bookingRepository, atLeastOnce()).save(any<ClassBooking>())
    }

    // ==================== reorderWaitlist Tests ====================

    @Test
    fun `reorderWaitlist updates positions correctly`() {
        // Given - 3 bookings with positions 1, 2, 3
        val booking1 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 1,
            subscriptionId = UUID.randomUUID()
        )
        val booking2 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 2,
            subscriptionId = UUID.randomUUID()
        )
        val booking3 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 3,
            subscriptionId = UUID.randomUUID()
        )

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(booking1, booking2, booking3))
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }

        // When
        waitlistService.reorderWaitlist(testSession.id)

        // Then
        verify(bookingRepository, times(3)).save(any<ClassBooking>())
        assertEquals(1, booking1.waitlistPosition)
        assertEquals(2, booking2.waitlistPosition)
        assertEquals(3, booking3.waitlistPosition)
    }

    @Test
    fun `reorderWaitlist does nothing when waitlist is empty`() {
        // Given
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(emptyList())

        // When
        waitlistService.reorderWaitlist(testSession.id)

        // Then
        verify(bookingRepository, never()).save(any<ClassBooking>())
    }

    @Test
    fun `reorderWaitlist renumbers after gap in positions`() {
        // Given - positions have gaps (e.g., 1, 3, 5 instead of 1, 2, 3)
        val booking1 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 1,
            subscriptionId = UUID.randomUUID()
        )
        booking1.setWaitlistPosition(1)

        val booking2 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 3,
            subscriptionId = UUID.randomUUID()
        )
        booking2.setWaitlistPosition(3)

        val booking3 = ClassBooking.createWaitlisted(
            sessionId = testSession.id,
            memberId = UUID.randomUUID(),
            position = 5,
            subscriptionId = UUID.randomUUID()
        )
        booking3.setWaitlistPosition(5)

        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id))
            .doReturn(listOf(booking1, booking2, booking3))
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { it.arguments[0] }

        // When
        waitlistService.reorderWaitlist(testSession.id)

        // Then - positions should be renumbered to 1, 2, 3
        assertEquals(1, booking1.waitlistPosition)
        assertEquals(2, booking2.waitlistPosition)
        assertEquals(3, booking3.waitlistPosition)
    }
}
