package com.liyaqa.shared.api

import com.liyaqa.config.TestContainersConfiguration
import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceLineItem
import com.liyaqa.billing.domain.model.LineItemType
import com.liyaqa.billing.domain.ports.InvoiceRepository
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
import com.liyaqa.shared.domain.TaxableFee
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

/**
 * Integration test for Dashboard data.
 * Tests summary metrics and aggregated data using repository methods.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestContainersConfiguration::class)
@Transactional
class DashboardSummaryIntegrationTest {

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

    @Autowired
    private lateinit var invoiceRepository: InvoiceRepository

    private lateinit var testOrganization: Organization
    private lateinit var testClub: Club
    private lateinit var testTenantId: UUID
    private lateinit var testPlan: MembershipPlan

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

        // Create test data
        createTestData()
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

    private fun setTenantIdAndOrgId(entity: Any, tenantId: UUID, organizationId: UUID) {
        try {
            val superclass = entity.javaClass.superclass
            val tenantField = superclass.getDeclaredField("tenantId")
            tenantField.isAccessible = true
            tenantField.set(entity, tenantId)

            val orgField = superclass.getDeclaredField("organizationId")
            orgField.isAccessible = true
            orgField.set(entity, organizationId)
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun createTestData() {
        // Create membership plan
        testPlan = MembershipPlan(
            id = UUID.randomUUID(),
            name = LocalizedText(en = "Monthly Plan", ar = "خطة شهرية"),
            membershipFee = TaxableFee(amount = BigDecimal("299.00"), currency = "SAR", taxRate = BigDecimal("15.00")),
            billingPeriod = BillingPeriod.MONTHLY,
            isActive = true
        )
        setTenantId(testPlan, testTenantId)
        membershipPlanRepository.save(testPlan)

        // Create members with subscriptions
        repeat(5) { i ->
            val member = Member(
                id = UUID.randomUUID(),
                firstName = LocalizedText(en = "Member$i", ar = "عضو$i"),
                lastName = LocalizedText(en = "Test", ar = "اختبار"),
                email = "member$i.${UUID.randomUUID()}@example.com",
                status = MemberStatus.ACTIVE
            )
            setTenantId(member, testTenantId)
            val savedMember = memberRepository.save(member)

            val subscription = Subscription(
                id = UUID.randomUUID(),
                memberId = savedMember.id,
                planId = testPlan.id,
                status = SubscriptionStatus.ACTIVE,
                startDate = LocalDate.now(),
                endDate = LocalDate.now().plusDays(30),
                freezeDaysRemaining = 7
            )
            setTenantId(subscription, testTenantId)
            subscriptionRepository.save(subscription)
        }

        // Create pending invoices
        val members = memberRepository.findAll(Pageable.unpaged()).content
        repeat(3) { i ->
            val member = members[i]
            val lineItems = listOf(
                InvoiceLineItem(
                    description = LocalizedText(en = "Monthly Membership", ar = "اشتراك شهري"),
                    quantity = 1,
                    unitPrice = Money(BigDecimal.valueOf(100.00).setScale(2), "SAR"),
                    itemType = LineItemType.SUBSCRIPTION,
                    sortOrder = 0
                )
            )
            val invoice = Invoice.create(
                invoiceNumber = "INV-DASH-${UUID.randomUUID().toString().take(8)}",
                memberId = member.id,
                lineItems = lineItems
            )
            setTenantIdAndOrgId(invoice, testTenantId, testOrganization.id)
            invoiceRepository.save(invoice)

            // Issue the invoice
            invoice.issue()
            invoiceRepository.save(invoice)
        }
    }

    @Test
    fun `test data created successfully - correct member count`() {
        // Verify test data was created
        val members = memberRepository.findAll(Pageable.unpaged())
        assertEquals(5, members.totalElements)
    }

    @Test
    fun `test data created successfully - correct active subscription count`() {
        val subscriptions = subscriptionRepository.findByStatus(
            SubscriptionStatus.ACTIVE,
            PageRequest.of(0, 100)
        )
        assertEquals(5, subscriptions.totalElements)
    }

    @Test
    fun `all members have active status`() {
        val members = memberRepository.findAll(Pageable.unpaged()).content
        assertTrue(members.all { it.status == MemberStatus.ACTIVE })
    }

    @Test
    fun `subscriptions are associated with correct members`() {
        val members = memberRepository.findAll(Pageable.unpaged()).content

        for (member in members) {
            val subscription = subscriptionRepository.findActiveByMemberId(member.id)
            assertTrue(subscription.isPresent, "Member ${member.id} should have an active subscription")
            assertEquals(member.id, subscription.get().memberId)
        }
    }

    @Test
    fun `invoices are created for members`() {
        val invoices = invoiceRepository.findAll(PageRequest.of(0, 100))
        assertEquals(3, invoices.totalElements)
    }

    @Test
    fun `membership plan exists and is active`() {
        val plan = membershipPlanRepository.findById(testPlan.id)
        assertTrue(plan.isPresent)
        assertTrue(plan.get().isActive)
        assertEquals("Monthly Plan", plan.get().name.en)
    }

    @Test
    fun `subscriptions have correct end date`() {
        val subscriptions = subscriptionRepository.findByStatus(
            SubscriptionStatus.ACTIVE,
            PageRequest.of(0, 100)
        ).content

        for (subscription in subscriptions) {
            assertEquals(LocalDate.now().plusDays(30), subscription.endDate)
        }
    }

    @Test
    fun `can find expiring subscriptions`() {
        val expiringSubscriptions = subscriptionRepository.findExpiringBefore(
            LocalDate.now().plusDays(60),
            PageRequest.of(0, 100)
        )

        // All subscriptions expire in 30 days, so they should all be returned
        assertEquals(5, expiringSubscriptions.totalElements)
    }

    @Test
    fun `dashboard metrics can be computed from repositories`() {
        // Simulate what the dashboard endpoint would do
        val totalMembers = memberRepository.findAll(Pageable.unpaged()).totalElements
        val activeSubscriptions = subscriptionRepository.findByStatus(
            SubscriptionStatus.ACTIVE,
            PageRequest.of(0, 1)
        ).totalElements
        val pendingInvoices = invoiceRepository.findAll(PageRequest.of(0, 100)).totalElements

        // Verify metrics
        assertEquals(5L, totalMembers)
        assertEquals(5L, activeSubscriptions)
        assertEquals(3L, pendingInvoices)
    }
}
