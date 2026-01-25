package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.EnrollMemberCommand
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignEnrollment
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.EnrollmentStatus
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.MessageLog
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import com.liyaqa.marketing.domain.ports.MessageLogRepository
import com.liyaqa.marketing.domain.ports.TrackingPixelRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.model.MemberStatus
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.notification.application.services.NotificationService
import com.liyaqa.shared.domain.LocalizedText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
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
import org.springframework.data.domain.Pageable
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampaignExecutionServiceTest {

    @Mock
    private lateinit var campaignRepository: CampaignRepository

    @Mock
    private lateinit var stepRepository: CampaignStepRepository

    @Mock
    private lateinit var enrollmentRepository: EnrollmentRepository

    @Mock
    private lateinit var messageLogRepository: MessageLogRepository

    @Mock
    private lateinit var trackingPixelRepository: TrackingPixelRepository

    @Mock
    private lateinit var memberRepository: MemberRepository

    @Mock
    private lateinit var notificationService: NotificationService

    private lateinit var campaignExecutionService: CampaignExecutionService

    private lateinit var testCampaign: Campaign
    private lateinit var testStep: CampaignStep
    private lateinit var testMember: Member

    @BeforeEach
    fun setUp() {
        campaignExecutionService = CampaignExecutionService(
            campaignRepository,
            stepRepository,
            enrollmentRepository,
            messageLogRepository,
            trackingPixelRepository,
            memberRepository,
            notificationService
        )

        testCampaign = Campaign.create(
            name = "Welcome Series",
            description = "Welcome new members",
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        testCampaign.activate()

        testStep = CampaignStep.create(
            campaignId = testCampaign.id,
            stepNumber = 1,
            name = "Day 1 Welcome",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Welcome {{firstName}}!",
            bodyAr = "مرحبا {{firstName}}!",
            subjectEn = "Welcome to the gym!",
            subjectAr = "مرحبا بك في الصالة!",
            delayDays = 0,
            delayHours = 0
        )

        testMember = Member(
            id = UUID.randomUUID(),
            firstName = LocalizedText(en = "John", ar = "جون"),
            lastName = LocalizedText(en = "Doe", ar = "دو"),
            email = "john.doe@example.com",
            phone = "+966500000000",
            status = MemberStatus.ACTIVE
        )
    }

    // ==================== ENROLL MEMBER ====================

    @Test
    fun `enrollMember should create enrollment for active campaign`() {
        // Given
        val command = EnrollMemberCommand(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        whenever(campaignRepository.findById(testCampaign.id)) doReturn Optional.of(testCampaign)
        whenever(enrollmentRepository.existsByMemberIdAndCampaignIdAndStatus(
            testMember.id,
            testCampaign.id,
            EnrollmentStatus.ACTIVE
        )) doReturn false
        whenever(stepRepository.findActiveByCampaignId(testCampaign.id)) doReturn listOf(testStep)
        whenever(enrollmentRepository.save(any<CampaignEnrollment>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignEnrollment>(0)
        }

        // When
        val result = campaignExecutionService.enrollMember(command)

        // Then
        assertNotNull(result)
        assertEquals(testCampaign.id, result?.campaignId)
        assertEquals(testMember.id, result?.memberId)
        assertEquals(EnrollmentStatus.ACTIVE, result?.status)
        verify(enrollmentRepository).save(any<CampaignEnrollment>())
    }

    @Test
    fun `enrollMember should return null when campaign not active`() {
        // Given
        val draftCampaign = Campaign.create(
            name = "Draft Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        // Campaign is still in DRAFT status

        val command = EnrollMemberCommand(
            campaignId = draftCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        whenever(campaignRepository.findById(draftCampaign.id)) doReturn Optional.of(draftCampaign)

        // When
        val result = campaignExecutionService.enrollMember(command)

        // Then
        assertNull(result)
        verify(enrollmentRepository, never()).save(any())
    }

    @Test
    fun `enrollMember should return null when member already enrolled`() {
        // Given
        val command = EnrollMemberCommand(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        whenever(campaignRepository.findById(testCampaign.id)) doReturn Optional.of(testCampaign)
        whenever(enrollmentRepository.existsByMemberIdAndCampaignIdAndStatus(
            testMember.id,
            testCampaign.id,
            EnrollmentStatus.ACTIVE
        )) doReturn true

        // When
        val result = campaignExecutionService.enrollMember(command)

        // Then
        assertNull(result)
        verify(enrollmentRepository, never()).save(any())
    }

    // ==================== CANCEL ENROLLMENT ====================

    @Test
    fun `cancelEnrollment should cancel active enrollment`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        whenever(enrollmentRepository.findById(enrollment.id)) doReturn Optional.of(enrollment)
        whenever(enrollmentRepository.save(any<CampaignEnrollment>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignEnrollment>(0)
        }

        // When
        campaignExecutionService.cancelEnrollment(enrollment.id)

        // Then
        assertEquals(EnrollmentStatus.CANCELLED, enrollment.status)
        verify(enrollmentRepository).save(enrollment)
    }

    // ==================== GET ENROLLMENT ====================

    @Test
    fun `getEnrollment should return enrollment when found`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        whenever(enrollmentRepository.findById(enrollment.id)) doReturn Optional.of(enrollment)

        // When
        val result = campaignExecutionService.getEnrollment(enrollment.id)

        // Then
        assertEquals(enrollment, result)
    }

    // ==================== PROCESS DUE STEPS ====================

    @Test
    fun `processDueSteps should process enrollments with due next step`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )
        val pageable = PageRequest.of(0, 100)

        whenever(enrollmentRepository.findActiveWithNextStepDueBefore(any<Instant>(), any<Pageable>())) doReturn PageImpl(listOf(enrollment), pageable, 1)
        whenever(stepRepository.findByCampaignIdAndStepNumber(testCampaign.id, 1)) doReturn Optional.of(testStep)
        whenever(memberRepository.findById(testMember.id)) doReturn Optional.of(testMember)
        whenever(campaignRepository.findById(testCampaign.id)) doReturn Optional.of(testCampaign)
        whenever(messageLogRepository.save(any<MessageLog>())).thenAnswer { invocation ->
            invocation.getArgument<MessageLog>(0)
        }
        whenever(enrollmentRepository.save(any<CampaignEnrollment>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignEnrollment>(0)
        }
        whenever(stepRepository.countByCampaignId(testCampaign.id)) doReturn 1L

        // When
        val processedCount = campaignExecutionService.processDueSteps()

        // Then
        verify(enrollmentRepository).findActiveWithNextStepDueBefore(any<Instant>(), any<Pageable>())
    }

    // ==================== ENROLLMENT STATUS ====================

    @Test
    fun `enrollment should start with ACTIVE status`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        // Then
        assertEquals(EnrollmentStatus.ACTIVE, enrollment.status)
        assertEquals(0, enrollment.currentStep) // Starts at 0 (before first step)
    }

    @Test
    fun `enrollment complete should set status to COMPLETED`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        // When
        enrollment.complete()

        // Then
        assertEquals(EnrollmentStatus.COMPLETED, enrollment.status)
        assertNotNull(enrollment.completedAt)
    }

    @Test
    fun `enrollment cancel should set status to CANCELLED`() {
        // Given
        val enrollment = CampaignEnrollment.create(
            campaignId = testCampaign.id,
            memberId = testMember.id,
            triggerReferenceType = "member_created"
        )

        // When
        enrollment.cancel()

        // Then
        assertEquals(EnrollmentStatus.CANCELLED, enrollment.status)
    }

    // ==================== BULK ENROLLMENT ====================

    @Test
    fun `enrollMembers should enroll multiple members`() {
        // Given
        val memberIds = listOf(testMember.id, UUID.randomUUID())

        whenever(campaignRepository.findById(testCampaign.id)) doReturn Optional.of(testCampaign)
        whenever(enrollmentRepository.existsByMemberIdAndCampaignIdAndStatus(
            any<UUID>(),
            any<UUID>(),
            any<EnrollmentStatus>()
        )) doReturn false
        whenever(stepRepository.findActiveByCampaignId(testCampaign.id)) doReturn listOf(testStep)
        whenever(enrollmentRepository.save(any<CampaignEnrollment>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignEnrollment>(0)
        }

        // When
        val enrolledCount = campaignExecutionService.enrollMembers(testCampaign.id, memberIds)

        // Then
        assertEquals(2, enrolledCount)
    }

}
