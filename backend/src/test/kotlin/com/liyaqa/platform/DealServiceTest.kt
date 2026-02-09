package com.liyaqa.platform

import com.liyaqa.platform.application.commands.ChangeStageCommand
import com.liyaqa.platform.application.commands.CreateDealActivityCommand
import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.application.services.DealService
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealActivity
import com.liyaqa.platform.domain.model.DealActivityType
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.model.PlatformUser
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.domain.ports.DealActivityRepository
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.platform.domain.ports.PlatformUserRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.infrastructure.security.SecurityService
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
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DealServiceTest {

    @Mock
    private lateinit var dealRepository: DealRepository

    @Mock
    private lateinit var dealActivityRepository: DealActivityRepository

    @Mock
    private lateinit var platformUserRepository: PlatformUserRepository

    @Mock
    private lateinit var securityService: SecurityService

    @Mock
    private lateinit var eventPublisher: ApplicationEventPublisher

    private lateinit var dealService: DealService
    private lateinit var testUser: PlatformUser
    private val testUserId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        dealService = DealService(dealRepository, dealActivityRepository, platformUserRepository, securityService, eventPublisher)
        testUser = PlatformUser(
            id = testUserId,
            email = "rep@liyaqa.com",
            passwordHash = "hash",
            displayName = LocalizedText(en = "Sales Rep", ar = null),
            role = PlatformUserRole.ACCOUNT_MANAGER
        )
        whenever(securityService.getCurrentUserId()) doReturn testUserId
        whenever(platformUserRepository.findById(testUserId)) doReturn Optional.of(testUser)
    }

    // ============================================
    // Create
    // ============================================

    @Test
    fun `createDeal should create deal successfully`() {
        val command = CreateDealCommand(
            facilityName = "Test Gym",
            contactName = "John Doe",
            contactEmail = "john@example.com",
            source = DealSource.WEBSITE,
            assignedToId = testUserId,
            estimatedValue = BigDecimal("10000")
        )

        whenever(dealRepository.save(any<Deal>())) doReturn createTestDeal()
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = UUID.randomUUID(),
            type = DealActivityType.STATUS_CHANGE,
            content = "Deal created in stage LEAD",
            createdBy = testUserId
        )

        val result = dealService.createDeal(command)
        assertNotNull(result)
        verify(dealRepository).save(any<Deal>())
        verify(dealActivityRepository).save(any<DealActivity>()) // Auto-creates STATUS_CHANGE
    }

    @Test
    fun `createDeal should use current user when assignedToId is null`() {
        val command = CreateDealCommand(
            facilityName = "Test Gym",
            contactName = "John Doe",
            contactEmail = "john@example.com",
            assignedToId = null
        )

        whenever(dealRepository.save(any<Deal>())) doReturn createTestDeal()
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = UUID.randomUUID(),
            type = DealActivityType.STATUS_CHANGE,
            content = "Deal created",
            createdBy = testUserId
        )

        dealService.createDeal(command)
        verify(platformUserRepository).findById(testUserId)
    }

    // ============================================
    // Get / List
    // ============================================

    @Test
    fun `getDeal should return deal when found`() {
        val testDeal = createTestDeal()
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        val result = dealService.getDeal(testDeal.id)
        assertEquals(testDeal.id, result.id)
    }

    @Test
    fun `getDeal should throw when not found`() {
        val dealId = UUID.randomUUID()
        whenever(dealRepository.findById(dealId)) doReturn Optional.empty()

        assertThrows(NoSuchElementException::class.java) {
            dealService.getDeal(dealId)
        }
    }

    @Test
    fun `listDeals should return paginated deals`() {
        val pageable = PageRequest.of(0, 10)
        val deals = listOf(createTestDeal(), createTestDeal())
        val page = PageImpl(deals, pageable, deals.size.toLong())

        whenever(dealRepository.findAll(pageable)) doReturn page

        val result = dealService.listDeals(pageable = pageable)
        assertEquals(2, result.content.size)
    }

    @Test
    fun `listDeals filters by stage`() {
        val pageable = PageRequest.of(0, 10)
        val deals = listOf(createTestDeal())
        val page = PageImpl(deals, pageable, deals.size.toLong())

        whenever(dealRepository.findByStage(DealStage.LEAD, pageable)) doReturn page

        val result = dealService.listDeals(stage = DealStage.LEAD, pageable = pageable)
        assertEquals(1, result.content.size)
    }

    // ============================================
    // Update
    // ============================================

    @Test
    fun `updateDeal should throw when deal is closed`() {
        val testDeal = createTestDeal(DealStage.WON)
        val command = UpdateDealCommand(facilityName = "New Name")
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        assertThrows(IllegalArgumentException::class.java) {
            dealService.updateDeal(testDeal.id, command)
        }
    }

    @Test
    fun `updateDeal should update open deal`() {
        val testDeal = createTestDeal()
        val command = UpdateDealCommand(facilityName = "Updated Gym")
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        val result = dealService.updateDeal(testDeal.id, command)
        assertNotNull(result)
        assertEquals("Updated Gym", testDeal.facilityName)
    }

    // ============================================
    // Stage Transitions
    // ============================================

    @Test
    fun `changeDealStage should transition from LEAD to CONTACTED`() {
        val testDeal = createTestDeal()
        val command = ChangeStageCommand(newStage = DealStage.CONTACTED)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = testDeal.id,
            type = DealActivityType.STATUS_CHANGE,
            content = "Stage changed from LEAD to CONTACTED",
            createdBy = testUserId
        )

        val result = dealService.changeDealStage(testDeal.id, command)
        assertEquals(DealStage.CONTACTED, result.stage)
        verify(dealActivityRepository).save(any<DealActivity>()) // Auto-creates activity
    }

    @Test
    fun `changeDealStage should set lostReason when losing`() {
        val testDeal = createTestDeal()
        val command = ChangeStageCommand(newStage = DealStage.LOST, reason = "Budget constraints")
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = testDeal.id,
            type = DealActivityType.STATUS_CHANGE,
            content = "Stage changed",
            createdBy = testUserId
        )

        val result = dealService.changeDealStage(testDeal.id, command)
        assertEquals(DealStage.LOST, result.stage)
        assertEquals("Budget constraints", result.lostReason)
    }

    @Test
    fun `changeDealStage should reject invalid transition`() {
        val testDeal = createTestDeal()
        val command = ChangeStageCommand(newStage = DealStage.WON)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        assertThrows(IllegalArgumentException::class.java) {
            dealService.changeDealStage(testDeal.id, command)
        }
        verify(dealRepository, never()).save(any<Deal>())
    }

    // ============================================
    // Activities
    // ============================================

    @Test
    fun `addActivity should create activity`() {
        val dealId = UUID.randomUUID()
        val command = CreateDealActivityCommand(
            type = DealActivityType.NOTE,
            content = "Called and left voicemail"
        )
        whenever(dealRepository.existsById(dealId)) doReturn true
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = dealId,
            type = DealActivityType.NOTE,
            content = "Called and left voicemail",
            createdBy = testUserId
        )

        val result = dealService.addActivity(dealId, command)
        assertEquals(DealActivityType.NOTE, result.type)
        assertEquals("Called and left voicemail", result.content)
    }

    @Test
    fun `addActivity should throw for non-existent deal`() {
        val dealId = UUID.randomUUID()
        whenever(dealRepository.existsById(dealId)) doReturn false

        assertThrows(IllegalArgumentException::class.java) {
            dealService.addActivity(dealId, CreateDealActivityCommand(DealActivityType.NOTE, "test"))
        }
    }

    // ============================================
    // Pipeline & Metrics
    // ============================================

    @Test
    fun `getPipelineCounts should return stage counts`() {
        val counts = DealStage.entries.associateWith { 5L }
        whenever(dealRepository.countByStageGrouped()) doReturn counts

        val result = dealService.getPipelineCounts()
        assertEquals(9, result.size)
        assertEquals(5L, result[DealStage.LEAD])
    }

    @Test
    fun `getMetrics should calculate conversion rate`() {
        val counts = mapOf(
            DealStage.LEAD to 10L,
            DealStage.CONTACTED to 5L,
            DealStage.DEMO_SCHEDULED to 0L,
            DealStage.DEMO_DONE to 0L,
            DealStage.PROPOSAL_SENT to 3L,
            DealStage.NEGOTIATION to 2L,
            DealStage.WON to 8L,
            DealStage.LOST to 2L,
            DealStage.CHURNED to 0L
        )
        whenever(dealRepository.countByStageGrouped()) doReturn counts

        val wonDeals = listOf(createTestDeal(DealStage.WON), createTestDeal(DealStage.WON))
        whenever(dealRepository.findByStage(DealStage.WON, Pageable.unpaged())) doReturn
            PageImpl(wonDeals)

        val metrics = dealService.getMetrics()
        assertEquals(30L, metrics.totalDeals)
        assertEquals(20L, metrics.openDeals)
        assertEquals(8L, metrics.wonDeals)
        assertEquals(2L, metrics.lostDeals)
        // conversionRate = 8 / (8+2) = 0.8
        assertEquals(0.8, metrics.conversionRate, 0.01)
    }

    // ============================================
    // Full Pipeline Flow
    // ============================================

    @Test
    fun `full pipeline flow creates activities at each transition`() {
        val deal = createTestDeal()
        whenever(dealRepository.findById(deal.id)) doReturn Optional.of(deal)
        whenever(dealRepository.save(any<Deal>())) doReturn deal
        whenever(dealActivityRepository.save(any<DealActivity>())) doReturn DealActivity(
            dealId = deal.id,
            type = DealActivityType.STATUS_CHANGE,
            content = "changed",
            createdBy = testUserId
        )

        val stages = listOf(
            DealStage.CONTACTED,
            DealStage.DEMO_SCHEDULED,
            DealStage.DEMO_DONE,
            DealStage.PROPOSAL_SENT,
            DealStage.NEGOTIATION,
            DealStage.WON
        )

        for (stage in stages) {
            dealService.changeDealStage(deal.id, ChangeStageCommand(newStage = stage))
        }

        assertEquals(DealStage.WON, deal.stage)
        // Each transition creates a STATUS_CHANGE activity
        verify(dealActivityRepository, org.mockito.kotlin.times(stages.size)).save(any<DealActivity>())
    }

    // ============================================
    // Helpers
    // ============================================

    private fun createTestDeal(stage: DealStage = DealStage.LEAD): Deal {
        val deal = Deal.create(
            facilityName = "Test Gym",
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            assignedTo = testUser,
            estimatedValue = BigDecimal("10000")
        )
        when (stage) {
            DealStage.CONTACTED -> deal.changeStage(DealStage.CONTACTED)
            DealStage.DEMO_SCHEDULED -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED) }
            DealStage.DEMO_DONE -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED); deal.changeStage(DealStage.DEMO_DONE) }
            DealStage.PROPOSAL_SENT -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED); deal.changeStage(DealStage.DEMO_DONE); deal.changeStage(DealStage.PROPOSAL_SENT) }
            DealStage.NEGOTIATION -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED); deal.changeStage(DealStage.DEMO_DONE); deal.changeStage(DealStage.PROPOSAL_SENT); deal.changeStage(DealStage.NEGOTIATION) }
            DealStage.WON -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED); deal.changeStage(DealStage.DEMO_DONE); deal.changeStage(DealStage.PROPOSAL_SENT); deal.changeStage(DealStage.NEGOTIATION); deal.changeStage(DealStage.WON) }
            DealStage.LOST -> { deal.changeStage(DealStage.LOST) }
            DealStage.CHURNED -> { deal.changeStage(DealStage.CONTACTED); deal.changeStage(DealStage.DEMO_SCHEDULED); deal.changeStage(DealStage.DEMO_DONE); deal.changeStage(DealStage.PROPOSAL_SENT); deal.changeStage(DealStage.NEGOTIATION); deal.changeStage(DealStage.WON); deal.changeStage(DealStage.CHURNED) }
            else -> {} // LEAD is default
        }
        return deal
    }
}
