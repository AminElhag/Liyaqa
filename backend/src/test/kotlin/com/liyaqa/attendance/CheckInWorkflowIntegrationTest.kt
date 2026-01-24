package com.liyaqa.attendance

import com.liyaqa.attendance.application.commands.CheckInCommand
import com.liyaqa.attendance.application.commands.CheckOutCommand
import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.attendance.domain.model.AttendanceStatus
import com.liyaqa.attendance.domain.model.CheckInMethod
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
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Full integration test for the check-in workflow.
 * Tests the complete flow from member check-in to check-out with real database operations.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class CheckInWorkflowIntegrationTest {

    @Autowired
    private lateinit var attendanceService: AttendanceService

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

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testLocation: Location
    private lateinit var testMember: Member
    private lateinit var testPlan: MembershipPlan
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Create organization
        testOrganization = Organization(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Test Org", ar = "منظمة اختبار"),
            organizationType = OrganizationType.LLC,
            status = OrganizationStatus.ACTIVE
        )
        testOrganization = organizationRepository.save(testOrganization)

        // Create club (which serves as tenant)
        testClub = Club(
            id = UUID.randomUUID(),
            organizationId = testOrganization.id,
            name = LocalizedText(en = "Test Club", ar = "نادي اختبار"),
            status = ClubStatus.ACTIVE
        )
        testClub = clubRepository.save(testClub)
        testTenantId = testClub.id

        // Set tenant context
        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Create location
        testLocation = Location(
            id = UUID.randomUUID(),
            clubId = testClub.id,
            name = LocalizedText(en = "Main Location", ar = "الموقع الرئيسي"),
            status = LocationStatus.ACTIVE
        )
        testLocation.setTenantAndOrganization(testClub.id, testOrganization.id)
        testLocation = locationRepository.save(testLocation)

        // Create member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Create membership plan
        testPlan = MembershipPlan(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
            membershipFee = TaxableFee(amount = BigDecimal("299.00"), currency = "SAR", taxRate = BigDecimal("15.00")),
            billingPeriod = BillingPeriod.MONTHLY,
            freezeDaysAllowed = 7,
            isActive = true
        )
        setTenantId(testPlan, testTenantId)
        testPlan = membershipPlanRepository.save(testPlan)
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
            // Ignore for entities without tenantId
        }
    }

    private fun createActiveSubscription(
        memberId: UUID = testMember.id,
        classesRemaining: Int? = null
    ): Subscription {
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = memberId,
            planId = testPlan.id,
            status = SubscriptionStatus.ACTIVE,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30),
            classesRemaining = classesRemaining,
            freezeDaysRemaining = 7
        )
        setTenantId(subscription, testTenantId)
        return subscriptionRepository.save(subscription)
    }

    @Test
    fun `checkIn with active subscription creates attendance record`() {
        // Given
        createActiveSubscription()

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        // When
        val record = attendanceService.checkIn(command)

        // Then
        assertNotNull(record)
        assertEquals(testMember.id, record.memberId)
        assertEquals(testLocation.id, record.locationId)
        assertEquals(AttendanceStatus.CHECKED_IN, record.status)
        assertEquals(CheckInMethod.MANUAL, record.checkInMethod)
        assertNotNull(record.checkInTime)
    }

    @Test
    fun `checkIn without subscription throws exception`() {
        // Given - no subscription created

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        // When/Then
        val exception = assertFailsWith<IllegalStateException> {
            attendanceService.checkIn(command)
        }
        assertTrue(exception.message!!.contains("no active subscription"))
    }

    @Test
    fun `checkIn with expired subscription throws exception`() {
        // Given - expired subscription
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            status = SubscriptionStatus.ACTIVE,
            startDate = LocalDate.now().minusDays(60),
            endDate = LocalDate.now().minusDays(30), // Expired
            freezeDaysRemaining = 7
        )
        setTenantId(subscription, testTenantId)
        subscriptionRepository.save(subscription)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        // When/Then
        val exception = assertFailsWith<IllegalStateException> {
            attendanceService.checkIn(command)
        }
        assertTrue(exception.message!!.contains("no active subscription"))
    }

    @Test
    fun `checkIn deducts class from limited subscription`() {
        // Given - subscription with limited classes
        val subscription = createActiveSubscription(classesRemaining = 10)
        val initialClasses = subscription.classesRemaining!!

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.QR_CODE
        )

        // When
        attendanceService.checkIn(command)

        // Then
        val updatedSubscription = subscriptionRepository.findById(subscription.id).get()
        assertEquals(initialClasses - 1, updatedSubscription.classesRemaining)
    }

    @Test
    fun `checkIn with no classes remaining throws exception`() {
        // Given - subscription with no classes remaining
        createActiveSubscription(classesRemaining = 0)

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        // When/Then
        val exception = assertFailsWith<IllegalStateException> {
            attendanceService.checkIn(command)
        }
        assertTrue(exception.message!!.contains("No classes remaining"))
    }

    @Test
    fun `checkIn when already checked in throws exception`() {
        // Given
        createActiveSubscription()

        val command = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )

        // First check-in
        attendanceService.checkIn(command)

        // When/Then - Second check-in should fail
        val exception = assertFailsWith<IllegalStateException> {
            attendanceService.checkIn(command)
        }
        assertTrue(exception.message!!.contains("already checked in"))
    }

    @Test
    fun `checkOut updates attendance record`() {
        // Given
        createActiveSubscription()

        val checkInCommand = CheckInCommand(
            memberId = testMember.id,
            locationId = testLocation.id,
            checkInMethod = CheckInMethod.MANUAL
        )
        val checkInRecord = attendanceService.checkIn(checkInCommand)

        val checkOutCommand = CheckOutCommand(memberId = testMember.id)

        // When
        val record = attendanceService.checkOut(checkOutCommand)

        // Then
        assertEquals(checkInRecord.id, record.id)
        assertEquals(AttendanceStatus.CHECKED_OUT, record.status)
        assertNotNull(record.checkOutTime)
    }

    @Test
    fun `checkOut without active checkIn throws exception`() {
        // Given - no check-in

        val command = CheckOutCommand(memberId = testMember.id)

        // When/Then
        val exception = assertFailsWith<NoSuchElementException> {
            attendanceService.checkOut(command)
        }
        assertTrue(exception.message!!.contains("No active check-in found"))
    }

    @Test
    fun `unlimited subscription allows multiple checkIns without class deduction`() {
        // Given - unlimited subscription (classesRemaining = null)
        createActiveSubscription(classesRemaining = null)

        // Check in and out multiple times
        repeat(3) { i ->
            val checkInCommand = CheckInCommand(
                memberId = testMember.id,
                locationId = testLocation.id,
                checkInMethod = CheckInMethod.MANUAL,
                notes = "Visit $i"
            )
            attendanceService.checkIn(checkInCommand)
            attendanceService.checkOut(CheckOutCommand(memberId = testMember.id))
        }

        // Then - member can still check in
        val finalCheckIn = attendanceService.checkIn(
            CheckInCommand(
                memberId = testMember.id,
                locationId = testLocation.id,
                checkInMethod = CheckInMethod.MANUAL
            )
        )
        assertNotNull(finalCheckIn)
    }
}
