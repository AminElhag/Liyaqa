package com.liyaqa.scheduling.application.services

import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.scheduling.application.commands.CancelBookingCommand
import com.liyaqa.scheduling.application.commands.CreateBookingCommand
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassBooking
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassBookingRepository
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.ClassPackRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.scheduling.domain.ports.MemberClassPackBalanceRepository
import com.liyaqa.shared.application.services.PermissionService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
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
class BookingServiceTest {

    @Mock
    private lateinit var bookingRepository: ClassBookingRepository

    @Mock
    private lateinit var sessionRepository: ClassSessionRepository

    @Mock
    private lateinit var gymClassRepository: GymClassRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var notificationService: NotificationService

    @Mock
    private lateinit var webhookPublisher: WebhookEventPublisher

    @Mock
    private lateinit var classPackRepository: ClassPackRepository

    @Mock
    private lateinit var balanceRepository: MemberClassPackBalanceRepository

    @Mock
    private lateinit var permissionService: PermissionService

    private lateinit var bookingService: BookingService

    private lateinit var testMember: Member
    private lateinit var testSubscription: Subscription
    private lateinit var testGymClass: GymClass
    private lateinit var testSession: ClassSession

    @BeforeEach
    fun setUp() {
        bookingService = BookingService(
            bookingRepository,
            sessionRepository,
            gymClassRepository,
            subscriptionRepository,
            memberRepository,
            notificationService,
            webhookPublisher,
            classPackRepository,
            balanceRepository,
            permissionService
        )

        // Create test member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )

        // Create test gym class
        testGymClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Yoga", ar = "يوغا"),
            description = LocalizedText(en = "Relaxing yoga class", ar = "حصة يوغا للاسترخاء"),
            locationId = UUID.randomUUID(),
            maxCapacity = 20,
            maxWaitlistSize = 5,
            status = GymClassStatus.ACTIVE,
            deductsClassFromPlan = true
        )

        // Create test session
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

