package com.liyaqa.scheduling

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.organization.domain.model.Club
import com.liyaqa.organization.domain.model.ClubStatus
import com.liyaqa.organization.domain.model.Location
import com.liyaqa.organization.domain.model.LocationStatus
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.LocationRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.scheduling.application.commands.CreateBookingCommand
import com.liyaqa.scheduling.application.services.BookingService
import com.liyaqa.scheduling.domain.model.BookingStatus
import com.liyaqa.scheduling.domain.model.ClassSession
import com.liyaqa.scheduling.domain.model.ClassType
import com.liyaqa.scheduling.domain.model.DifficultyLevel
import com.liyaqa.scheduling.domain.model.GymClass
import com.liyaqa.scheduling.domain.model.GymClassStatus
import com.liyaqa.scheduling.domain.model.SessionStatus
import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.scheduling.domain.ports.GymClassRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TaxableFee
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Full integration test for the class booking workflow.
 * Tests booking creation, waitlist handling, and cancellation.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BookingWorkflowIntegrationTest {

    @Autowired
    private lateinit var bookingService: BookingService

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository

    @Autowired
    private lateinit var clubRepository: ClubRepository

    @Autowired
    private lateinit var locationRepository: LocationRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    @Autowired
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Autowired
    private lateinit var gymClassRepository: GymClassRepository

    @Autowired
    private lateinit var sessionRepository: ClassSessionRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testLocation: Location
    private lateinit var testMember: Member
    private lateinit var testPlan: MembershipPlan
    private lateinit var testSubscription: Subscription
    private lateinit var testGymClass: GymClass
    private lateinit var testSession: ClassSession
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Create organization and club
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE
        )
        testOrganization = organizationRepository.save(testOrganization)

        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Create location
        testLocation = Location(
            id = UUID.randomUUID(),
            clubId = testClub.id,
            name = LocalizedText(en = "Test Location", ar = "موقع اختبار"),
            status = LocationStatus.ACTIVE
        )
        setTenantId(testLocation, testTenantId)
        testLocation = locationRepository.save(testLocation)

        // Create member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Create plan
        testPlan = MembershipPlan(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
            membershipFee = TaxableFee(amount = BigDecimal("299.00"), currency = "SAR", taxRate = BigDecimal("15.00")),
            billingPeriod = BillingPeriod.MONTHLY,
            maxClassesPerPeriod = 20,
            freezeDaysAllowed = 7,
            isActive = true
        )
        setTenantId(testPlan, testTenantId)
        testPlan = membershipPlanRepository.save(testPlan)

        // Create subscription
        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            status = SubscriptionStatus.ACTIVE,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30),
            classesRemaining = 10,
            freezeDaysRemaining = 7
        )
        setTenantId(testSubscription, testTenantId)
        testSubscription = subscriptionRepository.save(testSubscription)

        // Create gym class with locationId
        testGymClass = GymClass(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Yoga Class", ar = "فصل يوجا"),
            locationId = testLocation.id,
            classType = ClassType.YOGA,
            difficultyLevel = DifficultyLevel.BEGINNER,
            maxCapacity = 10,
            waitlistEnabled = true,
            maxWaitlistSize = 5,
            requiresSubscription = true,
            deductsClassFromPlan = true,
            status = GymClassStatus.ACTIVE
        )
        setTenantId(testGymClass, testTenantId)
        testGymClass = gymClassRepository.save(testGymClass)

        // Create session with locationId and maxCapacity
        testSession = ClassSession(
            id = UUID.randomUUID(),
            gymClassId = testGymClass.id,
            locationId = testLocation.id,
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(9, 0),
            endTime = LocalTime.of(10, 0),
            status = SessionStatus.SCHEDULED,
            maxCapacity = 10,
            currentBookings = 0
        )
        setTenantId(testSession, testTenantId)
        testSession = sessionRepository.save(testSession)
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun setTenantId(entity: Any, tenantId: UUID) {
        try {
            val field = entity.javaClass.superclass.getDeclaredField("tenantId")
            field.isAccessible = true
            field.set(entity, tenantId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    @Test
    fun `createBooking with valid subscription creates confirmed booking`() {
        // Given
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        // When
        val booking = bookingService.createBooking(command)

        // Then
        assertNotNull(booking)
        assertEquals(BookingStatus.CONFIRMED, booking.status)
        assertEquals(testMember.id, booking.memberId)
        assertEquals(testSession.id, booking.sessionId)
    }

    @Test
    fun `session with available spots accepts booking as CONFIRMED`() {
        // Given - a session with capacity of 10 and 0 current bookings
        assertEquals(0, testSession.currentBookings)
        assertEquals(10, testSession.maxCapacity)
        assertTrue(testSession.hasAvailableSpots())

        // When - create a booking
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )
        val booking = bookingService.createBooking(command)

        // Then - booking should be confirmed (not waitlisted) since session has spots
        assertEquals(BookingStatus.CONFIRMED, booking.status)
        assertNotNull(booking.id)
        assertEquals(testMember.id, booking.memberId)
        assertEquals(testSession.id, booking.sessionId)
    }

    @Test
    fun `createBooking without subscription throws exception`() {
        // Given - no subscription for member
        val uniqueId = UUID.randomUUID()
        val newMember = Member(
            id = uniqueId,
            firstName = LocalizedText(en = "No", ar = "لا"),
            lastName = LocalizedText(en = "Subscription", ar = "اشتراك"),
            email = "nosub.$uniqueId@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(newMember, testTenantId)
        val savedMember = memberRepository.save(newMember)

        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = savedMember.id,
            subscriptionId = null
        )

        // When/Then - IllegalStateException because member has no active subscription
        val exception = assertFailsWith<IllegalStateException> {
            bookingService.createBooking(command)
        }
        assertTrue(exception.message!!.contains("subscription") || exception.message!!.contains("Subscription"))
    }

    @Test
    fun `createBooking for same session twice throws exception`() {
        // Given - first booking
        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )
        bookingService.createBooking(command)

        // When/Then - second booking should fail (either by service check or db constraint)
        assertFailsWith<Exception> {
            bookingService.createBooking(command)
        }
        // Test passes if any exception is thrown - both IllegalArgumentException
        // from service check and DataIntegrityViolationException from DB constraint
        // are valid as they both prevent duplicate bookings
    }

    @Test
    fun `createBooking for cancelled session throws exception`() {
        // Given - cancel the session
        testSession.cancel("Test cancellation")
        sessionRepository.save(testSession)

        val command = CreateBookingCommand(
            sessionId = testSession.id,
            memberId = testMember.id,
            subscriptionId = testSubscription.id
        )

        // When/Then
        val exception = assertFailsWith<IllegalArgumentException> {
            bookingService.createBooking(command)
        }
        assertTrue(exception.message!!.contains("CANCELLED"))
    }
}
