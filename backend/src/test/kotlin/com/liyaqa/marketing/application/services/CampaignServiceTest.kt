package com.liyaqa.marketing.application.services

import com.liyaqa.marketing.application.commands.CreateCampaignCommand
import com.liyaqa.marketing.application.commands.CreateCampaignStepCommand
import com.liyaqa.marketing.application.commands.DuplicateCampaignCommand
import com.liyaqa.marketing.application.commands.UpdateCampaignCommand
import com.liyaqa.marketing.domain.model.Campaign
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignStep
import com.liyaqa.marketing.domain.model.CampaignType
import com.liyaqa.marketing.domain.model.MarketingChannel
import com.liyaqa.marketing.domain.model.TriggerConfig
import com.liyaqa.marketing.domain.model.TriggerType
import com.liyaqa.marketing.domain.ports.CampaignRepository
import com.liyaqa.marketing.domain.ports.CampaignStepRepository
import com.liyaqa.marketing.domain.ports.EnrollmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertThrows
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
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CampaignServiceTest {

    @Mock
    private lateinit var campaignRepository: CampaignRepository

    @Mock
    private lateinit var stepRepository: CampaignStepRepository

    @Mock
    private lateinit var enrollmentRepository: EnrollmentRepository

    private lateinit var campaignService: CampaignService

    private lateinit var testCampaign: Campaign

    @BeforeEach
    fun setUp() {
        campaignService = CampaignService(
            campaignRepository,
            stepRepository,
            enrollmentRepository
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
    }

    // ==================== CREATE CAMPAIGN ====================

    @Test
    fun `createCampaign should create new campaign`() {
        // Given
        val command = CreateCampaignCommand(
            name = "Welcome Series",
            description = "Welcome new members",
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )

        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.createCampaign(command)

        // Then
        assertNotNull(result)
        assertEquals(command.name, result.name)
        assertEquals(command.campaignType, result.campaignType)
        assertEquals(CampaignStatus.DRAFT, result.status)
        verify(campaignRepository).save(any<Campaign>())
    }

    @Test
    fun `createCampaign with trigger config should set days correctly`() {
        // Given
        val command = CreateCampaignCommand(
            name = "Expiry Reminder",
            description = "Remind before expiry",
            campaignType = CampaignType.EXPIRY_REMINDER,
            triggerType = TriggerType.DAYS_BEFORE_EXPIRY,
            triggerConfig = TriggerConfig(days = 7),
            segmentId = null,
            startDate = null,
            endDate = null
        )

        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.createCampaign(command)

        // Then
        assertNotNull(result.triggerConfig)
        assertEquals(7, result.triggerConfig?.days)
    }

    // ==================== GET CAMPAIGN ====================

    @Test
    fun `getCampaign should return campaign when found`() {
        // Given
        val campaignId = testCampaign.id
        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)

        // When
        val result = campaignService.getCampaign(campaignId)

        // Then
        assertEquals(testCampaign, result)
    }

    @Test
    fun `getCampaign should throw when not found`() {
        // Given
        val campaignId = UUID.randomUUID()
        whenever(campaignRepository.findById(campaignId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            campaignService.getCampaign(campaignId)
        }
    }

    // ==================== LIST CAMPAIGNS ====================

    @Test
    fun `listCampaigns should return paginated campaigns`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val campaigns = listOf(testCampaign)
        val page = PageImpl(campaigns, pageable, 1)

        whenever(campaignRepository.findAll(pageable)) doReturn page

        // When
        val result = campaignService.listCampaigns(pageable)

        // Then
        assertEquals(1, result.totalElements)
        assertEquals(testCampaign, result.content[0])
    }

    // ==================== UPDATE CAMPAIGN ====================

    @Test
    fun `updateCampaign should update campaign in DRAFT status`() {
        // Given
        val campaignId = testCampaign.id
        val command = UpdateCampaignCommand(
            name = "Updated Name",
            description = "Updated description",
            triggerConfig = TriggerConfig(days = 14),
            segmentId = null,
            startDate = null,
            endDate = null
        )

        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)
        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.updateCampaign(campaignId, command)

        // Then
        assertEquals("Updated Name", result.name)
        assertEquals("Updated description", result.description)
    }

    @Test
    fun `updateCampaign should throw when campaign is ACTIVE`() {
        // Given
        val activeCampaign = Campaign.create(
            name = "Active Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        // Simulate activation
        activeCampaign.activate()

        val command = UpdateCampaignCommand(
            name = "Updated Name",
            description = null,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )

        whenever(campaignRepository.findById(activeCampaign.id)) doReturn Optional.of(activeCampaign)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            campaignService.updateCampaign(activeCampaign.id, command)
        }
    }

    // ==================== DELETE CAMPAIGN ====================

    @Test
    fun `deleteCampaign should delete campaign in DRAFT status`() {
        // Given
        val campaignId = testCampaign.id
        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)

        // When
        campaignService.deleteCampaign(campaignId)

        // Then
        verify(stepRepository).deleteByCampaignId(campaignId)
        verify(campaignRepository).deleteById(campaignId)
    }

    @Test
    fun `deleteCampaign should throw when campaign is ACTIVE`() {
        // Given
        val activeCampaign = Campaign.create(
            name = "Active Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        activeCampaign.activate()

        whenever(campaignRepository.findById(activeCampaign.id)) doReturn Optional.of(activeCampaign)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            campaignService.deleteCampaign(activeCampaign.id)
        }

        verify(campaignRepository, never()).deleteById(any())
    }

    // ==================== CAMPAIGN LIFECYCLE ====================

    @Test
    fun `activateCampaign should activate campaign with steps`() {
        // Given
        val campaignId = testCampaign.id
        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)
        whenever(stepRepository.countByCampaignId(campaignId)) doReturn 1L
        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.activateCampaign(campaignId)

        // Then
        assertEquals(CampaignStatus.ACTIVE, result.status)
    }

    @Test
    fun `activateCampaign should throw when no steps`() {
        // Given
        val campaignId = testCampaign.id
        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)
        whenever(stepRepository.countByCampaignId(campaignId)) doReturn 0L

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            campaignService.activateCampaign(campaignId)
        }
    }

    @Test
    fun `pauseCampaign should pause active campaign`() {
        // Given
        val activeCampaign = Campaign.create(
            name = "Active Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        activeCampaign.activate()

        whenever(campaignRepository.findById(activeCampaign.id)) doReturn Optional.of(activeCampaign)
        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.pauseCampaign(activeCampaign.id)

        // Then
        assertEquals(CampaignStatus.PAUSED, result.status)
    }

    @Test
    fun `archiveCampaign should archive and cancel enrollments`() {
        // Given
        val activeCampaign = Campaign.create(
            name = "Active Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        activeCampaign.activate()

        whenever(campaignRepository.findById(activeCampaign.id)) doReturn Optional.of(activeCampaign)
        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }

        // When
        val result = campaignService.archiveCampaign(activeCampaign.id)

        // Then
        assertEquals(CampaignStatus.ARCHIVED, result.status)
        verify(enrollmentRepository).cancelAllByCampaignId(activeCampaign.id)
    }

    // ==================== DUPLICATE CAMPAIGN ====================

    @Test
    fun `duplicateCampaign should create copy with new name`() {
        // Given
        val sourceId = testCampaign.id
        val command = DuplicateCampaignCommand(
            sourceCampaignId = sourceId,
            newName = "Welcome Series Copy"
        )

        val testStep = CampaignStep.create(
            campaignId = sourceId,
            stepNumber = 1,
            name = "Day 1",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Welcome!",
            bodyAr = "مرحبا!",
            subjectEn = "Welcome",
            subjectAr = "مرحبا",
            delayDays = 0,
            delayHours = 0
        )

        whenever(campaignRepository.findById(sourceId)) doReturn Optional.of(testCampaign)
        whenever(campaignRepository.save(any<Campaign>())).thenAnswer { invocation ->
            invocation.getArgument<Campaign>(0)
        }
        whenever(stepRepository.findByCampaignIdOrderByStepNumber(sourceId)) doReturn listOf(testStep)
        whenever(stepRepository.saveAll(any<List<CampaignStep>>())).thenAnswer { invocation ->
            invocation.getArgument<List<CampaignStep>>(0)
        }

        // When
        val result = campaignService.duplicateCampaign(command)

        // Then
        assertEquals("Welcome Series Copy", result.name)
        assertEquals(testCampaign.campaignType, result.campaignType)
        assertEquals(CampaignStatus.DRAFT, result.status)
        verify(stepRepository).saveAll(any<List<CampaignStep>>())
    }

    // ==================== CAMPAIGN STEPS ====================

    @Test
    fun `addStep should add step to campaign`() {
        // Given
        val campaignId = testCampaign.id
        val command = CreateCampaignStepCommand(
            campaignId = campaignId,
            name = "Day 1 Welcome",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Welcome to our gym!",
            bodyAr = "مرحبا بك في صالتنا!",
            subjectEn = "Welcome!",
            subjectAr = "مرحبا!",
            delayDays = 0,
            delayHours = 0,
            isAbTest = false,
            abVariant = null,
            abSplitPercentage = null
        )

        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)
        whenever(stepRepository.getMaxStepNumber(campaignId)) doReturn null
        whenever(stepRepository.save(any<CampaignStep>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignStep>(0)
        }

        // When
        val result = campaignService.addStep(command)

        // Then
        assertNotNull(result)
        assertEquals(1, result.stepNumber)
        assertEquals("Day 1 Welcome", result.name)
        assertEquals(MarketingChannel.EMAIL, result.channel)
    }

    @Test
    fun `addStep should increment step number`() {
        // Given
        val campaignId = testCampaign.id
        val command = CreateCampaignStepCommand(
            campaignId = campaignId,
            name = "Day 3 Follow-up",
            channel = MarketingChannel.EMAIL,
            bodyEn = "How's your first week?",
            bodyAr = "كيف كان أسبوعك الأول؟",
            subjectEn = "Checking in",
            subjectAr = "نتحقق منك",
            delayDays = 3,
            delayHours = 0,
            isAbTest = false,
            abVariant = null,
            abSplitPercentage = null
        )

        whenever(campaignRepository.findById(campaignId)) doReturn Optional.of(testCampaign)
        whenever(stepRepository.getMaxStepNumber(campaignId)) doReturn 2
        whenever(stepRepository.save(any<CampaignStep>())).thenAnswer { invocation ->
            invocation.getArgument<CampaignStep>(0)
        }

        // When
        val result = campaignService.addStep(command)

        // Then
        assertEquals(3, result.stepNumber)
    }

    @Test
    fun `addStep should throw when campaign is ACTIVE`() {
        // Given
        val activeCampaign = Campaign.create(
            name = "Active Campaign",
            description = null,
            campaignType = CampaignType.WELCOME_SEQUENCE,
            triggerType = TriggerType.MEMBER_CREATED,
            triggerConfig = null,
            segmentId = null,
            startDate = null,
            endDate = null
        )
        activeCampaign.activate()

        val command = CreateCampaignStepCommand(
            campaignId = activeCampaign.id,
            name = "New Step",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Test",
            bodyAr = "اختبار",
            subjectEn = "Test",
            subjectAr = "اختبار",
            delayDays = 0,
            delayHours = 0,
            isAbTest = false,
            abVariant = null,
            abSplitPercentage = null
        )

        whenever(campaignRepository.findById(activeCampaign.id)) doReturn Optional.of(activeCampaign)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            campaignService.addStep(command)
        }
    }

    @Test
    fun `deleteStep should delete step from DRAFT campaign`() {
        // Given
        val stepId = UUID.randomUUID()
        val step = CampaignStep.create(
            campaignId = testCampaign.id,
            stepNumber = 1,
            name = "Day 1",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Welcome!",
            bodyAr = "مرحبا!",
            subjectEn = "Welcome",
            subjectAr = "مرحبا",
            delayDays = 0,
            delayHours = 0
        )

        whenever(stepRepository.findById(stepId)) doReturn Optional.of(step)
        whenever(campaignRepository.findById(testCampaign.id)) doReturn Optional.of(testCampaign)

        // When
        campaignService.deleteStep(stepId)

        // Then
        verify(stepRepository).deleteById(stepId)
    }

    @Test
    fun `getSteps should return ordered steps`() {
        // Given
        val campaignId = testCampaign.id
        val step1 = CampaignStep.create(
            campaignId = campaignId,
            stepNumber = 1,
            name = "Day 1",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Welcome!",
            bodyAr = "مرحبا!",
            subjectEn = "Welcome",
            subjectAr = "مرحبا",
            delayDays = 0,
            delayHours = 0
        )
        val step2 = CampaignStep.create(
            campaignId = campaignId,
            stepNumber = 2,
            name = "Day 3",
            channel = MarketingChannel.EMAIL,
            bodyEn = "Follow up",
            bodyAr = "متابعة",
            subjectEn = "How's it going?",
            subjectAr = "كيف حالك؟",
            delayDays = 3,
            delayHours = 0
        )

        whenever(stepRepository.findByCampaignIdOrderByStepNumber(campaignId)) doReturn listOf(step1, step2)

        // When
        val result = campaignService.getSteps(campaignId)

        // Then
        assertEquals(2, result.size)
        assertEquals(1, result[0].stepNumber)
        assertEquals(2, result[1].stepNumber)
    }
}