        // Create test subscription with classes
        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 10
        )

        // Set up common mocks
        setupCommonMocks()
    }

    private fun setupCommonMocks() {
        // Session repository
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(testSession)
        whenever(sessionRepository.save(any<ClassSession>())) doReturn testSession

        // GymClass repository
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)

        // Subscription repository
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(testSubscription)
        whenever(subscriptionRepository.save(any<Subscription>())) doReturn testSubscription

        // Member repository
        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)

        // Booking repository
        whenever(bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(any(), any(), any())) doReturn false
        whenever(bookingRepository.countBySessionIdAndStatus(any(), any())) doReturn 0
        whenever(bookingRepository.save(any<ClassBooking>())) doReturn ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )
    }

    @Test
    fun `createBooking should create confirmed booking when session has space`() {
        // Given
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        // Configure save to return the saved booking
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }

        // When
        val result = bookingService.createBooking(command)

        // Then
        assertNotNull(result)
        assertEquals(BookingStatus.CONFIRMED, result.status)
        assertEquals(testSession.id, result.sessionId)
        assertEquals(testMember.id, result.memberId)
        assertEquals(testSubscription.id, result.subscriptionId)

        verify(bookingRepository).save(any<ClassBooking>())
        verify(sessionRepository).save(any<ClassSession>())
    }

    @Test
    fun `createBooking should create waitlisted booking when session is full`() {
        // Given - session is full
        val fullSession = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 20, // FULL
            status = SessionStatus.SCHEDULED
        )

        whenever(sessionRepository.findById(fullSession.id)) doReturn Optional.of(fullSession)

        val command = CreateBookingCommand(
            sessionId = fullSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        // Configure save to return waitlisted booking
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }

        // When
        val result = bookingService.createBooking(command)

        // Then
        assertNotNull(result)
        assertEquals(BookingStatus.WAITLISTED, result.status)
        assertEquals(1, result.waitlistPosition)

        verify(bookingRepository).save(any<ClassBooking>())
    }

    @Test
    fun `createBooking should fail when subscription is not active`() {
        // Given
        val expiredSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(3),
            endDate = LocalDate.now().minusMonths(1),
            status = SubscriptionStatus.EXPIRED,
            classesRemaining = 10
        )

        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = expiredSubscription.id
        )

        whenever(subscriptionRepository.findById(expiredSubscription.id)) doReturn Optional.of(expiredSubscription)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `createBooking should fail when subscription belongs to different member`() {
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

        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = otherMemberSubscription.id
        )

        whenever(subscriptionRepository.findById(otherMemberSubscription.id)) doReturn Optional.of(otherMemberSubscription)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `createBooking should fail when member already has booking for session`() {
        // Given
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        whenever(bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(
            testSession.id,
            testMember.id,
            listOf(BookingStatus.CONFIRMED, BookingStatus.WAITLISTED)
        )) doReturn true

        // When/Then - require() throws IllegalArgumentException
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `createBooking should fail when session is cancelled`() {
        // Given
        val cancelledSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 0,
            status = SessionStatus.CANCELLED
        )

        val command = CreateBookingCommand(
            sessionId = cancelledSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        whenever(sessionRepository.findById(cancelledSession.id)) doReturn Optional.of(cancelledSession)
        whenever(bookingRepository.existsBySessionIdAndMemberIdAndStatusIn(any(), any(), any())) doReturn false

        // When/Then - require() throws IllegalArgumentException
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `checkInBooking should deduct class from subscription`() {
        // Given
        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { invocation ->
            invocation.getArgument<Subscription>(0)
        }

        // When
        val result = bookingService.checkInBooking(booking.id)

        // Then
        assertEquals(BookingStatus.CHECKED_IN, result.status)
        assertEquals(true, result.classDeducted)
        verify(subscriptionRepository).save(any<Subscription>())
    }

    @Test
    fun `cancelBooking should cancel booking and decrement session count`() {
        // Given
        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        // Session with available spots (no waitlist to promote)
        val sessionWithBookings = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 5,
            status = SessionStatus.SCHEDULED
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(sessionWithBookings)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id)) doReturn emptyList()
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }

        // When
        val result = bookingService.cancelBooking(command)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)
        verify(bookingRepository).save(any<ClassBooking>())
        verify(sessionRepository).save(any<ClassSession>())
    }

    @Test
    fun `createBooking should fail when subscription has no classes remaining`() {
        // Given
        val noClassesSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 0
        )

        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = noClassesSubscription.id
        )

        whenever(subscriptionRepository.findById(noClassesSubscription.id)) doReturn Optional.of(noClassesSubscription)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `createBooking should fail when session not found`() {
        // Given
        val nonExistentSessionId = UUID.randomUUID()
        val command = CreateBookingCommand(
            sessionId = nonExistentSessionId,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        whenever(sessionRepository.findById(nonExistentSessionId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            bookingService.createBooking(command)
        }
    }

    @Test
    fun `createBooking should fail when subscription not found`() {
        // Given
        val nonExistentSubscriptionId = UUID.randomUUID()
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = nonExistentSubscriptionId
        )

        // GymClass requires subscription validation
        val gymClassRequiringSubscription = GymClass(
            id = testGymClass.id,
            name = LocalizedText(en = "Yoga", ar = "يوغا"),
            description = LocalizedText(en = "Relaxing yoga class", ar = "حصة يوغا للاسترخاء"),
            locationId = UUID.randomUUID(),
            maxCapacity = 20,
            maxWaitlistSize = 5,
            status = GymClassStatus.ACTIVE,
            deductsClassFromPlan = true,
            requiresSubscription = true
        )

        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(gymClassRequiringSubscription)
        whenever(subscriptionRepository.findById(nonExistentSubscriptionId)) doReturn Optional.empty()

        // When/Then - Service uses require() which throws IllegalArgumentException
        assertThrows(IllegalArgumentException::class.java) {
            bookingService.createBooking(command)
        }
    }

    // ==================== PHASE 1 AUTHORIZATION FIX TESTS ====================

    @Test
    fun `cancelBooking should succeed when user cancels their own booking`() {
        // Given
        val userId = UUID.randomUUID()
        val userMember = Member(
            id = UUID.randomUUID(),
            userId = userId,
            firstName = LocalizedText(en = "User", ar = "مستخدم"),
            lastName = LocalizedText(en = "One", ar = "واحد"),
            email = "user@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = userMember.id,
            subscriptionId = testSubscription.id
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        // Create session with current bookings
        val sessionWithBookings = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1, // Has 1 booking (the one being cancelled)
            status = SessionStatus.SCHEDULED
        )

        // Setup mocks
        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(memberRepository.findByUserId(userId)) doReturn Optional.of(userMember)
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(sessionWithBookings)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(userMember.id)) doReturn Optional.of(userMember)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id)) doReturn emptyList()
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }

        // When
        val result = bookingService.cancelBooking(command, userId)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)
        assertNotNull(result.cancelledAt)
        verify(bookingRepository).save(any<ClassBooking>())
    }

    @Test
    fun `cancelBooking should throw AccessDeniedException when user tries to cancel another users booking`() {
        // Given
        val user1Id = UUID.randomUUID()
        val user2Id = UUID.randomUUID()

        val user1Member = Member(
            id = UUID.randomUUID(),
            userId = user1Id,
            firstName = LocalizedText(en = "User", ar = "مستخدم"),
            lastName = LocalizedText(en = "One", ar = "واحد"),
            email = "user1@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        val user2Member = Member(
            id = UUID.randomUUID(),
            userId = user2Id,
            firstName = LocalizedText(en = "User", ar = "مستخدم"),
            lastName = LocalizedText(en = "Two", ar = "اثنان"),
            email = "user2@example.com",
            phone = "+966500000002",
            status = MemberStatus.ACTIVE
        )

        // Booking belongs to user1
        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = user1Member.id,
            subscriptionId = testSubscription.id
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        // Setup mocks - user2 trying to cancel user1's booking
        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(memberRepository.findByUserId(user2Id)) doReturn Optional.of(user2Member)
        whenever(permissionService.hasPermission(user2Id, "bookings_cancel_any")) doReturn false

        // When/Then
        val exception = assertThrows(org.springframework.security.access.AccessDeniedException::class.java) {
            bookingService.cancelBooking(command, user2Id)
        }

        assertEquals("You can only cancel your own bookings", exception.message)

        // Verify booking was NOT saved (cancelled)
        verify(bookingRepository, org.mockito.kotlin.never()).save(any<ClassBooking>())
    }

    @Test
    fun `cancelBooking should succeed when admin cancels any booking`() {
        // Given
        val adminUserId = UUID.randomUUID()
        val regularUserId = UUID.randomUUID()

        val regularMember = Member(
            id = UUID.randomUUID(),
            userId = regularUserId,
            firstName = LocalizedText(en = "Regular", ar = "عادي"),
            lastName = LocalizedText(en = "User", ar = "مستخدم"),
            email = "regular@example.com",
            phone = "+966500000003",
            status = MemberStatus.ACTIVE
        )

        // Booking belongs to regular user
        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = regularMember.id,
            subscriptionId = testSubscription.id
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        // Create session with current bookings
        val sessionWithBookings = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1, // Has 1 booking (the one being cancelled)
            status = SessionStatus.SCHEDULED
        )

        // Setup mocks - admin has special permission
        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(memberRepository.findByUserId(adminUserId)) doReturn Optional.empty() // Admin doesn't have a member account
        whenever(permissionService.hasPermission(adminUserId, "bookings_cancel_any")) doReturn true
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(sessionWithBookings)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(regularMember.id)) doReturn Optional.of(regularMember)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id)) doReturn emptyList()
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }

        // When
        val result = bookingService.cancelBooking(command, adminUserId)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)
        assertNotNull(result.cancelledAt)
        verify(bookingRepository).save(any<ClassBooking>())
        verify(permissionService).hasPermission(adminUserId, "bookings_cancel_any")
    }

    @Test
    fun `cancelBooking should succeed without authorization check when userId is null`() {
        // Given - Legacy behavior for backward compatibility
        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        // Create session with current bookings
        val sessionWithBookings = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1, // Has 1 booking (the one being cancelled)
            status = SessionStatus.SCHEDULED
        )

        // Setup mocks
        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(sessionWithBookings)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id)) doReturn emptyList()
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }

        // When - calling without userId (legacy/internal usage)
        val result = bookingService.cancelBooking(command, requestingUserId = null)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)
        verify(bookingRepository).save(any<ClassBooking>())
        // Verify permission service was NOT called (no authorization check)
        verify(permissionService, org.mockito.kotlin.never()).hasPermission(any(), any())
    }

    @org.junit.jupiter.api.Disabled("TODO: Fix subscription refund mocking - complex integration scenario")
    @Test
    fun `cancelBooking should refund classes when booking was confirmed and deducted`() {
        // Given
        val userId = UUID.randomUUID()
        val userMember = Member(
            id = UUID.randomUUID(),
            userId = userId,
            firstName = LocalizedText(en = "User", ar = "مستخدم"),
            lastName = LocalizedText(en = "One", ar = "واحد"),
            email = "user@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        val booking = ClassBooking.createConfirmed(
            sessionId = testSession.id,
            memberId = userMember.id,
            subscriptionId = testSubscription.id
        )
        booking.classDeducted = true

        val subscriptionWithDeductedClass = Subscription(
            id = testSubscription.id,
            memberId = userMember.id,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = LocalDate.now().plusMonths(2),
            status = SubscriptionStatus.ACTIVE,
            classesRemaining = 9 // 1 class was deducted
        )

        val command = CancelBookingCommand(bookingId = booking.id)

        // Create session with current bookings
        val sessionWithBookings = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 20,
            currentBookings = 1, // Has 1 booking (the one being cancelled)
            status = SessionStatus.SCHEDULED
        )

        // Setup mocks
        whenever(bookingRepository.findById(booking.id)) doReturn Optional.of(booking)
        whenever(memberRepository.findByUserId(userId)) doReturn Optional.of(userMember)
        whenever(sessionRepository.findById(testSession.id)) doReturn Optional.of(sessionWithBookings)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(userMember.id)) doReturn Optional.of(userMember)
        whenever(subscriptionRepository.findById(testSubscription.id)) doReturn Optional.of(subscriptionWithDeductedClass)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(testSession.id)) doReturn emptyList()
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { invocation ->
            invocation.getArgument<Subscription>(0)
        }

        // When
        val result = bookingService.cancelBooking(command, userId)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)

        // Verify subscription was updated (class refunded)
        verify(subscriptionRepository).save(any<Subscription>())
    }

    @org.junit.jupiter.api.Disabled("TODO: Fix waitlist promotion mocking - complex integration scenario")
    @Test
    fun `cancelBooking should promote waitlisted booking when spot becomes available`() {
        // Given
        val userId = UUID.randomUUID()
        val userMember = Member(
            id = UUID.randomUUID(),
            userId = userId,
            firstName = LocalizedText(en = "User", ar = "مستخدم"),
            lastName = LocalizedText(en = "One", ar = "واحد"),
            email = "user@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )

        val waitlistedMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "Waitlisted", ar = "قائمة انتظار"),
            lastName = LocalizedText(en = "User", ar = "مستخدم"),
            email = "waitlisted@example.com",
            phone = "+966500000002",
            status = MemberStatus.ACTIVE
        )

        // Full session
        val fullSession = ClassSession(
            id = testSession.id,
            gymClassId = testGymClass.id,
            locationId = testGymClass.locationId,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            maxCapacity = 1, // Capacity of 1
            currentBookings = 1, // Full
            status = SessionStatus.SCHEDULED
        )

        val confirmedBooking = ClassBooking.createConfirmed(
            sessionId = fullSession.id,
            memberId = userMember.id,
            subscriptionId = testSubscription.id
        )

        val waitlistedBooking = ClassBooking.createWaitlisted(
            sessionId = fullSession.id,
            memberId = waitlistedMember.id,
            subscriptionId = UUID.randomUUID(),
            position = 1
        )

        val command = CancelBookingCommand(bookingId = confirmedBooking.id)

        // Setup mocks
        whenever(bookingRepository.findById(confirmedBooking.id)) doReturn Optional.of(confirmedBooking)
        whenever(memberRepository.findByUserId(userId)) doReturn Optional.of(userMember)
        whenever(sessionRepository.findById(fullSession.id)) doReturn Optional.of(fullSession)
        whenever(gymClassRepository.findById(testGymClass.id)) doReturn Optional.of(testGymClass)
        whenever(memberRepository.findById(userMember.id)) doReturn Optional.of(userMember)
        whenever(memberRepository.findById(waitlistedMember.id)) doReturn Optional.of(waitlistedMember)
        whenever(bookingRepository.findWaitlistedBySessionIdOrderByPosition(fullSession.id)) doReturn listOf(waitlistedBooking)
        whenever(bookingRepository.save(any<ClassBooking>())).thenAnswer { invocation ->
            invocation.getArgument<ClassBooking>(0)
        }
        whenever(sessionRepository.save(any<ClassSession>())).thenAnswer { invocation ->
            invocation.getArgument<ClassSession>(0)
        }

        // When
        val result = bookingService.cancelBooking(command, userId)

        // Then
        assertEquals(BookingStatus.CANCELLED, result.status)

        // Verify waitlisted booking was promoted
        verify(bookingRepository, org.mockito.kotlin.times(2)).save(any<ClassBooking>())
        // First save: cancel original booking
        // Second save: promote waitlisted booking
    }
}
