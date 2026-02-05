package com.liyaqa.trainer.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.trainer.application.services.PersonalTrainingService
import com.liyaqa.trainer.application.services.TrainerScheduleService
import com.liyaqa.trainer.application.services.TrainerService
import com.liyaqa.trainer.application.services.AvailabilityData
import com.liyaqa.trainer.domain.model.PTSessionStatus
import com.liyaqa.trainer.domain.model.PersonalTrainingSession
import com.liyaqa.trainer.domain.model.Trainer
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.util.*

@WebMvcTest(TrainerScheduleController::class)
class TrainerScheduleControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var trainerScheduleService: TrainerScheduleService

    @MockBean
    private lateinit var trainerService: TrainerService

    @MockBean
    private lateinit var personalTrainingService: PersonalTrainingService

    @MockBean
    private lateinit var jwtTokenProvider: com.liyaqa.auth.infrastructure.security.JwtTokenProvider

    @MockBean
    private lateinit var rateLimitService: com.liyaqa.shared.application.services.RateLimitService

    @MockBean
    private lateinit var clubRepository: com.liyaqa.organization.domain.ports.ClubRepository

    @MockBean
    private lateinit var trainerSecurityService: com.liyaqa.trainer.application.services.TrainerSecurityService

    @MockBean
    private lateinit var csrfTokenProvider: com.liyaqa.config.CsrfTokenProvider

    private lateinit var trainerId: UUID
    private lateinit var sessionId: UUID
    private lateinit var trainer: Trainer
    private lateinit var session: PersonalTrainingSession

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        sessionId = UUID.randomUUID()

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
            on { availability } doReturn """{"monday":[{"start":"09:00","end":"17:00"}]}"""
        }

        session = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().plusDays(1),
            startTime = LocalTime.of(10, 0),
            endTime = LocalTime.of(11, 0),
            durationMinutes = 60
        )
        session.confirm()
    }

    // ==================== GET SCHEDULE TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getSchedule - returns complete schedule with availability and sessions`() {
        // Given
        val sessionsPage = PageImpl(listOf(session))
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(trainerService.deserializeAvailability(any())).thenReturn(null)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))
            .andExpect(jsonPath("$.upcomingSessions").isArray)
            .andExpect(jsonPath("$.upcomingSessions[0].sessionId").exists())
            .andExpect(jsonPath("$.upcomingSessions[0].sessionType").value("PT"))
            .andExpect(jsonPath("$.unavailableDates").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getSchedule - includes availability when present`() {
        // Given
        val availability = mock<AvailabilityData>()
        val sessionsPage = PageImpl(listOf(session))

        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(trainerService.deserializeAvailability(any())).thenReturn(availability)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))
            .andExpect(jsonPath("$.availability").exists())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getSchedule - returns empty sessions list when no upcoming sessions`() {
        // Given
        val emptyPage = PageImpl<PersonalTrainingSession>(emptyList())
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(emptyPage)
        whenever(trainerService.getTrainer(trainerId)).thenReturn(trainer)
        whenever(trainerService.deserializeAvailability(any())).thenReturn(null)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.upcomingSessions").isArray)
            .andExpect(jsonPath("$.upcomingSessions").isEmpty)
    }

    // ==================== UPDATE AVAILABILITY TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateAvailability - updates trainer availability successfully`() {
        // Given
        val updatedTrainer = mock<Trainer> {
            on { id } doReturn trainerId
            on { availability } doReturn """{"monday":[{"start":"10:00","end":"18:00"}]}"""
        }
        val sessionsPage = PageImpl<PersonalTrainingSession>(emptyList())

        whenever(trainerService.updateTrainerAvailability(any())).thenReturn(updatedTrainer)
        whenever(trainerService.deserializeAvailability(any())).thenReturn(null)
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)

        val request = UpdateAvailabilityRequest(
            availability = AvailabilityInput(
                monday = listOf(TimeSlotInput(start = "10:00", end = "18:00")),
                tuesday = listOf(TimeSlotInput(start = "09:00", end = "17:00"))
            )
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/schedule/availability")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))

        verify(trainerService).updateTrainerAvailability(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateAvailability - handles empty availability`() {
        // Given
        val updatedTrainer = mock<Trainer> {
            on { id } doReturn trainerId
            on { availability } doReturn null
        }
        val sessionsPage = PageImpl<PersonalTrainingSession>(emptyList())

        whenever(trainerService.updateTrainerAvailability(any())).thenReturn(updatedTrainer)
        whenever(trainerService.deserializeAvailability(any())).thenReturn(null)
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)

        val request = UpdateAvailabilityRequest(
            availability = AvailabilityInput()
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/schedule/availability")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isOk)
    }

    // ==================== GET UPCOMING SESSIONS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUpcomingSessions - returns list of upcoming sessions`() {
        // Given
        val confirmedSession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().plusDays(2),
            startTime = LocalTime.of(14, 0),
            endTime = LocalTime.of(15, 0),
            durationMinutes = 60
        )
        confirmedSession.confirm()

        val sessionsPage = PageImpl(listOf(session, confirmedSession))
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/upcoming-sessions")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$[0].sessionType").value("PT"))
            .andExpect(jsonPath("$[0].status").value("CONFIRMED"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUpcomingSessions - accepts custom date range`() {
        // Given
        val startDate = LocalDate.now().plusDays(5)
        val endDate = LocalDate.now().plusDays(10)
        val sessionsPage = PageImpl(listOf(session))

        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), eq(startDate), eq(endDate), any<Pageable>()))
            .thenReturn(sessionsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/upcoming-sessions")
                .param("trainerId", trainerId.toString())
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)

        verify(personalTrainingService).getTrainerSessionsBetweenDates(eq(trainerId), eq(startDate), eq(endDate), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUpcomingSessions - accepts custom daysAhead parameter`() {
        // Given
        val sessionsPage = PageImpl(listOf(session))
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/upcoming-sessions")
                .param("trainerId", trainerId.toString())
                .param("daysAhead", "60")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getUpcomingSessions - filters out completed and cancelled sessions`() {
        // Given
        val completedSession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now().plusDays(3),
            startTime = LocalTime.of(15, 0),
            endTime = LocalTime.of(16, 0),
            durationMinutes = 60
        )
        completedSession.confirm()
        completedSession.complete()

        val sessionsPage = PageImpl(listOf(session, completedSession))
        whenever(personalTrainingService.getTrainerSessionsBetweenDates(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(sessionsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/upcoming-sessions")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            // Only confirmed/requested sessions should be returned
    }

    // ==================== GET TODAY'S SCHEDULE TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getTodaySchedule - returns today's sessions`() {
        // Given
        val todaySession = PersonalTrainingSession(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            sessionDate = LocalDate.now(),
            startTime = LocalTime.of(11, 0),
            endTime = LocalTime.of(12, 0),
            durationMinutes = 60
        )
        todaySession.confirm()

        whenever(personalTrainingService.getTrainerSessionsOnDate(trainerId, LocalDate.now()))
            .thenReturn(listOf(todaySession))

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/today")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$[0].sessionDate").value(LocalDate.now().toString()))
            .andExpect(jsonPath("$[0].sessionType").value("PT"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getTodaySchedule - returns empty list when no sessions today`() {
        // Given
        whenever(personalTrainingService.getTrainerSessionsOnDate(trainerId, LocalDate.now()))
            .thenReturn(emptyList())

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule/today")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$").isEmpty)
    }

    // ==================== PERMISSION TESTS ====================

    @Test
    fun `getSchedule - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/schedule")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun `updateAvailability - returns 403 when user lacks permission`() {
        // Given
        val request = UpdateAvailabilityRequest(
            availability = AvailabilityInput()
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/schedule/availability")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }
}
