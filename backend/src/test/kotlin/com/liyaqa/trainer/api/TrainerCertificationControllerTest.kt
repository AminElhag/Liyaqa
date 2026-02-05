package com.liyaqa.trainer.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.shared.application.services.RateLimitResult
import com.liyaqa.trainer.domain.model.CertificationStatus
import com.liyaqa.trainer.domain.model.TrainerCertification
import com.liyaqa.trainer.domain.ports.TrainerRepository
import com.liyaqa.trainer.infrastructure.persistence.JpaTrainerCertificationRepository
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.mockito.kotlin.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.MediaType
import org.springframework.security.test.context.support.WithMockUser
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import java.time.Instant
import java.time.LocalDate
import java.util.*

@WebMvcTest(TrainerCertificationController::class)
class TrainerCertificationControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var certificationRepository: JpaTrainerCertificationRepository

    @MockBean
    private lateinit var trainerRepository: TrainerRepository

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
    private lateinit var certId: UUID
    private lateinit var certification: TrainerCertification

    @BeforeEach
    fun setUp() {
        trainerId = UUID.randomUUID()
        certId = UUID.randomUUID()

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

        certification = TrainerCertification(
            id = certId,
            trainerId = trainerId,
            nameEn = "CPR Certified",
            nameAr = "شهادة الإنعاش القلبي الرئوي",
            issuingOrganization = "Red Cross",
            issuedDate = LocalDate.of(2024, 1, 15),
            expiryDate = LocalDate.of(2026, 1, 15),
            certificateNumber = "CPR-12345",
            certificateFileUrl = "https://example.com/cert.pdf"
        )
        // createdAt and updatedAt are set automatically
    }

    // ==================== CREATE TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `createCertification - success with valid request`() {
        // Given
        val trainer = mock<com.liyaqa.trainer.domain.model.Trainer> {
            on { organizationId } doReturn UUID.randomUUID()
            on { tenantId } doReturn UUID.randomUUID()
        }
        whenever(trainerRepository.findById(trainerId)).thenReturn(Optional.of(trainer))
        whenever(certificationRepository.save(any())).thenReturn(certification)

        val request = CreateCertificationRequest(
            nameEn = "CPR Certified",
            nameAr = "شهادة الإنعاش القلبي الرئوي",
            issuingOrganization = "Red Cross",
            issuedDate = LocalDate.of(2024, 1, 15),
            expiryDate = LocalDate.of(2026, 1, 15),
            certificateNumber = "CPR-12345",
            certificateFileUrl = "https://example.com/cert.pdf"
        )

        // When & Then
        mockMvc.perform(
            post("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isCreated)
            .andExpect(jsonPath("$.id").value(certId.toString()))
            .andExpect(jsonPath("$.nameEn").value("CPR Certified"))
            .andExpect(jsonPath("$.nameAr").value("شهادة الإنعاش القلبي الرئوي"))
            .andExpect(jsonPath("$.issuingOrganization").value("Red Cross"))
            .andExpect(jsonPath("$.status").value("ACTIVE"))

        verify(certificationRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `createCertification - returns 404 when trainer not found`() {
        // Given
        whenever(trainerRepository.findById(trainerId)).thenReturn(Optional.empty())

        val request = CreateCertificationRequest(
            nameEn = "CPR Certified",
            nameAr = "شهادة الإنعاش",
            issuingOrganization = "Red Cross"
        )

        // When & Then
        mockMvc.perform(
            post("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isNotFound)

        verify(certificationRepository, never()).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `createCertification - returns 400 when validation fails`() {
        // Given - missing required field nameEn
        val invalidRequest = mapOf(
            "nameAr" to "test",
            "issuingOrganization" to "Org"
        )

        // When & Then
        mockMvc.perform(
            post("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest))
                .with(csrf())
        )
            .andExpect(status().isBadRequest)

        verify(certificationRepository, never()).save(any())
    }

    @Test
    fun `createCertification - returns 403 when user lacks permission`() {
        // Given
        val request = CreateCertificationRequest(
            nameEn = "CPR Certified",
            nameAr = "شهادة الإنعاش",
            issuingOrganization = "Red Cross"
        )

        // When & Then
        mockMvc.perform(
            post("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }

    // ==================== LIST TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getCertifications - returns list of certifications`() {
        // Given
        val certPage = PageImpl(listOf(certification))
        whenever(certificationRepository.findByTrainerId(eq(trainerId), any<PageRequest>()))
            .thenReturn(certPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$[0].id").value(certId.toString()))
            .andExpect(jsonPath("$[0].nameEn").value("CPR Certified"))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getCertifications - returns empty list when no certifications`() {
        // Given
        val emptyPage = PageImpl<TrainerCertification>(emptyList())
        whenever(certificationRepository.findByTrainerId(eq(trainerId), any<PageRequest>()))
            .thenReturn(emptyPage)

        // When & Then
        mockMvc.perform(
            get("/api/trainer-portal/certifications")
                .param("trainerId", trainerId.toString())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$").isArray)
            .andExpect(jsonPath("$").isEmpty)
    }

    // ==================== GET BY ID TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getCertification - returns certification by id`() {
        // Given
        whenever(certificationRepository.findById(certId)).thenReturn(Optional.of(certification))

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/certifications/$certId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(certId.toString()))
            .andExpect(jsonPath("$.nameEn").value("CPR Certified"))
            .andExpect(jsonPath("$.isVerified").value(false))
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_view"])
    fun `getCertification - returns 404 when not found`() {
        // Given
        whenever(certificationRepository.findById(certId)).thenReturn(Optional.empty())

        // When & Then
        mockMvc.perform(get("/api/trainer-portal/certifications/$certId"))
            .andExpect(status().isNotFound)
    }

    // ==================== UPDATE TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateCertification - updates and returns certification`() {
        // Given
        whenever(certificationRepository.findById(certId)).thenReturn(Optional.of(certification))
        whenever(certificationRepository.save(any())).thenReturn(certification)

        val updateRequest = UpdateCertificationRequest(
            nameEn = "CPR Certified - Advanced",
            expiryDate = LocalDate.of(2027, 1, 15)
        )

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/certifications/$certId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(certId.toString()))

        verify(certificationRepository).save(any())
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `updateCertification - returns 404 when not found`() {
        // Given
        whenever(certificationRepository.findById(certId)).thenReturn(Optional.empty())

        val updateRequest = UpdateCertificationRequest(nameEn = "Updated")

        // When & Then
        mockMvc.perform(
            put("/api/trainer-portal/certifications/$certId")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest))
                .with(csrf())
        )
            .andExpect(status().isNotFound)

        verify(certificationRepository, never()).save(any())
    }

    // ==================== DELETE TESTS ====================

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `deleteCertification - deletes and returns 204`() {
        // Given
        whenever(certificationRepository.existsById(certId)).thenReturn(true)

        // When & Then
        mockMvc.perform(
            delete("/api/trainer-portal/certifications/$certId")
                .with(csrf())
        )
            .andExpect(status().isNoContent)

        verify(certificationRepository).deleteById(certId)
    }

    @Test
    @WithMockUser(authorities = ["trainer_portal_update"])
    fun `deleteCertification - returns 404 when not found`() {
        // Given
        whenever(certificationRepository.existsById(certId)).thenReturn(false)

        // When & Then
        mockMvc.perform(
            delete("/api/trainer-portal/certifications/$certId")
                .with(csrf())
        )
            .andExpect(status().isNotFound)

        verify(certificationRepository, never()).deleteById(any())
    }

    @Test
    fun `deleteCertification - returns 403 when user lacks permission`() {
        // When & Then
        mockMvc.perform(
            delete("/api/trainer-portal/certifications/$certId")
                .with(csrf())
        )
            .andExpect(status().isUnauthorized)
    }
}
