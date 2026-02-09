package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
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
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import java.time.LocalDate
import java.time.LocalTime
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingValidationServiceTest {

    @Mock
    private lateinit var bookingRepository: ClassBookingRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var gymClassRepository: GymClassRepository

    private lateinit var validationService: BookingValidationService
    private lateinit var testSession: ClassSession
    private lateinit var testGymClass: GymClass
    private lateinit var testSubscription: Subscription
    private lateinit var testMemberId: UUID

    @BeforeEach
    fun setUp() {
        validationService = BookingValidationService(
            bookingRepository,
            subscriptionRepository,
            gymClassRepository
        )

        testMemberId = UUID.randomUUID()

        testGymClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Yoga", ar = "يوغا"),
            description = LocalizedText(en = "Relaxing yoga class", ar = "حصة يوغا للاسترخاء"),
            locationId = UUID.randomUUID(),
            maxCapacity = 20,
            maxWaitlistSize = 5,
            status = GymClassStatus.ACTIVE,
            deductsClassFromPlan = true,
            requiresSubscription = true
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
            memberId = testMemberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )
    }

    // ==================== validateBookingEligibility Tests ====================

    @Test
    fun `validateBookingEligibility returns canBook true when valid`() {
        // Given
        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(any(), any()))
            .doReturn(emptyList())
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId))
            .doReturn(Optional.of(testSubscription))

        // When
        val result = validationService.validateBookingEligibility(
            testMemberId,
            testSession,
            testGymClass
        )

        // Then
        assertTrue(result.canBook)
        assertNull(result.reason)
        assertNotNull(result.validatedSubscription)
        assertEquals(testSubscription.id, result.validatedSubscription?.id)
        verify(bookingRepository).findActiveBookingsWithSessionsAndClasses(testMemberId, testSession.sessionDate)
    }

    @Test
    fun `validateBookingEligibility returns canBook false when overlap exists`() {
        // Given - existing booking from 10:00-11:00, new session 10:30-11:30 (overlaps)
        val existingSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = testSession.sessionDate,
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1,
            status = SessionStatus.SCHEDULED
        )

        val existingBooking = ClassBooking.createConfirmed(
            sessionId = existingSession.id,
            memberId = testMemberId,
            subscriptionId = testSubscription.id
        )

        val bookingsWithData: List<Array<Any>> = listOf(
            arrayOf(existingBooking, existingSession, testGymClass)
        )

        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(testMemberId, testSession.sessionDate))
            .doReturn(bookingsWithData)

        // New session overlaps: 10:30-11:30
        val newOverlappingSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = testSession.sessionDate,
            startTime = LocalTime.of(10, 30),
            endTime = LocalTime.of(11, 30),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.SCHEDULED
        )

        // When
        val result = validationService.validateBookingEligibility(
            testMemberId,
            newOverlappingSession,
            testGymClass
        )

        // Then
        assertFalse(result.canBook)
        assertNotNull(result.reason)
        assertTrue(result.reason?.contains("conflicts") == true)
        assertNull(result.validatedSubscription)
    }

    @Test
    fun `validateBookingEligibility returns canBook false when no active subscription`() {
        // Given
        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(any(), any()))
            .doReturn(emptyList())
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId))
            .doReturn(Optional.empty())

        // When
        val result = validationService.validateBookingEligibility(
            testMemberId,
            testSession,
            testGymClass
        )

        // Then
        assertFalse(result.canBook)
        assertNotNull(result.reason)
        assertTrue(result.reason?.contains("does not have an active subscription") == true)
        assertNull(result.validatedSubscription)
    }

    @Test
    fun `validateBookingEligibility returns canBook false when no classes remaining`() {
        // Given
        val noClassesSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0
        )

        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(any(), any()))
            .doReturn(emptyList())
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId))
            .doReturn(Optional.of(noClassesSubscription))

        // When
        val result = validationService.validateBookingEligibility(
            testMemberId,
            testSession,
            testGymClass
        )

        // Then
        assertFalse(result.canBook)
        assertNotNull(result.reason)
        assertTrue(result.reason?.contains("No classes remaining") == true)
        assertNull(result.validatedSubscription)
    }

    @Test
    fun `validateBookingEligibility returns canBook true when subscription not required`() {
        // Given - gym class doesn't require subscription
        val noSubscriptionClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Open Gym", ar = "صالة مفتوحة"),
            description = LocalizedText(en = "Open gym access", ar = "دخول صالة مفتوح"),
            locationId = UUID.randomUUID(),
            maxCapacity = 50,
            maxWaitlistSize = 10,
            status = GymClassStatus.ACTIVE,
            deductsClassFromPlan = false,
            requiresSubscription = false
        )

        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(any(), any()))
            .doReturn(emptyList())

        // When
        val result = validationService.validateBookingEligibility(
            testMemberId,
            testSession,
            noSubscriptionClass
        )

        // Then
        assertTrue(result.canBook)
        assertNull(result.reason)
        assertNull(result.validatedSubscription) // No subscription validated
    }

    // ==================== validateNoOverlappingBookings Tests ====================

    @Test
    fun `validateNoOverlappingBookings succeeds when no bookings exist`() {
        // Given
        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(testMemberId, testSession.sessionDate))
            .doReturn(emptyList())

        // When/Then - should not throw
        assertDoesNotThrow {
            validationService.validateNoOverlappingBookings(testMemberId, testSession)
        }
    }

    @Test
    fun `validateNoOverlappingBookings succeeds when bookings don't overlap`() {
        // Given - existing booking 08:00-09:00, new booking 10:00-11:00 (no overlap)
        val morningSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = testSession.sessionDate,
            startTime = LocalTime.of(8, 0),
            endTime = LocalTime.of(9, 0),
            maxCapacity = 20,
            currentBookings = 1,
            status = SessionStatus.SCHEDULED
        )

        val morningBooking = ClassBooking.createConfirmed(
            sessionId = morningSession.id,
            memberId = testMemberId,
            subscriptionId = testSubscription.id
        )

        val bookingsWithData: List<Array<Any>> = listOf(
            arrayOf(morningBooking, morningSession, testGymClass)
        )

        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(testMemberId, testSession.sessionDate))
            .doReturn(bookingsWithData)

        // When/Then - should not throw (10:00-11:00 doesn't overlap with 08:00-09:00)
        assertDoesNotThrow {
            validationService.validateNoOverlappingBookings(testMemberId, testSession)
        }
    }

    @Test
    fun `validateNoOverlappingBookings throws when overlap exists`() {
        // Given - existing booking 10:00-11:00, new booking 10:30-11:30 (overlaps)
        val existingSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = testSession.sessionDate,
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1,
            status = SessionStatus.SCHEDULED
        )

        val existingBooking = ClassBooking.createConfirmed(
            sessionId = existingSession.id,
            memberId = testMemberId,
            subscriptionId = testSubscription.id
        )

        val bookingsWithData: List<Array<Any>> = listOf(
            arrayOf(existingBooking, existingSession, testGymClass)
        )

        whenever(bookingRepository.findActiveBookingsWithSessionsAndClasses(testMemberId, testSession.sessionDate))
            .doReturn(bookingsWithData)

        val overlappingSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = testSession.sessionDate,
            startTime = LocalTime.of(10, 30),
            endTime = LocalTime.of(11, 30),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.SCHEDULED
        )

        // When/Then
        val exception = assertThrows(IllegalArgumentException::class.java) {
            validationService.validateNoOverlappingBookings(testMemberId, overlappingSession)
        }

        assertTrue(exception.message?.contains("conflicts") == true)
        assertTrue(exception.message?.contains("Yoga") == true)
    }

    // ==================== validateSubscriptionForBooking Tests ====================

    @Test
    fun `validateSubscriptionForBooking returns subscription when valid`() {
        // Given
        whenever(subscriptionRepository.findById(testSubscription.id))
            .doReturn(Optional.of(testSubscription))

        // When
        val result = validationService.validateSubscriptionForBooking(
            testMemberId,
            testSubscription.id,
            requiresClassAvailability = true
        )

        // Then
        assertNotNull(result)
        assertEquals(testSubscription.id, result.id)
        assertEquals(testMemberId, result.memberId)
        verify(subscriptionRepository).findById(testSubscription.id)
    }

    @Test
    fun `validateSubscriptionForBooking finds active subscription when subscriptionId is null`() {
        // Given
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId))
            .doReturn(Optional.of(testSubscription))

        // When
        val result = validationService.validateSubscriptionForBooking(
            testMemberId,
            subscriptionId = null,
            requiresClassAvailability = true
        )

        // Then
        assertNotNull(result)
        assertEquals(testSubscription.id, result.id)
        verify(subscriptionRepository).findActiveByMemberId(testMemberId)
    }

    @Test
    fun `validateSubscriptionForBooking throws when subscription not found`() {
        // Given
        val nonExistentId = UUID.randomUUID()
        whenever(subscriptionRepository.findById(nonExistentId))
            .doReturn(Optional.empty())

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            validationService.validateSubscriptionForBooking(
                testMemberId,
                nonExistentId,
                requiresClassAvailability = false
            )
        }
    }

    @Test
    fun `validateSubscriptionForBooking throws when subscription belongs to different member`() {
        // Given
        val otherMemberSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = UUID.randomUUID(), // Different member
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )

        whenever(subscriptionRepository.findById(otherMemberSubscription.id))
            .doReturn(Optional.of(otherMemberSubscription))

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            validationService.validateSubscriptionForBooking(
                testMemberId,
                otherMemberSubscription.id,
                requiresClassAvailability = false
            )
        }
    }

    @Test
    fun `validateSubscriptionForBooking throws when subscription is not active`() {
        // Given
        val expiredSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(3),
            endDate = LocalDate.now().minusMonths(1),
            status = SubscriptionStatus.EXPIRED,
            classesRemaining = 10
        )

        whenever(subscriptionRepository.findById(expiredSubscription.id))
            .doReturn(Optional.of(expiredSubscription))

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            validationService.validateSubscriptionForBooking(
                testMemberId,
                expiredSubscription.id,
                requiresClassAvailability = false
            )
        }
    }

    @Test
    fun `validateSubscriptionForBooking throws when no classes remaining`() {
        // Given
        val noClassesSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0
        )

        whenever(subscriptionRepository.findById(noClassesSubscription.id))
            .doReturn(Optional.of(noClassesSubscription))

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            validationService.validateSubscriptionForBooking(
                testMemberId,
                noClassesSubscription.id,
                requiresClassAvailability = true
            )
        }
    }

    @Test
    fun `validateSubscriptionForBooking succeeds when no classes remaining but class doesn't deduct`() {
        // Given - subscription has 0 classes but class doesn't require deduction
        val noClassesSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMemberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0
        )

        whenever(subscriptionRepository.findById(noClassesSubscription.id))
            .doReturn(Optional.of(noClassesSubscription))

        // When - requiresClassAvailability = false
        val result = validationService.validateSubscriptionForBooking(
            testMemberId,
            noClassesSubscription.id,
            requiresClassAvailability = false
        )

        // Then - should succeed
        assertNotNull(result)
        assertEquals(noClassesSubscription.id, result.id)
    }

    @Test
    fun `validateSubscriptionForBooking throws when no active subscription found`() {
        // Given
        whenever(subscriptionRepository.findActiveByMemberId(testMemberId))
            .doReturn(Optional.empty())

        // When/Then
        assertThrows(IllegalStateException::class.java) {
            validationService.validateSubscriptionForBooking(
                testMemberId,
                subscriptionId = null,
                requiresClassAvailability = false
            )
        }
    }
}
