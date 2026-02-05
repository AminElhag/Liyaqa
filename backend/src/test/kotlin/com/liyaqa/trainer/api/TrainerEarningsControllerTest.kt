package com.liyaqa.trainer.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.shared.domain.Money
import com.liyaqa.trainer.application.services.TrainerEarningsService
import com.liyaqa.trainer.domain.model.EarningStatus
import com.liyaqa.trainer.domain.model.EarningType
import com.liyaqa.trainer.domain.model.TrainerEarnings
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerEarningsRepository
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
import java.util.*

@WebMvcTest(TrainerEarningsController::class)
class TrainerEarningsControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var trainerEarningsService: TrainerEarningsService

    @MockBean
    private lateinit var trainerEarningsRepository: JpaTrainerEarningsRepository

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
    private lateinit var earningId: UUID
    private lateinit var earning: TrainerEarnings

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        earningId = UUID.randomUUID()

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

        earning = TrainerEarnings(
            id = earningId,
            trainerId = trainerId,
            earningType = EarningType.PT_SESSION,
            sessionId = UUID.randomUUID(),
            earningDate = LocalDate.now(),
            amount = Money(java.math.BigDecimal.valueOf(100.0), "SAR"),
            deductions = Money(java.math.BigDecimal.valueOf(10.0), "SAR"),
            netAmount = Money(java.math.BigDecimal.valueOf(90.0), "SAR")
        )
        // createdAt and updatedAt are set automatically
    }

    // ==================== LIST EARNINGS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarnings - returns paginated list of earnings`() {
        // Given
        val earningsPage = PageImpl(listOf(earning))
        whenever(trainerEarningsService.getEarningsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(earningsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings")
                .param("trainerId", trainerId.toString())
                .param("page", "0")
                .param("size", "20")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content[0].id").value(earningId.toString()))
            .andExpect(jsonPath("$.content[0].earningType").value("PT_SESSION"))
            .andExpect(jsonPath("$.content[0].status").value("PENDING"))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").isNumber)
            .andExpect(jsonPath("$.totalElements").isNumber)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarnings - filters by status`() {
        // Given
        val earningsPage = PageImpl(listOf(earning))
        whenever(trainerEarningsService.getEarningsByStatus(eq(trainerId), eq(EarningStatus.PENDING), any<Pageable>()))
            .thenReturn(earningsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings")
                .param("trainerId", trainerId.toString())
                .param("status", "PENDING")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].status").value("PENDING"))

        verify(trainerEarningsService).getEarningsByStatus(eq(trainerId), eq(EarningStatus.PENDING), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarnings - filters by date range`() {
        // Given
        val startDate = LocalDate.now().minusDays(30)
        val endDate = LocalDate.now()
        val earningsPage = PageImpl(listOf(earning))
        whenever(trainerEarningsService.getEarningsByDateRange(eq(trainerId), eq(startDate), eq(endDate), any<Pageable>()))
            .thenReturn(earningsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings")
                .param("trainerId", trainerId.toString())
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)

        verify(trainerEarningsService).getEarningsByDateRange(eq(trainerId), eq(startDate), eq(endDate), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarnings - returns empty list when no earnings`() {
        // Given
        val emptyPage = PageImpl<TrainerEarnings>(emptyList())
        whenever(trainerEarningsService.getEarningsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(emptyPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content").isEmpty)
    }

    // ==================== GET EARNING BY ID TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarning - returns earning details`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId)).thenReturn(earning)

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/earnings/$earningId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(earningId.toString()))
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))
            .andExpect(jsonPath("$.earningType").value("PT_SESSION"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarning - returns 404 when not found`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId))
            .thenThrow(NoSuchElementException("Earning not found"))

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/earnings/$earningId"))
            .andExpect(status().isNotFound)
    }

    // ==================== EARNINGS SUMMARY TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarningsSummary - returns comprehensive summary`() {
        // Given
        val earnings = listOf(
            earning,
            TrainerEarnings(
                trainerId = trainerId,
                earningType = EarningType.GROUP_CLASS,
                earningDate = LocalDate.now().minusDays(5),
                amount = Money(java.math.BigDecimal.valueOf(200.0), "SAR"),
                netAmount = Money(java.math.BigDecimal.valueOf(180.0), "SAR")
            ).apply {
                approve()
            }
        )
        val earningsPage = PageImpl(earnings)
        whenever(trainerEarningsService.getEarningsByDateRange(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(earningsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings/summary")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalEarnings").exists())
            .andExpect(jsonPath("$.totalEarnings.amount").isNumber)
            .andExpect(jsonPath("$.totalEarnings.currency").value("SAR"))
            .andExpect(jsonPath("$.pendingEarnings").exists())
            .andExpect(jsonPath("$.approvedEarnings").exists())
            .andExpect(jsonPath("$.paidEarnings").exists())
            .andExpect(jsonPath("$.currentMonthEarnings").exists())
            .andExpect(jsonPath("$.lastMonthEarnings").exists())
            .andExpect(jsonPath("$.earningsByType").exists())
            .andExpect(jsonPath("$.recentEarnings").isArray)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getEarningsSummary - accepts custom date range`() {
        // Given
        val startDate = LocalDate.now().minusMonths(6)
        val endDate = LocalDate.now()
        val earningsPage = PageImpl(listOf(earning))
        whenever(trainerEarningsService.getEarningsByDateRange(eq(trainerId), any(), any(), any<Pageable>()))
            .thenReturn(earningsPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings/summary")
                .param("trainerId", trainerId.toString())
                .param("startDate", startDate.toString())
                .param("endDate", endDate.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalEarnings").exists())
    }

    // ==================== UPDATE EARNING STATUS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_earnings_manage"])
    fun `updateEarningStatus - approves earning`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId)).thenReturn(earning)
        whenever(trainerEarningsRepository.save(any())).thenReturn(earning)

        val request = UpdateEarningStatusRequest(status = EarningStatus.APPROVED)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/earnings/$earningId/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(earningId.toString()))

        verify(trainerEarningsRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_earnings_manage"])
    fun `updateEarningStatus - marks as paid with payment date`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId)).thenReturn(earning)
        whenever(trainerEarningsRepository.save(any())).thenReturn(earning)

        val paymentDate = LocalDate.now()
        val request = UpdateEarningStatusRequest(
            status = EarningStatus.PAID,
            paymentDate = paymentDate,
            notes = "Payment processed"
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/earnings/$earningId/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isOk)

        verify(trainerEarningsRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_earnings_manage"])
    fun `updateEarningStatus - marks as disputed`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId)).thenReturn(earning)
        whenever(trainerEarningsRepository.save(any())).thenReturn(earning)

        val request = UpdateEarningStatusRequest(status = EarningStatus.DISPUTED)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/earnings/$earningId/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isOk)

        verify(trainerEarningsRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_earnings_manage"])
    fun `updateEarningStatus - returns 404 when earning not found`() {
        // Given
        whenever(trainerEarningsService.getEarning(earningId))
            .thenThrow(NoSuchElementException("Earning not found"))

        val request = UpdateEarningStatusRequest(status = EarningStatus.APPROVED)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/earnings/$earningId/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isNotFound)

        verify(trainerEarningsRepository, never()).save(any())
    }

    @Test
    fun `updateEarningStatus - returns 403 when user lacks permission`() {
        // Given
        val request = UpdateEarningStatusRequest(status = EarningStatus.APPROVED)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/earnings/$earningId/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun `getEarnings - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/earnings")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isUnauthorized)
    }
}
