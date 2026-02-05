package com.liyaqa.trainer.application.services

import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.commands.*
import com.liyaqa.trainer.domain.model.*
import com.liyaqa.trainer.domain.ports.*
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.*
import org.mockito.quality.Strictness
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalTime
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerEarningsServiceTest {

    @Mock
    private lateinit var earningsRepository: TrainerEarningsRepository

    @Mock
    private lateinit var trainerRepository: TrainerRepository

    @Mock
    private lateinit var ptSessionRepository: PersonalTrainingSessionRepository

    @Mock
    private lateinit var notificationService: TrainerNotificationService

    private lateinit var earningsService: TrainerEarningsService

    private lateinit var testTrainer: Trainer
    private lateinit var testPTSession: PersonalTrainingSession
    private lateinit var testEarning: TrainerEarnings

    @BeforeEach
    fun setUp() {
        earningsService = TrainerEarningsService(
            earningsRepository,
            trainerRepository,
            ptSessionRepository,
            notificationService
        )

        testTrainer = Trainer(
            id = UUID.randomUUID(),
            userId = UUID.randomUUID(),
            hourlyRate = BigDecimal("50.00"),
            ptSessionRate = BigDecimal("100.00"),
            compensationModel = CompensationModel.PER_SESSION
        )

        testPTSession = PersonalTrainingSession.create(
            trainerId = testTrainer.id,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60,
            price = BigDecimal("100.00")
        )
        testPTSession.confirm()
        testPTSession.complete("Great session!")

        testEarning = TrainerEarnings(
            id = UUID.randomUUID(),
            trainerId = testTrainer.id,
            earningType = EarningType.PT_SESSION,
            sessionId = testPTSession.id,
            earningDate = LocalDate.now(),
            amount = Money(BigDecimal("100.00"), "SAR"),
            netAmount = Money(BigDecimal("100.00"), "SAR"),
            status = EarningStatus.PENDING
        )
    }

    // ==================== AUTO-CREATION ====================

    @Test
    fun `autoCreateEarningForPTSession creates earning successfully`() {
        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.empty())
        whenever(ptSessionRepository.findById(testPTSession.id)).thenReturn(Optional.of(testPTSession))
        whenever(trainerRepository.findById(testTrainer.id)).thenReturn(Optional.of(testTrainer))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.autoCreateEarningForPTSession(testPTSession.id)

        assertEquals(testTrainer.id, result.trainerId)
        assertEquals(EarningType.PT_SESSION, result.earningType)
        assertEquals(testPTSession.id, result.sessionId)
        assertEquals(EarningStatus.PENDING, result.status)
        verify(earningsRepository).save(any())
    }

    @Test
    fun `autoCreateEarningForPTSession throws exception when duplicate exists`() {
        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.of(testEarning))

        assertThrows(IllegalStateException::class.java) {
            earningsService.autoCreateEarningForPTSession(testPTSession.id)
        }

        verify(earningsRepository, never()).save(any())
    }

    @Test
    fun `autoCreateEarningForPTSession throws exception when session not found`() {
        whenever(earningsRepository.findBySessionId(any())).thenReturn(Optional.empty())
        whenever(ptSessionRepository.findById(any())).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            earningsService.autoCreateEarningForPTSession(UUID.randomUUID())
        }
    }

    @Test
    fun `autoCreateEarningForPTSession calculates HOURLY compensation correctly`() {
        testTrainer.compensationModel = CompensationModel.HOURLY
        testTrainer.hourlyRate = BigDecimal("50.00")

        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.empty())
        whenever(ptSessionRepository.findById(testPTSession.id)).thenReturn(Optional.of(testPTSession))
        whenever(trainerRepository.findById(testTrainer.id)).thenReturn(Optional.of(testTrainer))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.autoCreateEarningForPTSession(testPTSession.id)

        assertEquals(BigDecimal("50.00"), result.amount.amount) // 1 hour × 50
    }

    @Test
    fun `autoCreateEarningForPTSession calculates PER_SESSION compensation correctly`() {
        testTrainer.compensationModel = CompensationModel.PER_SESSION
        testTrainer.ptSessionRate = BigDecimal("100.00")

        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.empty())
        whenever(ptSessionRepository.findById(testPTSession.id)).thenReturn(Optional.of(testPTSession))
        whenever(trainerRepository.findById(testTrainer.id)).thenReturn(Optional.of(testTrainer))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.autoCreateEarningForPTSession(testPTSession.id)

        assertEquals(BigDecimal("100.00"), result.amount.amount)
    }

    @Test
    fun `autoCreateEarningForPTSession calculates REVENUE_SHARE compensation correctly`() {
        testTrainer.compensationModel = CompensationModel.REVENUE_SHARE
        testPTSession.price = BigDecimal("100.00")

        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.empty())
        whenever(ptSessionRepository.findById(testPTSession.id)).thenReturn(Optional.of(testPTSession))
        whenever(trainerRepository.findById(testTrainer.id)).thenReturn(Optional.of(testTrainer))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.autoCreateEarningForPTSession(testPTSession.id)

        assertEquals(BigDecimal("70.00"), result.amount.amount) // 70% of 100
    }

    @Test
    fun `autoCreateEarningForClassSession creates earning successfully`() {
        val sessionId = UUID.randomUUID()
        val sessionDate = LocalDate.now()

        whenever(earningsRepository.findBySessionId(sessionId)).thenReturn(Optional.empty())
        whenever(trainerRepository.findById(testTrainer.id)).thenReturn(Optional.of(testTrainer))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.autoCreateEarningForClassSession(
            sessionId = sessionId,
            trainerId = testTrainer.id,
            sessionDate = sessionDate,
            durationMinutes = 60,
            attendeeCount = 10,
            pricePerAttendee = Money(BigDecimal("20.00"), "SAR")
        )

        assertEquals(testTrainer.id, result.trainerId)
        assertEquals(EarningType.GROUP_CLASS, result.earningType)
        assertEquals(sessionId, result.sessionId)
        verify(earningsRepository).save(any())
    }

    // ==================== APPROVAL WORKFLOW ====================

    @Test
    fun `approveEarning changes status to APPROVED and sends notification`() {
        val command = ApproveEarningCommand(earningId = testEarning.id)

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }
        whenever(notificationService.notifyEarningsApproved(any(), any(), any(), any())).thenReturn(mock())

        val result = earningsService.approveEarning(command)

        assertEquals(EarningStatus.APPROVED, result.status)
        verify(earningsRepository).save(any())
        verify(notificationService).notifyEarningsApproved(any(), any(), any(), any())
    }

    @Test
    fun `approveEarning throws exception when earning is not PENDING`() {
        testEarning.status = EarningStatus.PAID

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))

        assertThrows(IllegalArgumentException::class.java) {
            earningsService.approveEarning(ApproveEarningCommand(testEarning.id))
        }
    }

    @Test
    fun `markAsPaid changes status to PAID and sends notification`() {
        testEarning.status = EarningStatus.APPROVED
        val command = MarkAsPaidCommand(
            earningId = testEarning.id,
            paymentDate = LocalDate.now(),
            paymentReference = "PAY-12345"
        )

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }
        whenever(notificationService.notifyEarningsPaid(any(), any(), any(), any())).thenReturn(mock())

        val result = earningsService.markAsPaid(command)

        assertEquals(EarningStatus.PAID, result.status)
        assertEquals("PAY-12345", result.paymentReference)
        assertNotNull(result.paymentDate)
        verify(earningsRepository).save(any())
        verify(notificationService).notifyEarningsPaid(any(), any(), any(), any())
    }

    @Test
    fun `markAsPaid throws exception when earning is not APPROVED`() {
        testEarning.status = EarningStatus.PENDING

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))

        assertThrows(IllegalArgumentException::class.java) {
            earningsService.markAsPaid(MarkAsPaidCommand(testEarning.id, LocalDate.now(), "PAY-123"))
        }
    }

    @Test
    fun `disputeEarning changes status to DISPUTED`() {
        val command = DisputeEarningCommand(
            earningId = testEarning.id,
            reason = "Amount is incorrect"
        )

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.disputeEarning(command)

        assertEquals(EarningStatus.DISPUTED, result.status)
        assertTrue(result.notes!!.contains("Amount is incorrect"))
        verify(earningsRepository).save(any())
    }

    @Test
    fun `resolveDispute with approval changes status to APPROVED`() {
        testEarning.status = EarningStatus.DISPUTED
        val command = ResolveDisputeCommand(
            earningId = testEarning.id,
            approved = true,
            resolution = "Verified amount is correct"
        )

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.resolveDispute(command)

        assertEquals(EarningStatus.APPROVED, result.status)
        assertTrue(result.notes!!.contains("Verified amount is correct"))
        verify(earningsRepository).save(any())
    }

    @Test
    fun `resolveDispute without approval changes status to PENDING`() {
        testEarning.status = EarningStatus.DISPUTED
        val command = ResolveDisputeCommand(
            earningId = testEarning.id,
            approved = false
        )

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.resolveDispute(command)

        assertEquals(EarningStatus.PENDING, result.status)
        verify(earningsRepository).save(any())
    }

    // ==================== UPDATE OPERATIONS ====================

    @Test
    fun `updateNotes updates notes field`() {
        val command = UpdateEarningNotesCommand(
            earningId = testEarning.id,
            notes = "Updated notes"
        )

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.updateNotes(command)

        assertEquals("Updated notes", result.notes)
        verify(earningsRepository).save(any())
    }

    @Test
    fun `updateDeductions recalculates net amount`() {
        val deductions = Money(BigDecimal("10.00"), "SAR")

        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))
        whenever(earningsRepository.save(any())).thenAnswer { it.arguments[0] as TrainerEarnings }

        val result = earningsService.updateDeductions(testEarning.id, deductions)

        assertEquals(BigDecimal("90.00"), result.netAmount.amount)
        assertEquals(BigDecimal("10.00"), result.deductions!!.amount)
        verify(earningsRepository).save(any())
    }

    // ==================== QUERY OPERATIONS ====================

    @Test
    fun `getEarning returns earning by id`() {
        whenever(earningsRepository.findById(testEarning.id)).thenReturn(Optional.of(testEarning))

        val result = earningsService.getEarning(testEarning.id)

        assertEquals(testEarning.id, result.id)
    }

    @Test
    fun `getEarning throws exception when not found`() {
        whenever(earningsRepository.findById(any())).thenReturn(Optional.empty())

        assertThrows(NoSuchElementException::class.java) {
            earningsService.getEarning(UUID.randomUUID())
        }
    }

    @Test
    fun `getEarningsForTrainer returns paginated earnings`() {
        val earnings = listOf(testEarning)
        val page = PageImpl(earnings, PageRequest.of(0, 10), 1)

        whenever(earningsRepository.findByTrainerId(testTrainer.id, PageRequest.of(0, 10)))
            .thenReturn(page)

        val result = earningsService.getEarningsForTrainer(testTrainer.id, PageRequest.of(0, 10))

        assertEquals(1, result.totalElements)
        assertEquals(testEarning.id, result.content[0].id)
    }

    @Test
    fun `calculateTotalEarnings returns sum of earnings`() {
        whenever(earningsRepository.calculateTotalEarnings(testTrainer.id, EarningStatus.PAID))
            .thenReturn(BigDecimal("500.00"))

        val result = earningsService.calculateTotalEarnings(testTrainer.id, EarningStatus.PAID)

        assertEquals(BigDecimal("500.00"), result)
    }

    @Test
    fun `getEarningBySessionId returns earning when found`() {
        whenever(earningsRepository.findBySessionId(testPTSession.id)).thenReturn(Optional.of(testEarning))

        val result = earningsService.getEarningBySessionId(testPTSession.id)

        assertNotNull(result)
        assertEquals(testEarning.id, result!!.id)
    }

    @Test
    fun `getEarningBySessionId returns null when not found`() {
        whenever(earningsRepository.findBySessionId(any())).thenReturn(Optional.empty())

        val result = earningsService.getEarningBySessionId(UUID.randomUUID())

        assertNull(result)
    }

    @Test
    fun `deleteEarning deletes earning successfully`() {
        whenever(earningsRepository.existsById(testEarning.id)).thenReturn(true)

        earningsService.deleteEarning(testEarning.id)

        verify(earningsRepository).deleteById(testEarning.id)
    }

    @Test
    fun `deleteEarning throws exception when earning not found`() {
        whenever(earningsRepository.existsById(any())).thenReturn(false)

        assertThrows(IllegalArgumentException::class.java) {
            earningsService.deleteEarning(UUID.randomUUID())
        }
    }
}
