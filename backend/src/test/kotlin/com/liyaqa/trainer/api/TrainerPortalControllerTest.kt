package com.liyaqa.trainer.api

import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.services.*
import com.liyaqa.trainer.domain.model.*
import com.liyaqa.trainer.domain.ports.TrainerRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@WebMvcTest(TrainerPortalController::class)
class TrainerPortalControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var trainerService: TrainerService

    @MockBean
    private lateinit var trainerRepository: TrainerRepository

    @MockBean
    private lateinit var trainerDashboardService: TrainerDashboardService

    @MockBean
    private lateinit var trainerClientService: TrainerClientService

    @MockBean
    private lateinit var trainerEarningsService: TrainerEarningsService

    @MockBean
    private lateinit var trainerNotificationService: TrainerNotificationService

    @MockBean
    private lateinit var personalTrainingService: PersonalTrainingService

    @MockBean
    private lateinit var userRepository: UserRepository

    @MockBean
    private lateinit var jwtTokenProvider: com.liyaqa.auth.infrastructure.security.JwtTokenProvider

    @MockBean
    private lateinit var rateLimitService: com.liyaqa.shared.application.services.RateLimitService

    @MockBean
    private lateinit var clubRepository: com.liyaqa.organization.domain.ports.ClubRepository

    @MockBean
    private lateinit var trainerSecurityService: com.liyaqa.trainer.application.services.TrainerSecurityService

    private lateinit var trainerId: UUID
    private lateinit var userId: UUID
    private lateinit var trainer: Trainer
    private lateinit var user: User

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        userId = UUID.randomUUID()

        // Mock rate limit service to allow all requests
        whenever(rateLimitService.checkAndIncrement(any(), any(), any())).thenReturn(
            RateLimitResult(
                allowed = true,
                currentCount = 1,
                limit = 100,
                windowStart = Instant.now(),
                remaining = 99
            )
        )

        trainer = mock {
            on { id } doReturn trainerId
            on { this.userId } doReturn userId
            on { status } doReturn TrainerStatus.ACTIVE
            on { profileImageUrl } doReturn "https://example.com/profile.jpg"
            on { trainerType } doReturn TrainerType.PERSONAL_TRAINER
            on { specializations } doReturn """["Fitness","Yoga"]"""
            on { displayName } doReturn LocalizedText("John Trainer", "جون مدرب")
        }

        user = mock {
            on { this.displayName } doReturn LocalizedText("John Trainer", "جون مدرب")
        }
    }

    // ==================== DASHBOARD TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - returns complete aggregated dashboard`() {
        // Given
        setupBasicMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))
            .andExpect(jsonPath("$.overview").exists())
            .andExpect(jsonPath("$.overview.trainerName").value("John Trainer"))
            .andExpect(jsonPath("$.overview.trainerStatus").value("ACTIVE"))
            .andExpect(jsonPath("$.overview.trainerType").value("PERSONAL_TRAINER"))
            .andExpect(jsonPath("$.overview.specializations").isArray)
            .andExpect(jsonPath("$.earnings").exists())
            .andExpect(jsonPath("$.schedule").exists())
            .andExpect(jsonPath("$.clients").exists())
            .andExpect(jsonPath("$.notifications").exists())

        verify(trainerService).getTrainer(trainerId)
        verify(trainerEarningsService, atLeastOnce()).getEarningsByDateRange(eq(trainerId), any(), any(), any())
        verify(trainerClientService).getClientsForTrainer(eq(trainerId), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - includes earnings summary with all metrics`() {
        // Given
        setupBasicMocks()
        setupEarningsMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.earnings.totalEarnings").exists())
            .andExpect(jsonPath("$.earnings.totalEarnings.amount").isNumber)
            .andExpect(jsonPath("$.earnings.totalEarnings.currency").value("SAR"))
            .andExpect(jsonPath("$.earnings.pendingEarnings").exists())
            .andExpect(jsonPath("$.earnings.approvedEarnings").exists())
            .andExpect(jsonPath("$.earnings.paidEarnings").exists())
            .andExpect(jsonPath("$.earnings.currentMonthEarnings").exists())
            .andExpect(jsonPath("$.earnings.lastMonthEarnings").exists())
            .andExpect(jsonPath("$.earnings.earningsByType").exists())
            .andExpect(jsonPath("$.earnings.recentEarnings").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - includes schedule summary with session counts`() {
        // Given
        setupBasicMocks()
        setupScheduleMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.schedule.todaysSessions").isNumber)
            .andExpect(jsonPath("$.schedule.upcomingSessions").isNumber)
            .andExpect(jsonPath("$.schedule.completedThisMonth").isNumber)
            .andExpect(jsonPath("$.schedule.nextSession").exists())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - includes clients summary with counts`() {
        // Given
        setupBasicMocks()
        setupClientsMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.clients.totalClients").value(3))
            .andExpect(jsonPath("$.clients.activeClients").value(2))
            .andExpect(jsonPath("$.clients.newThisMonth").value(1))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - includes notifications summary with unread count`() {
        // Given
        setupBasicMocks()
        setupNotificationsMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.notifications.unreadCount").isNumber)
            .andExpect(jsonPath("$.notifications.totalCount").isNumber)
            .andExpect(jsonPath("$.notifications.recent").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - handles empty earnings data`() {
        // Given
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(userRepository.findById(userId)).thenReturn(Optional.of(user))
        whenever(trainerService.deserializeSpecializations(any())).thenReturn(listOf("Fitness", "Yoga"))

        // Empty earnings
        val emptyEarningsPage = PageImpl<TrainerEarnings>(emptyList())
        whenever(trainerEarningsService.getEarningsByDateRange(eq(trainerId), any(), any(), any()))
            .thenReturn(emptyEarningsPage)

        setupScheduleMocks()
        setupClientsMocks()
        setupNotificationsMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.earnings.totalEarnings.amount").value(0.0))
            .andExpect(jsonPath("$.earnings.recentEarnings").isEmpty)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - handles empty clients data`() {
        // Given
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(userRepository.findById(userId)).thenReturn(Optional.of(user))
        whenever(trainerService.deserializeSpecializations(any())).thenReturn(listOf("Fitness", "Yoga"))

        setupEarningsMocks()
        setupScheduleMocks()
        setupNotificationsMocks()

        // Empty clients
        val emptyClientsPage = PageImpl<TrainerClient>(emptyList())
        whenever(trainerClientService.getClientsForTrainer(eq(trainerId), any()))
            .thenReturn(emptyClientsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.clients.totalClients").value(0))
            .andExpect(jsonPath("$.clients.activeClients").value(0))
            .andExpect(jsonPath("$.clients.newThisMonth").value(0))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - handles trainer without user profile`() {
        // Given
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(userRepository.findById(userId)).thenReturn(Optional.empty())
        whenever(trainerService.deserializeSpecializations(any())).thenReturn(listOf("Fitness"))

        setupEarningsMocks()
        setupScheduleMocks()
        setupClientsMocks()
        setupNotificationsMocks()

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.overview.trainerName").value("John Trainer"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getDashboard - returns 404 when trainer not found`() {
        // Given
        whenever(trainerService.getTrainer(trainerId))
            .thenThrow(NoSuchElementException("Trainer not found"))

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isNotFound)
    }

    @Test
    fun `getDashboard - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/dashboard")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isUnauthorized)
    }

    // ==================== HELPER METHODS ====================

    private fun setupBasicMocks() {
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(userRepository.findById(userId)).thenReturn(Optional.of(user))
        whenever(trainerService.deserializeSpecializations(any())).thenReturn(listOf("Fitness", "Yoga"))

        setupEarningsMocks()
        setupScheduleMocks()
        setupClientsMocks()
        setupNotificationsMocks()
    }

    private fun setupEarningsMocks() {
        val earning1 = TrainerEarnings(
            trainerId = trainerId,
            earningType = EarningType.PT_SESSION,
            earningDate = LocalDate.now().minusDays(5),
            amount = Money(java.math.BigDecimal.valueOf(100.0), "SAR"),
            netAmount = Money(java.math.BigDecimal.valueOf(90.0), "SAR")
        )
        // createdAt and updatedAt are set automatically

        val earning2 = TrainerEarnings(
            trainerId = trainerId,
            earningType = EarningType.GROUP_CLASS,
            earningDate = LocalDate.now().minusDays(10),
            amount = Money(java.math.BigDecimal.valueOf(200.0), "SAR"),
            netAmount = Money(java.math.BigDecimal.valueOf(180.0), "SAR")
        )
        earning2.approve()
        // createdAt and updatedAt are set automatically

        val earningsPage = PageImpl(listOf(earning1, earning2))
        whenever(trainerEarningsService.getEarningsByDateRange(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(earningsPage)
    }

    private fun setupScheduleMocks() {
        val todaySession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        )
        todaySession.confirm()

        val upcomingSession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().plusDays(2),
            startTime = LocalTime.of(14, 0),
            endTime = LocalTime.of(15, 0),
            durationMinutes = 60
        )
        upcomingSession.confirm()

        val completedSession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().minusDays(5),
            startTime = LocalTime.of(9, 0),
            endTime = LocalTime.of(10, 0),
            durationMinutes = 60
        )
        completedSession.confirm()
        completedSession.complete()

        whenever(personalTrainingService.getTrainerSessionsOnDate(trainerId, LocalDate.now()))
            .thenReturn(listOf(todaySession))

        val upcomingPage = PageImpl(listOf(todaySession, upcomingSession))
        val completedPage = PageImpl(listOf(completedSession))

        whenever(personalTrainingService.getTrainerSessionsBetweenDates(
            eq(trainerId),
            argThat { this >= LocalDate.now() },
            argThat { this > LocalDate.now() },
            any<Pageable>()
        )).thenReturn(upcomingPage)

        whenever(personalTrainingService.getTrainerSessionsBetweenDates(
            eq(trainerId),
            argThat { this < LocalDate.now() },
            eq(LocalDate.now()),
            any<Pageable>()
        )).thenReturn(completedPage)
    }

    private fun setupClientsMocks() {
        val activeClient1 = TrainerClient(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(3),
            status = TrainerClientStatus.ACTIVE
        )

        val activeClient2 = TrainerClient(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now().minusDays(10), // New this month
            status = TrainerClientStatus.ACTIVE
        )

        val inactiveClient = TrainerClient(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now().minusMonths(6),
            status = TrainerClientStatus.INACTIVE
        )

        val clientsPage = PageImpl(listOf(activeClient1, activeClient2, inactiveClient))
        whenever(trainerClientService.getClientsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(clientsPage)
    }

    private fun setupNotificationsMocks() {
        val unreadNotification = TrainerNotification(
            trainerId = trainerId,
            notificationType = NotificationType.PT_REQUEST,
            titleEn = "New Booking",
            titleAr = "حجز جديد"
        )
        // createdAt is set automatically

        val readNotification = TrainerNotification(
            trainerId = trainerId,
            notificationType = NotificationType.EARNINGS_PAID,
            titleEn = "Earning Processed",
            titleAr = "تمت معالجة الأرباح"
        )
        readNotification.markAsRead()
        // createdAt is set automatically

        val unreadPage = PageImpl(listOf(unreadNotification))
        val allNotificationsPage = PageImpl(listOf(unreadNotification, readNotification))

        whenever(trainerNotificationService.getUnreadNotifications(eq(trainerId), any<Pageable>()))
            .thenReturn(unreadPage)

        whenever(trainerNotificationService.getNotificationsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(allNotificationsPage)
    }
}
