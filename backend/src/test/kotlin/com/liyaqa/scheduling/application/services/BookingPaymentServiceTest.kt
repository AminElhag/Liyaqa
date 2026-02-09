package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.scheduling.domain.model.*
import com.liyaqa.scheduling.domain.ports.*
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.webhook.application.services.WebhookEventPublisher
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
class BookingPaymentServiceTest {

    @Mock private lateinit var sessionRepository: ClassSessionRepository
    @Mock private lateinit var gymClassRepository: GymClassRepository
    @Mock private lateinit var subscriptionRepository: SubscriptionRepository
    @Mock private lateinit var classPackRepository: ClassPackRepository
    @Mock private lateinit var balanceRepository: MemberClassPackBalanceRepository
    @Mock private lateinit var bookingRepository: ClassBookingRepository
    @Mock private lateinit var memberRepository: MemberRepository
    @Mock private lateinit var validationService: BookingValidationService
    @Mock private lateinit var notificationService: BookingNotificationService
    @Mock private lateinit var waitlistService: BookingWaitlistService
    @Mock private lateinit var webhookPublisher: WebhookEventPublisher

    private lateinit var paymentService: BookingPaymentService
    private lateinit var testSession: ClassSession
    private lateinit var testGymClass: GymClass
    private lateinit var testSubscription: Subscription

    @BeforeEach
    fun setUp() {
        paymentService = BookingPaymentService(
            sessionRepository, gymClassRepository, subscriptionRepository,
            classPackRepository, balanceRepository, bookingRepository,
            memberRepository, validationService, notificationService,
            waitlistService, webhookPublisher
        )

        testGymClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Yoga", ar = "يوغا"),
            description = LocalizedText(en = "Class", ar = "حصة"),
            locationId = UUID.randomUUID(),
            maxCapacity = 20,
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

        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = UUID.randomUUID(),
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
    }

    @Test
    fun `getBookingOptions returns canBook true when subscription is active`() {
        // Given
        val memberId = testSubscription.memberId
        whenever(sessionRepository.findById(testSession.id)).doReturn(Optional.of(testSession))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))
        whenever(bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(any(), any(), any())).doReturn(false)
        whenever(subscriptionRepository.findActiveByMemberId(memberId)).doReturn(Optional.of(testSubscription))
        whenever(balanceRepository.findActiveByMemberId(memberId)).doReturn(emptyList())

        // When
        val result = paymentService.getBookingOptions(testSession.id, memberId)

        // Then
        assertNotNull(result)
        assertEquals(testSession.id, result.sessionId)
        assertEquals(memberId, result.memberId)
    }

    @Test
    fun `getBookingOptions returns canBook false when session is cancelled`() {
        // Given
        val cancelledSession = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.CANCELLED
        )
        whenever(sessionRepository.findById(testSession.id)).doReturn(Optional.of(cancelledSession))
        whenever(gymClassRepository.findById(testGymClass.id)).doReturn(Optional.of(testGymClass))

        // When
        val result = paymentService.getBookingOptions(testSession.id, UUID.randomUUID())

        // Then
        assertFalse(result.canBook)
        assertTrue(result.reason?.contains("not available") == true)
    }

    @Test
    fun `isLateCancellation returns true when within deadline`() {
        // Given - session in 1 hour, deadline is 24 hours
        val soonSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now(),
            startTime = LocalTime.now().plusHours(1),
            endTime = LocalTime.now().plusHours(2),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.SCHEDULED
        )
        
        val gymClassWith24HourDeadline = GymClass(
            id = testGymClass.id,
            name = testGymClass.name,
            description = testGymClass.description,
            locationId = testGymClass.locationId,
            maxCapacity = testGymClass.maxCapacity,
            status = testGymClass.status,
            cancellationDeadlineHours = 24
        )

        // When
        val result = paymentService.isLateCancellation(soonSession, gymClassWith24HourDeadline)

        // Then
        assertTrue(result) // Within 24-hour deadline
    }

    @Test
    fun `isLateCancellation returns false when outside deadline`() {
        // Given - session in 5 days, deadline is 2 hours
        val futureSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(5),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.SCHEDULED
        )
        
        val gymClassWith2HourDeadline = GymClass(
            id = testGymClass.id,
            name = testGymClass.name,
            description = testGymClass.description,
            locationId = testGymClass.locationId,
            maxCapacity = testGymClass.maxCapacity,
            status = testGymClass.status,
            cancellationDeadlineHours = 2
        )

        // When
        val result = paymentService.isLateCancellation(futureSession, gymClassWith2HourDeadline)

        // Then
        assertFalse(result) // Outside 2-hour deadline
    }
}
