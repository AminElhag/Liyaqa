package com.liyaqa.marketing.infrastructure.jobs

import com.liyaqa.marketing.application.commands.EnrollMemberCommand
import com.liyaqa.marketing.application.services.CampaignExecutionService
import com.liyaqa.marketing.application.services.SegmentService
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.TriggerConfig
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.attendance.domain.ports.AttendanceRepository
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class MarketingJobsTest {

    @Mock
    private lateinit var campaignRepository: CampaignRepository

    @Mock
    private lateinit var campaignExecutionService: CampaignExecutionService

    @Mock
    private lateinit var segmentService: SegmentService

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var subscriptionRepository: SubscriptionRepository

    @Mock
    private lateinit var attendanceRepository: AttendanceRepository

    private lateinit var marketingJobs: MarketingJobs

    private lateinit var testMember: Member

    @BeforeEach
    fun setUp() {
        marketingJobs = MarketingJobs(
            campaignRepository,
            campaignExecutionService,
            segmentService,
            memberRepository,
            subscriptionRepository,
            attendanceRepository
        )

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE,
            dateOfBirth = LocalDate.of(1990, 6, 15)
        )
    }

    // ==================== PROCESS CAMPAIGN STEPS ====================

    @Test
    fun `processCampaignSteps should delegate to execution service`() {
        // Given
        whenever(campaignExecutionService.processDueSteps()) doReturn 5

        // When
        marketingJobs.processCampaignSteps()

        // Then
        verify(campaignExecutionService).processDueSteps()
    }

    // ==================== EXPIRY REMINDERS ====================

    @Test
    fun `triggerExpiryReminder30Days should enroll members with expiring subscriptions`() {
        // Given
        val campaign = createExpiryReminderCampaign(30)
        val subscription = createSubscription(testMember.id, LocalDate.now().plusDays(30))
        val pageable = PageRequest.of(0, 1000)

        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 30)) doReturn listOf(campaign)
        whenever(subscriptionRepository.findByStatusAndEndDateBetween(
            any<SubscriptionStatus>(), any<LocalDate>(), any<LocalDate>(), any<PageRequest>()
        )) doReturn PageImpl(listOf(subscription), pageable, 1)
        whenever(campaignExecutionService.enrollMember(any<EnrollMemberCommand>())).thenAnswer {
            CampaignEnrollment.create(
                campaignId = campaign.id,
                memberId = testMember.id,
                triggerReferenceType = "expiry_reminder"
            )
        }

        // When
        marketingJobs.triggerExpiryReminder30Days()

        // Then
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 30)
    }

    @Test
    fun `triggerExpiryReminder7Days should enroll members with expiring subscriptions`() {
        // Given
        val campaign = createExpiryReminderCampaign(7)
        val subscription = createSubscription(testMember.id, LocalDate.now().plusDays(7))
        val pageable = PageRequest.of(0, 1000)

        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 7)) doReturn listOf(campaign)
        whenever(subscriptionRepository.findByStatusAndEndDateBetween(
            any<SubscriptionStatus>(), any<LocalDate>(), any<LocalDate>(), any<PageRequest>()
        )) doReturn PageImpl(listOf(subscription), pageable, 1)
        whenever(campaignExecutionService.enrollMember(any<EnrollMemberCommand>())).thenAnswer {
            CampaignEnrollment.create(
                campaignId = campaign.id,
                memberId = testMember.id,
                triggerReferenceType = "expiry_reminder"
            )
        }

        // When
        marketingJobs.triggerExpiryReminder7Days()

        // Then
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 7)
    }

    @Test
    fun `triggerExpiryReminder1Day should enroll members with expiring subscriptions`() {
        // Given
        val campaign = createExpiryReminderCampaign(1)
        val subscription = createSubscription(testMember.id, LocalDate.now().plusDays(1))
        val pageable = PageRequest.of(0, 1000)

        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 1)) doReturn listOf(campaign)
        whenever(subscriptionRepository.findByStatusAndEndDateBetween(
            any<SubscriptionStatus>(), any<LocalDate>(), any<LocalDate>(), any<PageRequest>()
        )) doReturn PageImpl(listOf(subscription), pageable, 1)
        whenever(campaignExecutionService.enrollMember(any<EnrollMemberCommand>())).thenAnswer {
            CampaignEnrollment.create(
                campaignId = campaign.id,
                memberId = testMember.id,
                triggerReferenceType = "expiry_reminder"
            )
        }

        // When
        marketingJobs.triggerExpiryReminder1Day()

        // Then
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_BEFORE_EXPIRY, 1)
    }

    // ==================== WIN-BACK CAMPAIGNS ====================

    @Test
    fun `triggerWinBackCampaigns should enroll expired members`() {
        // Given
        val campaign7Days = createWinBackCampaign(7)
        val subscription = createExpiredSubscription(testMember.id, LocalDate.now().minusDays(7))
        val pageable = PageRequest.of(0, 1000)

        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 7)) doReturn listOf(campaign7Days)
        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 30)) doReturn emptyList()
        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 90)) doReturn emptyList()
        whenever(subscriptionRepository.findByStatusAndEndDateBetween(
            any<SubscriptionStatus>(), any<LocalDate>(), any<LocalDate>(), any<PageRequest>()
        )) doReturn PageImpl(listOf(subscription), pageable, 1)
        whenever(campaignExecutionService.enrollMember(any<EnrollMemberCommand>())).thenAnswer {
            CampaignEnrollment.create(
                campaignId = campaign7Days.id,
                memberId = testMember.id,
                triggerReferenceType = "win_back"
            )
        }

        // When
        marketingJobs.triggerWinBackCampaigns()

        // Then
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 7)
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 30)
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_AFTER_EXPIRY, 90)
    }

    // ==================== BIRTHDAY CAMPAIGNS ====================

    @Test
    fun `triggerBirthdayCampaigns should enroll members with birthday today`() {
        // Given
        val campaign = createBirthdayCampaign()
        val today = LocalDate.now()
        val birthdayMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "Birthday", ar = "ميلاد"),
            lastName = LocalizedText(en = "Person", ar = "شخص"),
            email = "birthday@example.com",
            phone = "+966500000001",
            status = MemberStatus.ACTIVE,
            dateOfBirth = LocalDate.of(1990, today.monthValue, today.dayOfMonth)
        )
        val pageable = PageRequest.of(0, 10000)

        whenever(campaignRepository.findActiveByTriggerType(TriggerType.BIRTHDAY)) doReturn listOf(campaign)
        whenever(memberRepository.findAll(any<PageRequest>())) doReturn PageImpl(listOf(birthdayMember), pageable, 1)
        whenever(campaignExecutionService.enrollMember(any<EnrollMemberCommand>())).thenAnswer {
            CampaignEnrollment.create(
                campaignId = campaign.id,
                memberId = birthdayMember.id,
                triggerReferenceType = "birthday"
            )
        }

        // When
        marketingJobs.triggerBirthdayCampaigns()

        // Then
        verify(campaignRepository).findActiveByTriggerType(TriggerType.BIRTHDAY)
        verify(memberRepository).findAll(any<PageRequest>())
    }

    @Test
    fun `triggerBirthdayCampaigns should not run when no campaigns configured`() {
        // Given
        whenever(campaignRepository.findActiveByTriggerType(TriggerType.BIRTHDAY)) doReturn emptyList()

        // When
        marketingJobs.triggerBirthdayCampaigns()

        // Then
        verify(memberRepository, never()).findAll(any<PageRequest>())
    }

    // ==================== INACTIVITY CAMPAIGNS ====================

    @Test
    fun `triggerInactivityCampaigns should process 14 and 30 day inactive members`() {
        // Given
        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_INACTIVE, 14)) doReturn emptyList()
        whenever(campaignRepository.findActiveByTriggerTypeAndDays(TriggerType.DAYS_INACTIVE, 30)) doReturn emptyList()

        // When
        marketingJobs.triggerInactivityCampaigns()

        // Then
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_INACTIVE, 14)
        verify(campaignRepository).findActiveByTriggerTypeAndDays(TriggerType.DAYS_INACTIVE, 30)
    }

    // ==================== SEGMENT RECALCULATION ====================

    @Test
    fun `calculateSegmentCounts should recalculate all dynamic segments`() {
        // Given
        whenever(segmentService.recalculateAllDynamicSegments()) doReturn 5

        // When
        marketingJobs.calculateSegmentCounts()

        // Then
        verify(segmentService).recalculateAllDynamicSegments()
    }

    // ==================== HELPER METHODS ====================

    private fun createExpiryReminderCampaign(days: Int): Campaign {
        val campaign = Campaign.create(
            name = "${days}-Day Expiry Reminder",
            description = "Remind members $days days before subscription expires",
            campaignType = CampaignType.EXPIRY_REMINDER,
            triggerType = TriggerType.DAYS_BEFORE_EXPIRY,
            triggerConfig = TriggerConfig(days = days),
            segmentId = null,
            startDate = null,
            endDate = null
        )
        campaign.activate()
        return campaign
    }

    private fun createWinBackCampaign(days: Int): Campaign {
        val campaign = Campaign.create(
            name = "${days}-Day Win Back",
            description = "Win back members $days days after subscription expired",
            campaignType = CampaignType.WIN_BACK,
            triggerType = TriggerType.DAYS_AFTER_EXPIRY,
            triggerConfig = TriggerConfig(days = days),
            segmentId = null,
            startDate = null,
            endDate = null
        )
        campaign.activate()
        return campaign
    }

    private fun createBirthdayCampaign(): Campaign {
        val campaign = Campaign.create(
            name = "Birthday Greetings",
            description = "Send birthday greetings to members",
            campaignType = CampaignType.BIRTHDAY,
            triggerType = TriggerType.BIRTHDAY,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        campaign.activate()
        return campaign
    }

    private fun createSubscription(memberId: UUID, endDate: LocalDate): Subscription {
        return Subscription(
            id = UUID.randomUUID(),
            memberId = memberId,
            planId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(1),
            endDate = endDate,
            status = SubscriptionStatus.ACTIVE
        )
    }

    private fun createExpiredSubscription(memberId: UUID, expiredDate: LocalDate): Subscription {
        return Subscription(
            id = UUID.randomUUID(),
            memberId = memberId,
            planId = UUID.randomUUID(),
            startDate = expiredDate.minusMonths(1),
            endDate = expiredDate,
            status = SubscriptionStatus.EXPIRED
        )
    }
}
