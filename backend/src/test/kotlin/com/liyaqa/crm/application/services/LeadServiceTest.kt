package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.CreateLeadCommand
import com.liyaqa.crm.application.commands.UpdateLeadCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadPriority
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import com.liyaqa.crm.domain.ports.LeadRepository
import com.liyaqa.webhook.application.services.WebhookEventPublisher
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import java.time.LocalDate
import java.util.*

@ExtendWith(MockitoExtension::class)
class LeadServiceTest {

    @Mock
    private lateinit var leadRepository: LeadRepository

    @Mock
    private lateinit var leadActivityRepository: LeadActivityRepository

    @Mock
    private lateinit var webhookPublisher: WebhookEventPublisher

    @Mock
    private lateinit var scoringService: LeadScoringService

    @Mock
    private lateinit var assignmentService: LeadAssignmentService

    @InjectMocks
    private lateinit var leadService: LeadService

    @Test
    fun `createLead should create new lead successfully`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN,
            priority = LeadPriority.MEDIUM,
            notes = "Interested in membership"
        )

        val expectedLead = Lead(
            id = UUID.randomUUID(),
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            priority = command.priority,
            notes = command.notes
        )

        given(leadRepository.existsByEmail(command.email)).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(expectedLead)
        given(scoringService.applySourceScoring(any())).willReturn(10)
        given(assignmentService.autoAssign(any(), anyOrNull())).willReturn(UUID.randomUUID())

        // When
        val result = leadService.createLead(command)

        // Then
        assertThat(result).isNotNull
        assertThat(result.name).isEqualTo(command.name)
        assertThat(result.email).isEqualTo(command.email)
        assertThat(result.source).isEqualTo(command.source)

        verify(leadRepository).existsByEmail(command.email)
        verify(leadRepository).save(any<Lead>())
        verify(scoringService).applySourceScoring(any())
        verify(assignmentService).autoAssign(any(), anyOrNull())
        verify(webhookPublisher).publishLeadCreated(
            leadId = any(),
            tenantId = any(),
            payload = any()
        )
    }

    @Test
    fun `createLead should throw exception when email already exists`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "existing@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        given(leadRepository.existsByEmail(command.email)).willReturn(true)

        // When & Then
        val exception = assertThrows<IllegalArgumentException> {
            leadService.createLead(command)
        }

        assertThat(exception.message).contains("already exists")
        verify(leadRepository).existsByEmail(command.email)
        verify(leadRepository, never()).save(any<Lead>())
    }

    @Test
    fun `createLead should apply source scoring`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.REFERRAL // High-value source
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            id = UUID.randomUUID()
        ).apply {
            score = 85 // Score applied by scoring service
        }

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)
        doAnswer {
            val lead = it.arguments[0] as Lead
            lead.score = 85 // Simulate scoring
        }.whenever(scoringService).applySourceScoring(any())

        // When
        leadService.createLead(command)

        // Then
        verify(scoringService).applySourceScoring(any())
    }

    @Test
    fun `createLead should auto-assign when no assignee specified`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN,
            assignedToUserId = null // No assignee
        )

        val autoAssignedUserId = UUID.randomUUID()
        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            id = UUID.randomUUID()
        ).apply {
            assignedToUserId = autoAssignedUserId
        }

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)
        given(scoringService.applySourceScoring(any())).willReturn(10)
        given(assignmentService.autoAssign(any(), anyOrNull())).willReturn(autoAssignedUserId)

        // When
        val result = leadService.createLead(command)

        // Then
        verify(assignmentService).autoAssign(any(), anyOrNull())
        assertThat(result.assignedToUserId).isEqualTo(autoAssignedUserId)
    }

    @Test
    fun `createLead should not auto-assign when assignee already specified`() {
        // Given
        val assignedUserId = UUID.randomUUID()
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN,
            assignedToUserId = assignedUserId // Assignee already specified
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            assignedToUserId = assignedUserId,
            id = UUID.randomUUID()
        )

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)
        given(scoringService.applySourceScoring(any())).willReturn(10)

        // When
        leadService.createLead(command)

        // Then
        verify(assignmentService, never()).autoAssign(any(), anyOrNull())
    }

    @Test
    fun `createLead should publish webhook event`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.REFERRAL
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            id = UUID.randomUUID()
        ).apply {
            score = 75
        }

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)

        // When
        leadService.createLead(command)

        // Then
        verify(webhookPublisher).publishLeadCreated(
            leadId = eq(savedLead.id),
            tenantId = any(),
            payload = argThat { payload ->
                payload["email"] == savedLead.email &&
                payload["source"] == savedLead.source.name &&
                payload["score"] == savedLead.score.toString()
            }
        )
    }

    @Test
    fun `createLead should handle scoring service failure gracefully`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            id = UUID.randomUUID()
        )

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)
        doThrow(RuntimeException("Scoring service unavailable"))
            .whenever(scoringService).applySourceScoring(any())

        // When
        val result = leadService.createLead(command)

        // Then - Lead should still be created even if scoring fails
        assertThat(result).isNotNull
        verify(leadRepository).save(any<Lead>())
    }

    @Test
    fun `createLead should handle auto-assignment failure gracefully`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN,
            assignedToUserId = null
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            id = UUID.randomUUID()
        )

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)
        given(scoringService.applySourceScoring(any())).willReturn(10)
        given(assignmentService.autoAssign(any(), anyOrNull())).willThrow(RuntimeException("No available assignees"))

        // When
        val result = leadService.createLead(command)

        // Then - Lead should still be created even if auto-assignment fails
        assertThat(result).isNotNull
        assertThat(result.assignedToUserId).isNull()
        verify(leadRepository).save(any<Lead>())
    }

    @Test
    fun `createLead should store campaign tracking information`() {
        // Given
        val command = CreateLeadCommand(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WEBSITE,
            campaignSource = "google",
            campaignMedium = "cpc",
            campaignName = "summer_2026"
        )

        val savedLead = Lead(
            name = command.name,
            email = command.email,
            phone = command.phone,
            source = command.source,
            campaignSource = command.campaignSource,
            campaignMedium = command.campaignMedium,
            campaignName = command.campaignName,
            id = UUID.randomUUID()
        )

        given(leadRepository.existsByEmail(any())).willReturn(false)
        given(leadRepository.save(any<Lead>())).willReturn(savedLead)

        // When
        val result = leadService.createLead(command)

        // Then
        assertThat(result.campaignSource).isEqualTo("google")
        assertThat(result.campaignMedium).isEqualTo("cpc")
        assertThat(result.campaignName).isEqualTo("summer_2026")
    }
}
