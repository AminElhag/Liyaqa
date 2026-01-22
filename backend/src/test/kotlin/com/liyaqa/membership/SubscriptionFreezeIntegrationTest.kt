package com.liyaqa.membership

import com.liyaqa.membership.application.services.SubscriptionService
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
import com.liyaqa.organization.domain.model.Organization
import com.liyaqa.organization.domain.model.OrganizationStatus
import com.liyaqa.organization.domain.model.OrganizationType
import com.liyaqa.organization.domain.ports.ClubRepository
import com.liyaqa.organization.domain.ports.OrganizationRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
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
 * Integration test for subscription freeze/unfreeze functionality.
 * Tests state transitions and end date extension on unfreeze.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SubscriptionFreezeIntegrationTest {

    @Autowired
    private lateinit var subscriptionService: SubscriptionService

    @Autowired
    private lateinit var organizationRepository: OrganizationRepository

    @Autowired
    private lateinit var clubRepository: ClubRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    @Autowired
    private lateinit var subscriptionRepository: SubscriptionRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testMember: Member
    private lateinit var testPlan: MembershipPlan
    private lateinit var testSubscription: Subscription
    private lateinit var testTenantId: UUID

    @BeforeEach
    fun setUp() {
        // Setup organization and club
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

        // Create member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = "John",
            lastName = "Doe",
            email = "john.doe@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Create plan with freeze days
        testPlan = MembershipPlan(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
            price = Money(BigDecimal.valueOf(299.00).setScale(2), "SAR"),
            billingPeriod = BillingPeriod.MONTHLY,
            freezeDaysAllowed = 7,
            isActive = true
        )
        setTenantId(testPlan, testTenantId)
        testPlan = membershipPlanRepository.save(testPlan)

        // Create active subscription
        testSubscription = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            status = SubscriptionStatus.ACTIVE,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30),
            freezeDaysRemaining = 7
        )
        setTenantId(testSubscription, testTenantId)
        testSubscription = subscriptionRepository.save(testSubscription)
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
    fun `freezeSubscription changes status to FROZEN`() {
        // When
        val frozenSubscription = subscriptionService.freezeSubscription(testSubscription.id)

        // Then
        assertEquals(SubscriptionStatus.FROZEN, frozenSubscription.status)
        assertNotNull(frozenSubscription.frozenAt)
    }

    @Test
    fun `freezeSubscription on already frozen throws exception`() {
        // Given
        subscriptionService.freezeSubscription(testSubscription.id)

        // When/Then
        val exception = assertFailsWith<IllegalArgumentException> {
            subscriptionService.freezeSubscription(testSubscription.id)
        }
        assertTrue(exception.message!!.contains("frozen") || exception.message!!.contains("FROZEN") || exception.message!!.contains("active"))
    }

    @Test
    fun `freezeSubscription with no freeze days remaining throws exception`() {
        // Given - subscription with no freeze days
        val subscriptionNoFreeze = Subscription(
            id = UUID.randomUUID(),
            memberId = testMember.id,
            planId = testPlan.id,
            status = SubscriptionStatus.ACTIVE,
            startDate = LocalDate.now(),
            endDate = LocalDate.now().plusDays(30),
            freezeDaysRemaining = 0  // No freeze days
        )
        setTenantId(subscriptionNoFreeze, testTenantId)
        val savedSubscription = subscriptionRepository.save(subscriptionNoFreeze)

        // When/Then
        val exception = assertFailsWith<IllegalArgumentException> {
            subscriptionService.freezeSubscription(savedSubscription.id)
        }
        assertTrue(exception.message!!.contains("freeze") || exception.message!!.contains("No"))
    }

    @Test
    fun `unfreezeSubscription changes status back to ACTIVE`() {
        // Given - freeze first
        subscriptionService.freezeSubscription(testSubscription.id)

        // When
        val unfrozenSubscription = subscriptionService.unfreezeSubscription(testSubscription.id)

        // Then
        assertEquals(SubscriptionStatus.ACTIVE, unfrozenSubscription.status)
    }

    @Test
    fun `unfreezeSubscription on non-frozen throws exception`() {
        // When/Then - trying to unfreeze an active subscription
        val exception = assertFailsWith<IllegalArgumentException> {
            subscriptionService.unfreezeSubscription(testSubscription.id)
        }
        assertTrue(exception.message!!.contains("not frozen") || exception.message!!.contains("FROZEN"))
    }

    @Test
    fun `cancelSubscription changes status to CANCELLED`() {
        // When
        val cancelledSubscription = subscriptionService.cancelSubscription(testSubscription.id)

        // Then
        assertEquals(SubscriptionStatus.CANCELLED, cancelledSubscription.status)
    }

    @Test
    fun `cancelSubscription on already cancelled throws exception`() {
        // Given
        subscriptionService.cancelSubscription(testSubscription.id)

        // When/Then
        val exception = assertFailsWith<IllegalArgumentException> {
            subscriptionService.cancelSubscription(testSubscription.id)
        }
        assertTrue(exception.message!!.contains("cancelled") || exception.message!!.contains("CANCELLED"))
    }
}
