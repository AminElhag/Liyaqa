package com.liyaqa.membership.infrastructure.persistence

import com.liyaqa.membership.domain.model.BillingPeriod
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration tests for SubscriptionRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SubscriptionRepositoryIntegrationTest {

    @Autowired
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var membershipPlanRepository: MembershipPlanRepository

    private lateinit var testTenantId: UUID
    private lateinit var testMember: Member
    private lateinit var testPlan: MembershipPlan

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))

        // Create test member
        testMember = Member(
            id = UUID.randomUUID(),
            firstName = "John",
            lastName = "Doe",
            email = "john.doe.${UUID.randomUUID()}@example.com",
            status = MemberStatus.ACTIVE
        )
        setTenantId(testMember, testTenantId)
        testMember = memberRepository.save(testMember)

        // Create test plan
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

    private fun createTestSubscription(
        member: Member = testMember,
        plan: MembershipPlan = testPlan,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        startDate: LocalDate = LocalDate.now(),
        endDate: LocalDate = LocalDate.now().plusDays(30)
    ): Subscription {
        val subscription = Subscription(
            id = UUID.randomUUID(),
            memberId = member.id,
            planId = plan.id,
            status = status,
            startDate = startDate,
            endDate = endDate,
            freezeDaysRemaining = 7
        )
        setTenantId(subscription, testTenantId)
        return subscription
    }

    @Test
    fun `save subscription persists to database`() {
        val subscription = createTestSubscription()
        val savedSubscription = subscriptionRepository.save(subscription)

        val foundSubscription = subscriptionRepository.findById(savedSubscription.id)
        assertTrue(foundSubscription.isPresent)
        assertEquals(subscription.memberId, foundSubscription.get().memberId)
        assertNotNull(foundSubscription.get().createdAt)
    }

    @Test
    fun `findById returns subscription when exists`() {
        val subscription = createTestSubscription()
        subscriptionRepository.save(subscription)

        val found = subscriptionRepository.findById(subscription.id)
        assertTrue(found.isPresent)
        assertEquals(subscription.planId, found.get().planId)
    }

    @Test
    fun `findById returns empty when not exists`() {
        val found = subscriptionRepository.findById(UUID.randomUUID())
        assertFalse(found.isPresent)
    }

    @Test
    fun `findActiveByMemberId returns active subscription`() {
        val subscription = createTestSubscription(status = SubscriptionStatus.ACTIVE)
        subscriptionRepository.save(subscription)

        val activeSubscription = subscriptionRepository.findActiveByMemberId(testMember.id)
        assertTrue(activeSubscription.isPresent)
        assertEquals(SubscriptionStatus.ACTIVE, activeSubscription.get().status)
    }

    @Test
    fun `findActiveByMemberId returns empty for expired subscription`() {
        val expiredSubscription = createTestSubscription(
            status = SubscriptionStatus.EXPIRED,
            startDate = LocalDate.now().minusDays(60),
            endDate = LocalDate.now().minusDays(30)
        )
        subscriptionRepository.save(expiredSubscription)

        val activeSubscription = subscriptionRepository.findActiveByMemberId(testMember.id)
        assertFalse(activeSubscription.isPresent)
    }

    @Test
    fun `findExpiringBefore returns subscriptions expiring before date`() {
        val expiringSubscription = createTestSubscription(
            endDate = LocalDate.now().plusDays(3)
        )
        subscriptionRepository.save(expiringSubscription)

        val expiringSoon = subscriptionRepository.findExpiringBefore(
            LocalDate.now().plusDays(7),
            PageRequest.of(0, 10)
        )
        assertTrue(expiringSoon.totalElements > 0)
    }
}
