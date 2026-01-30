package com.liyaqa.trainer.application.services

import com.liyaqa.scheduling.domain.ports.ClassSessionRepository
import com.liyaqa.shared.domain.Money
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
import java.util.UUID

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrainerDashboardServiceTest {

    @Mock
    private lateinit var trainerRepository: TrainerRepository

    @Mock
    private lateinit var ptSessionRepository: PersonalTrainingSessionRepository

    @Mock
    private lateinit var classSessionRepository: ClassSessionRepository

    @Mock
    private lateinit var clientRepository: TrainerClientRepository

    @Mock
    private lateinit var earningsRepository: TrainerEarningsRepository

    @Mock
    private lateinit var notificationRepository: TrainerNotificationRepository

    private lateinit var dashboardService: TrainerDashboardService

    private lateinit var testTrainerId: UUID
    private lateinit var testPTSession: PersonalTrainingSession
    private lateinit var testClient: TrainerClient
    private lateinit var testEarning: TrainerEarnings

    @BeforeEach
    fun setUp() {
        dashboardService = TrainerDashboardService(
            trainerRepository,
            ptSessionRepository,
            classSessionRepository,
            clientRepository,
            earningsRepository,
            notificationRepository
        )

        testTrainerId = UUID.randomUUID()

        testPTSession = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.CONFIRMED
        }

        testClient = TrainerClient(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now().minusDays(30),
            status = TrainerClientStatus.ACTIVE
        )

        testEarning = TrainerEarnings(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            earningType = EarningType.PT_SESSION,
            sessionId = UUID.randomUUID(),
            earningDate = LocalDate.now(),
            amount = Money(BigDecimal("100.00"), "SAR"),
            netAmount = Money(BigDecimal("100.00"), "SAR"),
            status = EarningStatus.PENDING
        )
    }

    // ==================== COMPLETE DASHBOARD ====================

    @Test
    fun `getDashboard aggregates all metrics successfully`() {
        // Mock upcoming sessions
        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(listOf(testPTSession), PageRequest.of(0, 100), 1))
        whenever(ptSessionRepository.findPendingByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 20), 0))
        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 100), 0))

        // Mock today's schedule
        whenever(ptSessionRepository.findByTrainerIdAndSessionDate(testTrainerId, LocalDate.now()))
            .thenReturn(listOf(testPTSession))

        // Mock session stats
        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(listOf(testPTSession), PageRequest.of(0, 1000), 1))

        // Mock earnings stats
        whenever(earningsRepository.findByTrainerIdAndEarningDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(listOf(testEarning), PageRequest.of(0, 1000), 1))
        whenever(earningsRepository.calculateTotalEarnings(any(), any()))
            .thenReturn(BigDecimal("1000.00"))

        // Mock client stats
        whenever(clientRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(listOf(testClient), PageRequest.of(0, 1000), 1))

        // Mock recent activity
        whenever(ptSessionRepository.findByTrainerIdAndStatus(any(), any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 10), 0))
        whenever(earningsRepository.findByTrainerIdAndStatus(any(), any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 5), 0))

        // Mock unread notifications
        whenever(notificationRepository.countUnreadByTrainerId(testTrainerId))
            .thenReturn(3L)

        val result = dashboardService.getDashboard(testTrainerId)

        assertNotNull(result)
        assertEquals(testTrainerId, result.trainerId)
        assertNotNull(result.upcomingSessions)
        assertNotNull(result.todaySchedule)
        assertNotNull(result.sessionStats)
        assertNotNull(result.earningsStats)
        assertNotNull(result.clientStats)
        assertEquals(3L, result.unreadNotifications)
    }

    // ==================== UPCOMING SESSIONS ====================

    @Test
    fun `getUpcomingSessionsSummary returns correct counts`() {
        val upcomingPT = listOf(testPTSession)

        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(upcomingPT, PageRequest.of(0, 100), 1))
        whenever(ptSessionRepository.findPendingByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 20), 0))
        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 100), 0))

        val result = dashboardService.getUpcomingSessionsSummary(testTrainerId)

        assertEquals(1, result.totalPTSessions)
        assertEquals(0, result.totalClassSessions)
        assertEquals(0, result.pendingRequests)
    }

    @Test
    fun `getTodaySchedule returns sessions for today`() {
        whenever(ptSessionRepository.findByTrainerIdAndSessionDate(testTrainerId, LocalDate.now()))
            .thenReturn(listOf(testPTSession))
        whenever(classSessionRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 20), 0))

        val result = dashboardService.getTodaySchedule(testTrainerId)

        assertEquals(1, result.size)
        assertEquals("PT_SESSION", result[0].type)
    }

    // ==================== SESSION STATISTICS ====================

    @Test
    fun `getSessionStats calculates statistics correctly`() {
        val completedSession = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.COMPLETED
        }

        val sessions = listOf(testPTSession, completedSession)

        whenever(ptSessionRepository.findByTrainerIdAndSessionDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(sessions, PageRequest.of(0, 1000), 2))

        val result = dashboardService.getSessionStats(
            testTrainerId,
            LocalDate.now().minusDays(30),
            LocalDate.now()
        )

        assertEquals(2, result.total)
        assertEquals(1, result.completed)
        assertEquals(1, result.confirmed)
        assertEquals(50.0, result.completionRate)
    }

    // ==================== EARNINGS STATISTICS ====================

    @Test
    fun `getEarningsStats aggregates earnings by status`() {
        val approvedEarning = TrainerEarnings(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            earningType = EarningType.PT_SESSION,
            sessionId = UUID.randomUUID(),
            earningDate = LocalDate.now(),
            amount = Money(BigDecimal("150.00"), "SAR"),
            netAmount = Money(BigDecimal("150.00"), "SAR"),
            status = EarningStatus.APPROVED
        )

        val earnings = listOf(testEarning, approvedEarning)

        whenever(earningsRepository.findByTrainerIdAndEarningDateBetween(any(), any(), any(), any()))
            .thenReturn(PageImpl(earnings, PageRequest.of(0, 1000), 2))
        whenever(earningsRepository.calculateTotalEarnings(any(), any()))
            .thenReturn(BigDecimal("5000.00"))

        val result = dashboardService.getEarningsStats(
            testTrainerId,
            LocalDate.now().minusDays(30),
            LocalDate.now()
        )

        assertEquals(BigDecimal("100.00"), result.pendingAmount)
        assertEquals(BigDecimal("150.00"), result.approvedAmount)
        assertEquals(BigDecimal("5000.00"), result.lifetimeTotal)
        assertEquals("SAR", result.currency)
    }

    @Test
    fun `getPendingEarningsSummary returns pending and approved totals`() {
        val pendingEarnings = listOf(testEarning)

        whenever(earningsRepository.findPendingPaymentByTrainerId(any(), any()))
            .thenReturn(PageImpl(pendingEarnings, PageRequest.of(0, 100), 1))

        val result = dashboardService.getPendingEarningsSummary(testTrainerId)

        assertEquals(BigDecimal("100.00"), result.totalAmount)
        assertEquals(1, result.pendingCount)
        assertEquals(0, result.approvedCount)
    }

    // ==================== CLIENT STATISTICS ====================

    @Test
    fun `getClientStats returns correct counts by status`() {
        val activeClient = TrainerClient(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now(),
            status = TrainerClientStatus.ACTIVE
        )

        val inactiveClient = TrainerClient(
            id = UUID.randomUUID(),
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(6),
            status = TrainerClientStatus.INACTIVE
        )

        val clients = listOf(activeClient, inactiveClient)

        whenever(clientRepository.findByTrainerId(any(), any()))
            .thenReturn(PageImpl(clients, PageRequest.of(0, 1000), 2))

        val result = dashboardService.getClientStats(testTrainerId)

        assertEquals(2, result.total)
        assertEquals(1, result.active)
        assertEquals(1, result.inactive)
        assertEquals(0, result.onHold)
        assertEquals(0, result.completed)
    }

    // ==================== RECENT ACTIVITY ====================

    @Test
    fun `getRecentActivity returns sorted activity items`() {
        val completedSession = PersonalTrainingSession.create(
            trainerId = testTrainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().minusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        ).apply {
            this.status = PTSessionStatus.COMPLETED
        }

        whenever(ptSessionRepository.findByTrainerIdAndStatus(
            testTrainerId, PTSessionStatus.COMPLETED, PageRequest.of(0, 10)
        )).thenReturn(PageImpl(listOf(completedSession), PageRequest.of(0, 10), 1))

        whenever(earningsRepository.findByTrainerIdAndStatus(
            testTrainerId, EarningStatus.APPROVED, PageRequest.of(0, 5)
        )).thenReturn(PageImpl(emptyList(), PageRequest.of(0, 5), 0))

        whenever(clientRepository.findByTrainerId(testTrainerId, PageRequest.of(0, 5)))
            .thenReturn(PageImpl(emptyList(), PageRequest.of(0, 5), 0))

        val result = dashboardService.getRecentActivity(testTrainerId, 10)

        assertTrue(result.isNotEmpty())
        assertEquals("SESSION_COMPLETED", result[0].type)
    }
}
