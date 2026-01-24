package com.liyaqa.shared

import com.liyaqa.attendance.application.services.AttendanceService
import com.liyaqa.auth.application.services.AuthService
import com.liyaqa.billing.application.services.InvoiceService
import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.domain.model.MembershipPlan
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.platform.application.services.ClientInvoiceService
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.shared.infrastructure.jobs.ScheduledJobs
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.UUID

/**
 * Unit tests for ScheduledJobs.
 * Tests subscription expiration, invoice overdue marking, auto-checkout, and token cleanup.
 */
@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ScheduledJobsTest {

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var invoiceService: InvoiceService

    @Mock
    private lateinit var attendanceService: AttendanceService

    @Mock
    private lateinit var authService: AuthService

    @Mock
    private lateinit var clientInvoiceService: ClientInvoiceService

    @Mock
    private lateinit var membershipPlanService: MembershipPlanService

    private lateinit var scheduledJobs: ScheduledJobs

    private val testMemberId = UUID.randomUUID()
    private val testPlanId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        scheduledJobs = ScheduledJobs(
            subscriptionRepository,
            invoiceService,
            attendanceService,
            authService,
            clientInvoiceService,
            membershipPlanService
        )
    }

    // ========== Expire Subscriptions Tests ==========

    @Test
    fun `expireSubscriptions should expire active subscriptions past end date`() {
        // Given - active subscription that ended yesterday
        val expiredSubscription = createTestSubscription(
            status = SubscriptionStatus.ACTIVE,
            endDate = LocalDate.now().minusDays(1)
        )
        val subscriptionPage = PageImpl(listOf(expiredSubscription))

        whenever(subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE, Pageable.unpaged()))
            .doReturn(subscriptionPage)
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        scheduledJobs.expireSubscriptions()

        // Then
        verify(subscriptionRepository).save(any<Subscription>())
        assertEquals(SubscriptionStatus.EXPIRED, expiredSubscription.status)
    }

    @Test
    fun `expireSubscriptions should not expire active subscriptions not yet expired`() {
        // Given - active subscription that ends in the future
        val activeSubscription = createTestSubscription(
            status = SubscriptionStatus.ACTIVE,
            endDate = LocalDate.now().plusDays(30)
        )
        val subscriptionPage = PageImpl(listOf(activeSubscription))

        whenever(subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE, Pageable.unpaged()))
            .doReturn(subscriptionPage)

        // When
        scheduledJobs.expireSubscriptions()

        // Then - subscription should not be saved (no state change)
        verify(subscriptionRepository, never()).save(any<Subscription>())
        assertEquals(SubscriptionStatus.ACTIVE, activeSubscription.status)
    }

    @Test
    fun `expireSubscriptions should not affect already expired subscriptions`() {
        // Given - only active subscriptions are queried
        val subscriptionPage = PageImpl<Subscription>(emptyList())

        whenever(subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE, Pageable.unpaged()))
            .doReturn(subscriptionPage)

        // When
        scheduledJobs.expireSubscriptions()

        // Then - no subscriptions should be saved
        verify(subscriptionRepository, never()).save(any<Subscription>())
    }

    @Test
    fun `expireSubscriptions should handle multiple subscriptions correctly`() {
        // Given - mix of expired and non-expired subscriptions
        val expiredSub1 = createTestSubscription(
            status = SubscriptionStatus.ACTIVE,
            endDate = LocalDate.now().minusDays(5)
        )
        val activeSub = createTestSubscription(
            status = SubscriptionStatus.ACTIVE,
            endDate = LocalDate.now().plusDays(10)
        )
        val expiredSub2 = createTestSubscription(
            status = SubscriptionStatus.ACTIVE,
            endDate = LocalDate.now().minusDays(1)
        )
        val subscriptionPage = PageImpl(listOf(expiredSub1, activeSub, expiredSub2))

        whenever(subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE, Pageable.unpaged()))
            .doReturn(subscriptionPage)
        whenever(subscriptionRepository.save(any<Subscription>())).thenAnswer { it.getArgument(0) }

        // When
        scheduledJobs.expireSubscriptions()

        // Then - only 2 expired subscriptions should be saved
        verify(subscriptionRepository, times(2)).save(any<Subscription>())
        assertEquals(SubscriptionStatus.EXPIRED, expiredSub1.status)
        assertEquals(SubscriptionStatus.ACTIVE, activeSub.status)
        assertEquals(SubscriptionStatus.EXPIRED, expiredSub2.status)
    }

    // ========== Expire Membership Plans Tests ==========

    @Test
    fun `expireMembershipPlans should call membershipPlanService deactivateExpiredPlans`() {
        // Given
        val expiredPlan = createTestMembershipPlan()
        whenever(membershipPlanService.deactivateExpiredPlans()) doReturn listOf(expiredPlan)

        // When
        scheduledJobs.expireMembershipPlans()

        // Then
        verify(membershipPlanService).deactivateExpiredPlans()
    }

    @Test
    fun `expireMembershipPlans should handle zero expired plans`() {
        // Given
        whenever(membershipPlanService.deactivateExpiredPlans()) doReturn emptyList()

        // When
        scheduledJobs.expireMembershipPlans()

        // Then
        verify(membershipPlanService).deactivateExpiredPlans()
    }

    @Test
    fun `expireMembershipPlans should handle multiple expired plans`() {
        // Given
        val expiredPlan1 = createTestMembershipPlan()
        val expiredPlan2 = createTestMembershipPlan()
        whenever(membershipPlanService.deactivateExpiredPlans()) doReturn listOf(expiredPlan1, expiredPlan2)

        // When
        scheduledJobs.expireMembershipPlans()

        // Then
        verify(membershipPlanService).deactivateExpiredPlans()
    }

    // ========== Mark Overdue Invoices Tests ==========

    @Test
    fun `markOverdueInvoices should call invoiceService markOverdueInvoices`() {
        // Given
        whenever(invoiceService.markOverdueInvoices()) doReturn 5

        // When
        scheduledJobs.markOverdueInvoices()

        // Then
        verify(invoiceService).markOverdueInvoices()
    }

    @Test
    fun `markOverdueInvoices should handle zero overdue invoices`() {
        // Given
        whenever(invoiceService.markOverdueInvoices()) doReturn 0

        // When
        scheduledJobs.markOverdueInvoices()

        // Then
        verify(invoiceService).markOverdueInvoices()
    }

    // ========== Auto Checkout Tests ==========

    @Test
    fun `autoCheckoutMembers should call attendanceService autoCheckoutPreviousDayMembers`() {
        // Given
        whenever(attendanceService.autoCheckoutPreviousDayMembers()) doReturn 10

        // When
        scheduledJobs.autoCheckoutMembers()

        // Then
        verify(attendanceService).autoCheckoutPreviousDayMembers()
    }

    @Test
    fun `autoCheckoutMembers should handle zero members to checkout`() {
        // Given
        whenever(attendanceService.autoCheckoutPreviousDayMembers()) doReturn 0

        // When
        scheduledJobs.autoCheckoutMembers()

        // Then
        verify(attendanceService).autoCheckoutPreviousDayMembers()
    }

    // ========== Cleanup Expired Tokens Tests ==========

    @Test
    fun `cleanupExpiredTokens should call authService cleanupExpiredResetTokens`() {
        // Given - nothing to mock, just verify the call

        // When
        scheduledJobs.cleanupExpiredTokens()

        // Then
        verify(authService).cleanupExpiredResetTokens()
    }

    // ========== Generate Monthly Client Invoices Tests ==========

    @Test
    fun `generateMonthlyClientInvoices should call clientInvoiceService generateMonthlyInvoices`() {
        // Given
        whenever(clientInvoiceService.generateMonthlyInvoices()) doReturn 3

        // When
        scheduledJobs.generateMonthlyClientInvoices()

        // Then
        verify(clientInvoiceService).generateMonthlyInvoices()
    }

    @Test
    fun `generateMonthlyClientInvoices should handle zero invoices generated`() {
        // Given
        whenever(clientInvoiceService.generateMonthlyInvoices()) doReturn 0

        // When
        scheduledJobs.generateMonthlyClientInvoices()

        // Then
        verify(clientInvoiceService).generateMonthlyInvoices()
    }

    // ========== Mark Overdue Client Invoices Tests ==========

    @Test
    fun `markOverdueClientInvoices should call clientInvoiceService markOverdueInvoices`() {
        // Given
        whenever(clientInvoiceService.markOverdueInvoices()) doReturn 2

        // When
        scheduledJobs.markOverdueClientInvoices()

        // Then
        verify(clientInvoiceService).markOverdueInvoices()
    }

    @Test
    fun `markOverdueClientInvoices should handle zero overdue invoices`() {
        // Given
        whenever(clientInvoiceService.markOverdueInvoices()) doReturn 0

        // When
        scheduledJobs.markOverdueClientInvoices()

        // Then
        verify(clientInvoiceService).markOverdueInvoices()
    }

    // ========== Helper Methods ==========

    private fun createTestSubscription(
        id: UUID = UUID.randomUUID(),
        memberId: UUID = testMemberId,
        planId: UUID = testPlanId,
        status: SubscriptionStatus = SubscriptionStatus.ACTIVE,
        startDate: LocalDate = LocalDate.now().minusMonths(1),
        endDate: LocalDate = LocalDate.now().plusMonths(1)
    ): Subscription {
        val subscription = Subscription(
            id = id,
            memberId = memberId,
            planId = planId,
            startDate = startDate,
            endDate = endDate
        )

        // Set status via reflection if not ACTIVE
        if (status != SubscriptionStatus.ACTIVE) {
            val statusField = subscription.javaClass.getDeclaredField("status")
            statusField.isAccessible = true
            statusField.set(subscription, status)
        }

        return subscription
    }

    private fun createTestMembershipPlan(
        id: UUID = UUID.randomUUID(),
        name: LocalizedText = LocalizedText(en = "Test Plan", ar = "خطة اختبار")
    ): MembershipPlan {
        return MembershipPlan(
            id = id,
            name = name
        )
    }
}
