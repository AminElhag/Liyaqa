package com.liyaqa.platform

import com.liyaqa.platform.application.commands.CreateDealCommand
import com.liyaqa.platform.application.commands.LoseDealCommand
import com.liyaqa.platform.application.commands.ReassignDealCommand
import com.liyaqa.platform.application.commands.UpdateDealCommand
import com.liyaqa.platform.application.services.ClientOnboardingService
import com.liyaqa.platform.application.services.DealService
import com.liyaqa.platform.domain.model.Deal
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.platform.domain.ports.ClientPlanRepository
import com.liyaqa.platform.domain.ports.DealRepository
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
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
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DealServiceTest {

    @Mock
    private lateinit var dealRepository: DealRepository

    @Mock
    private lateinit var planRepository: ClientPlanRepository

    @Mock
    private lateinit var clientOnboardingService: ClientOnboardingService

    private lateinit var dealService: DealService

    private val testSalesRepId = UUID.randomUUID()

    @BeforeEach
    fun setUp() {
        dealService = DealService(dealRepository, planRepository, clientOnboardingService)
    }

    @Test
    fun `createDeal should create deal successfully`() {
        // Given
        val command = CreateDealCommand(
            title = LocalizedText(en = "New Customer Deal", ar = "صفقة عميل جديد"),
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            salesRepId = testSalesRepId,
            estimatedValue = Money.of(BigDecimal("10000"), "SAR")
        )

        whenever(dealRepository.save(any<Deal>())) doReturn createTestDeal()

        // When
        val result = dealService.createDeal(command)

        // Then
        assertNotNull(result)
        verify(dealRepository).save(any<Deal>())
    }

    @Test
    fun `createDeal should validate plan exists when provided`() {
        // Given
        val planId = UUID.randomUUID()
        val command = CreateDealCommand(
            title = LocalizedText(en = "New Customer Deal", ar = "صفقة عميل جديد"),
            source = DealSource.WEBSITE,
            contactName = "John Doe",
            contactEmail = "john@example.com",
            salesRepId = testSalesRepId,
            interestedPlanId = planId
        )

        whenever(planRepository.existsById(planId)) doReturn false

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            dealService.createDeal(command)
        }

        verify(dealRepository, never()).save(any<Deal>())
    }

    @Test
    fun `getDeal should return deal when found`() {
        // Given
        val testDeal = createTestDeal()
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        // When
        val result = dealService.getDeal(testDeal.id)

        // Then
        assertEquals(testDeal.id, result.id)
        assertEquals(testDeal.title.en, result.title.en)
    }

    @Test
    fun `getDeal should throw when deal not found`() {
        // Given
        val dealId = UUID.randomUUID()
        whenever(dealRepository.findById(dealId)) doReturn Optional.empty()

        // When/Then
        assertThrows(NoSuchElementException::class.java) {
            dealService.getDeal(dealId)
        }
    }

    @Test
    fun `getAllDeals should return paginated deals`() {
        // Given
        val pageable = PageRequest.of(0, 10)
        val deals = listOf(createTestDeal(), createTestDeal())
        val page = PageImpl(deals, pageable, deals.size.toLong())

        whenever(dealRepository.findAll(pageable)) doReturn page

        // When
        val result = dealService.getAllDeals(pageable)

        // Then
        assertEquals(2, result.content.size)
    }

    @Test
    fun `advanceDeal should progress deal to next status`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.LEAD)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.advanceDeal(testDeal.id)

        // Then
        assertEquals(DealStatus.QUALIFIED, result.status)
        verify(dealRepository).save(any<Deal>())
    }

    @Test
    fun `qualifyDeal should change status from LEAD to QUALIFIED`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.LEAD)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.qualifyDeal(testDeal.id)

        // Then
        assertEquals(DealStatus.QUALIFIED, result.status)
    }

    @Test
    fun `sendProposal should change status from QUALIFIED to PROPOSAL`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.QUALIFIED)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.sendProposal(testDeal.id)

        // Then
        assertEquals(DealStatus.PROPOSAL, result.status)
    }

    @Test
    fun `startNegotiation should change status from PROPOSAL to NEGOTIATION`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.PROPOSAL)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.startNegotiation(testDeal.id)

        // Then
        assertEquals(DealStatus.NEGOTIATION, result.status)
    }

    @Test
    fun `loseDeal should mark deal as lost with reason`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.NEGOTIATION)
        val command = LoseDealCommand(
            reason = LocalizedText(en = "Budget constraints", ar = "قيود الميزانية")
        )
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.loseDeal(testDeal.id, command)

        // Then
        assertEquals(DealStatus.LOST, result.status)
        assertEquals("Budget constraints", result.lostReason?.en)
    }

    @Test
    fun `reopenDeal should change status from LOST to LEAD`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.LOST)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.reopenDeal(testDeal.id)

        // Then
        assertEquals(DealStatus.LEAD, result.status)
    }

    @Test
    fun `reassignDeal should change sales rep`() {
        // Given
        val newSalesRepId = UUID.randomUUID()
        val testDeal = createTestDeal()
        val command = ReassignDealCommand(newSalesRepId = newSalesRepId)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)
        whenever(dealRepository.save(any<Deal>())) doReturn testDeal

        // When
        val result = dealService.reassignDeal(testDeal.id, command)

        // Then
        assertEquals(newSalesRepId, result.salesRepId)
    }

    @Test
    fun `updateDeal should throw when deal is closed`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.WON)
        val command = UpdateDealCommand(
            title = LocalizedText(en = "Updated Title", ar = "عنوان محدث")
        )
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            dealService.updateDeal(testDeal.id, command)
        }
    }

    @Test
    fun `deleteDeal should delete LEAD deals`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.LEAD)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        // When
        dealService.deleteDeal(testDeal.id)

        // Then
        verify(dealRepository).deleteById(testDeal.id)
    }

    @Test
    fun `deleteDeal should throw when deal is not LEAD or LOST`() {
        // Given
        val testDeal = createTestDeal(status = DealStatus.QUALIFIED)
        whenever(dealRepository.findById(testDeal.id)) doReturn Optional.of(testDeal)

        // When/Then
        assertThrows(IllegalArgumentException::class.java) {
            dealService.deleteDeal(testDeal.id)
        }

        verify(dealRepository, never()).deleteById(any())
    }

    private fun createTestDeal(
        id: UUID = UUID.randomUUID(),
        title: LocalizedText = LocalizedText(en = "Test Deal", ar = "صفقة اختبار"),
        source: DealSource = DealSource.WEBSITE,
        status: DealStatus = DealStatus.LEAD,
        salesRepId: UUID = testSalesRepId
    ) = Deal.create(
        title = title,
        source = source,
        contactName = "John Doe",
        contactEmail = "john@example.com",
        salesRepId = salesRepId
    ).apply {
        // Set status via reflection for testing different states
        when (status) {
            DealStatus.QUALIFIED -> this.qualify()
            DealStatus.PROPOSAL -> { this.qualify(); this.sendProposal() }
            DealStatus.NEGOTIATION -> { this.qualify(); this.sendProposal(); this.startNegotiation() }
            DealStatus.WON -> { this.qualify(); this.sendProposal(); this.startNegotiation(); this.win(UUID.randomUUID(), null) }
            DealStatus.LOST -> { this.lose(LocalizedText(en = "Test", ar = "اختبار")) }
            else -> {} // LEAD is default
        }
    }
}
