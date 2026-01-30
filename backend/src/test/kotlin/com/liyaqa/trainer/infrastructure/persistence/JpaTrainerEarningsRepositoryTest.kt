package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.shared.domain.TenantId
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.EarningType
import com.liyaqa.trainer.domain.model.TrainerEarnings
import com.liyaqa.trainer.domain.ports.TrainerEarningsRepository
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
 * Integration tests for JpaTrainerEarningsRepository.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JpaTrainerEarningsRepositoryTest {

    @Autowired
    private lateinit var earningsRepository: TrainerEarningsRepository

    private lateinit var testTenantId: UUID
    private lateinit var testTrainerId: UUID

    @BeforeEach
    fun setUp() {
        testTenantId = UUID.randomUUID()
        testTrainerId = UUID.randomUUID()
        TenantContext.setCurrentTenant(TenantId(testTenantId))
    }

    @AfterEach
    fun tearDown() {
        TenantContext.clear()
    }

    private fun createTestEarning(
        trainerId: UUID = testTrainerId,
        earningType: EarningType = EarningType.PT_SESSION,
        sessionId: UUID? = UUID.randomUUID(),
        earningDate: LocalDate = LocalDate.now(),
        amount: BigDecimal = BigDecimal("100.00"),
        status: EarningStatus = EarningStatus.PENDING
    ): TrainerEarnings {
        val earning = TrainerEarnings(
            id = UUID.randomUUID(),
            trainerId = trainerId,
            earningType = earningType,
            sessionId = sessionId,
            earningDate = earningDate,
            amount = Money(amount, "SAR"),
            netAmount = Money(amount, "SAR"),
            status = status
        )
        earning.javaClass.superclass.getDeclaredField("tenantId").apply {
            isAccessible = true
            set(earning, testTenantId)
        }
        return earning
    }

    @Test
    fun `save new earning persists to database`() {
        val earning = createTestEarning()
        val savedEarning = earningsRepository.save(earning)

        val foundEarning = earningsRepository.findById(savedEarning.id)
        assertTrue(foundEarning.isPresent)
        assertEquals(earning.trainerId, foundEarning.get().trainerId)
        assertEquals(earning.amount.amount, foundEarning.get().amount.amount)
        assertNotNull(foundEarning.get().createdAt)
    }

    @Test
    fun `findByTrainerId returns all earnings for trainer`() {
        val earning1 = createTestEarning()
        val earning2 = createTestEarning()
        val earning3 = createTestEarning(trainerId = UUID.randomUUID()) // Different trainer

        earningsRepository.save(earning1)
        earningsRepository.save(earning2)
        earningsRepository.save(earning3)

        val earnings = earningsRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, earnings.totalElements)
    }

    @Test
    fun `findByTrainerIdAndStatus filters by status correctly`() {
        val pendingEarning = createTestEarning(status = EarningStatus.PENDING)
        val approvedEarning = createTestEarning(status = EarningStatus.APPROVED)
        val paidEarning = createTestEarning(status = EarningStatus.PAID)

        earningsRepository.save(pendingEarning)
        earningsRepository.save(approvedEarning)
        earningsRepository.save(paidEarning)

        val pendingEarnings = earningsRepository.findByTrainerIdAndStatus(
            testTrainerId,
            EarningStatus.PENDING,
            PageRequest.of(0, 10)
        )
        assertEquals(1, pendingEarnings.totalElements)
        assertEquals(EarningStatus.PENDING, pendingEarnings.content[0].status)
    }

    @Test
    fun `findByTrainerIdAndEarningDateBetween filters by date range`() {
        val startDate = LocalDate.now().minusDays(10)
        val endDate = LocalDate.now()

        val earning1 = createTestEarning(earningDate = LocalDate.now().minusDays(5))
        val earning2 = createTestEarning(earningDate = LocalDate.now().minusDays(3))
        val earning3 = createTestEarning(earningDate = LocalDate.now().minusDays(20)) // Outside range

        earningsRepository.save(earning1)
        earningsRepository.save(earning2)
        earningsRepository.save(earning3)

        val earnings = earningsRepository.findByTrainerIdAndEarningDateBetween(
            testTrainerId,
            startDate,
            endDate,
            PageRequest.of(0, 10)
        )
        assertEquals(2, earnings.totalElements)
    }

    @Test
    fun `findPendingPaymentByTrainerId returns pending and approved earnings`() {
        val pendingEarning = createTestEarning(status = EarningStatus.PENDING)
        val approvedEarning = createTestEarning(status = EarningStatus.APPROVED)
        val paidEarning = createTestEarning(status = EarningStatus.PAID)

        earningsRepository.save(pendingEarning)
        earningsRepository.save(approvedEarning)
        earningsRepository.save(paidEarning)

        val pendingPayments = earningsRepository.findPendingPaymentByTrainerId(testTrainerId, PageRequest.of(0, 10))
        assertEquals(2, pendingPayments.totalElements)
        assertTrue(pendingPayments.content.all { it.status == EarningStatus.PENDING || it.status == EarningStatus.APPROVED })
    }

    @Test
    fun `findBySessionId returns earning for session`() {
        val sessionId = UUID.randomUUID()
        val earning = createTestEarning(sessionId = sessionId)
        earningsRepository.save(earning)

        val foundEarning = earningsRepository.findBySessionId(sessionId)
        assertTrue(foundEarning.isPresent)
        assertEquals(sessionId, foundEarning.get().sessionId)
    }

    @Test
    fun `findBySessionId returns empty when session has no earning`() {
        val foundEarning = earningsRepository.findBySessionId(UUID.randomUUID())
        assertFalse(foundEarning.isPresent)
    }

    @Test
    fun `calculateTotalEarnings returns sum of net amounts`() {
        val earning1 = createTestEarning(amount = BigDecimal("100.00"), status = EarningStatus.PAID)
        val earning2 = createTestEarning(amount = BigDecimal("150.00"), status = EarningStatus.PAID)
        val earning3 = createTestEarning(amount = BigDecimal("75.00"), status = EarningStatus.PENDING)

        earningsRepository.save(earning1)
        earningsRepository.save(earning2)
        earningsRepository.save(earning3)

        val total = earningsRepository.calculateTotalEarnings(testTrainerId, EarningStatus.PAID)
        assertEquals(BigDecimal("250.00"), total)
    }

    @Test
    fun `calculateTotalEarnings without status filter returns all earnings`() {
        val earning1 = createTestEarning(amount = BigDecimal("100.00"), status = EarningStatus.PAID)
        val earning2 = createTestEarning(amount = BigDecimal("150.00"), status = EarningStatus.PENDING)

        earningsRepository.save(earning1)
        earningsRepository.save(earning2)

        val total = earningsRepository.calculateTotalEarnings(testTrainerId, null)
        assertEquals(BigDecimal("250.00"), total)
    }

    @Test
    fun `findByStatus returns all earnings with specific status`() {
        val trainer1 = UUID.randomUUID()
        val trainer2 = UUID.randomUUID()

        val pending1 = createTestEarning(trainerId = trainer1, status = EarningStatus.PENDING)
        val pending2 = createTestEarning(trainerId = trainer2, status = EarningStatus.PENDING)
        val approved = createTestEarning(trainerId = trainer1, status = EarningStatus.APPROVED)

        earningsRepository.save(pending1)
        earningsRepository.save(pending2)
        earningsRepository.save(approved)

        val pendingEarnings = earningsRepository.findByStatus(EarningStatus.PENDING, PageRequest.of(0, 10))
        assertTrue(pendingEarnings.totalElements >= 2)
    }

    @Test
    fun `update earning status changes status correctly`() {
        val earning = createTestEarning(status = EarningStatus.PENDING)
        earningsRepository.save(earning)

        earning.approve()
        val updatedEarning = earningsRepository.save(earning)

        val foundEarning = earningsRepository.findById(updatedEarning.id).get()
        assertEquals(EarningStatus.APPROVED, foundEarning.status)
    }

    @Test
    fun `delete removes earning from database`() {
        val earning = createTestEarning()
        val savedEarning = earningsRepository.save(earning)

        earningsRepository.deleteById(savedEarning.id)

        val foundEarning = earningsRepository.findById(savedEarning.id)
        assertFalse(foundEarning.isPresent)
    }
}
