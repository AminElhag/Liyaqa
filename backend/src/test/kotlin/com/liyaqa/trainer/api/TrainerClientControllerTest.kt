package com.liyaqa.trainer.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.auth.domain.model.User
import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.domain.model.Member
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.trainer.application.services.TrainerClientService
import com.liyaqa.trainer.domain.model.TrainerClient
import com.liyaqa.trainer.domain.model.TrainerClientStatus
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerClientRepository
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

@WebMvcTest(TrainerClientController::class)
class TrainerClientControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var trainerClientService: TrainerClientService

    @MockBean
    private lateinit var trainerClientRepository: JpaTrainerClientRepository

    @MockBean
    private lateinit var memberRepository: MemberRepository

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
    private lateinit var memberId: UUID
    private lateinit var clientId: UUID
    private lateinit var client: TrainerClient

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        memberId = UUID.randomUUID()
        clientId = UUID.randomUUID()

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

        client = TrainerClient(
            id = clientId,
            trainerId = trainerId,
            memberId = memberId,
            startDate = LocalDate.now().minusMonths(3),
            status = TrainerClientStatus.ACTIVE
        )
        client.completedSessions = 10
        client.cancelledSessions = 2
        client.noShowSessions = 1
    }

    // ==================== LIST CLIENTS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClients - returns paginated list of clients`() {
        // Given
        val clientPage = PageImpl(listOf(client))
        whenever(trainerClientService.getClientsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(clientPage)

        val member = mock<Member> {
            on { email } doReturn "member@test.com"
            on { phone } doReturn "+1234567890"
            on { firstName } doReturn LocalizedText("John", "جون")
            on { lastName } doReturn LocalizedText("Doe", "دو")
        }
        whenever(memberRepository.findById(memberId)).thenReturn(Optional.of(member))
        whenever(userRepository.findById(any())).thenReturn(Optional.empty())

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/clients")
                .param("trainerId", trainerId.toString())
                .param("page", "0")
                .param("size", "20")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content[0].id").value(clientId.toString()))
            .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))
            .andExpect(jsonPath("$.content[0].completedSessions").value(10))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").isNumber)
            .andExpect(jsonPath("$.totalElements").isNumber)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClients - filters by status`() {
        // Given
        val clientPage = PageImpl(listOf(client))
        whenever(trainerClientService.getClientsForTrainerByStatus(eq(trainerId), eq(TrainerClientStatus.ACTIVE), any<Pageable>()))
            .thenReturn(clientPage)

        val member = mock<Member>()
        whenever(memberRepository.findById(memberId)).thenReturn(Optional.of(member))

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/clients")
                .param("trainerId", trainerId.toString())
                .param("status", "ACTIVE")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].status").value("ACTIVE"))

        verify(trainerClientService).getClientsForTrainerByStatus(eq(trainerId), eq(TrainerClientStatus.ACTIVE), any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClients - returns empty list when no clients`() {
        // Given
        val emptyPage = PageImpl<TrainerClient>(emptyList())
        whenever(trainerClientService.getClientsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(emptyPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/clients")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content").isArray)
            .andExpect(jsonPath("$.content").isEmpty)
    }

    // ==================== GET CLIENT BY ID TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClient - returns client details`() {
        // Given
        whenever(trainerClientService.getClient(clientId)).thenReturn(client)

        val member = mock<Member> {
            on { email } doReturn "member@test.com"
            on { firstName } doReturn LocalizedText("John", "جون")
            on { lastName } doReturn LocalizedText("Doe", "دو")
        }
        whenever(memberRepository.findById(memberId)).thenReturn(Optional.of(member))

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/clients/$clientId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(clientId.toString()))
            .andExpect(jsonPath("$.trainerId").value(trainerId.toString()))
            .andExpect(jsonPath("$.memberEmail").value("member@test.com"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClient - returns 404 when not found`() {
        // Given
        whenever(trainerClientService.getClient(clientId))
            .thenThrow(NoSuchElementException("Client not found"))

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/clients/$clientId"))
            .andExpect(status().isNotFound)
    }

    // ==================== UPDATE CLIENT TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateClient - updates client and returns updated data`() {
        // Given
        whenever(trainerClientService.getClient(clientId)).thenReturn(client)
        whenever(trainerClientRepository.save(any())).thenReturn(client)

        val member = mock<Member>()
        whenever(memberRepository.findById(memberId)).thenReturn(Optional.of(member))

        val updateRequest = UpdateTrainerClientRequest(
            goalsEn = "Lose 10 kg",
            goalsAr = "فقدان 10 كجم",
            notesEn = "Great progress",
            status = TrainerClientStatus.ACTIVE
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/clients/$clientId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(clientId.toString()))

        verify(trainerClientRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateClient - updates status to inactive`() {
        // Given
        whenever(trainerClientService.getClient(clientId)).thenReturn(client)
        whenever(trainerClientRepository.save(any())).thenReturn(client)

        val member = mock<Member>()
        whenever(memberRepository.findById(memberId)).thenReturn(Optional.of(member))

        val updateRequest = UpdateTrainerClientRequest(status = TrainerClientStatus.INACTIVE)

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/clients/$clientId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isOk)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateClient - returns 404 when not found`() {
        // Given
        whenever(trainerClientService.getClient(clientId))
            .thenThrow(NoSuchElementException("Client not found"))

        val updateRequest = UpdateTrainerClientRequest(goalsEn = "Test")

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/clients/$clientId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isNotFound)

        verify(trainerClientRepository, never()).save(any())
    }

    // ==================== CLIENT STATS TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getClientStats - returns statistics`() {
        // Given
        val activeClient = TrainerClient(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now(),
            status = TrainerClientStatus.ACTIVE
        )
        val inactiveClient = TrainerClient(
            trainerId = trainerId,
            memberId = UUID.randomUUID(),
            startDate = LocalDate.now(),
            status = TrainerClientStatus.INACTIVE
        )

        val clientPage = PageImpl(listOf(client, activeClient, inactiveClient))
        whenever(trainerClientService.getClientsForTrainer(eq(trainerId), any<Pageable>()))
            .thenReturn(clientPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/clients/stats")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.total").value(3))
            .andExpect(jsonPath("$.active").value(2))
            .andExpect(jsonPath("$.inactive").value(1))
            .andExpect(jsonPath("$.onHold").value(0))
            .andExpect(jsonPath("$.completed").value(0))
    }

    @Test
    fun `getClients - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/clients")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun `updateClient - returns 403 when user lacks permission`() {
        // Given
        val updateRequest = UpdateTrainerClientRequest(goalsEn = "Test")

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/clients/$clientId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }
}
