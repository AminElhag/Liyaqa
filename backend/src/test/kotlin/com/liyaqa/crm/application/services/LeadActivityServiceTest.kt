package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.LogLeadActivityCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import com.liyaqa.crm.domain.ports.LeadRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.*
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import java.time.LocalDate
import java.util.*

@ExtendWith(MockitoExtension::class)
class LeadActivityServiceTest {

    @Mock
    private lateinit var leadActivityRepository: LeadActivityRepository

    @Mock
    private lateinit var leadRepository: LeadRepository

    @Mock
    private lateinit var scoringService: LeadScoringService

    @InjectMocks
    private lateinit var leadActivityService: LeadActivityService

    @Test
    fun `logActivity should create activity successfully`() {
        // Given
        val leadId = UUID.randomUUID()
        val userId = UUID.randomUUID()

        val lead = Lead(
            id = leadId,
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        val command = LogLeadActivityCommand(
            leadId = leadId,
            type = LeadActivityType.CALL,
            notes = "Discussed membership options",
            performedByUserId = userId
        )

        val savedActivity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes,
            performedByUserId = command.performedByUserId
        ).apply {
            id = UUID.randomUUID()
        }

        given(leadRepository.findById(leadId)).willReturn(Optional.of(lead))
        given(leadActivityRepository.save(any<LeadActivity>())).willReturn(savedActivity)
        given(scoringService.applyActivityScoring(any(), any())).willReturn(5)

        // When
        val result = leadActivityService.logActivity(command)

        // Then
        assertThat(result).isNotNull
        assertThat(result.leadId).isEqualTo(command.leadId)
        assertThat(result.type).isEqualTo(command.type)
        assertThat(result.notes).isEqualTo(command.notes)

        verify(leadRepository).findById(leadId)
        verify(leadActivityRepository).save(any<LeadActivity>())
        verify(scoringService).applyActivityScoring(lead, command.type)
    }

    @Test
    fun `logActivity should throw exception when lead not found`() {
        // Given
        val leadId = UUID.randomUUID()
        val command = LogLeadActivityCommand(
            leadId = leadId,
            type = LeadActivityType.CALL,
            notes = "Some notes"
        )

        given(leadRepository.findById(leadId)).willReturn(Optional.empty())

        // When & Then
        assertThrows<NoSuchElementException> {
            leadActivityService.logActivity(command)
        }

        verify(leadRepository).findById(leadId)
        verify(leadActivityRepository, never()).save(any<LeadActivity>())
    }

    @Test
    fun `logActivity should apply activity scoring`() {
        // Given
        val leadId = UUID.randomUUID()
        val lead = Lead(
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        ).apply {
            id = leadId
            score = 50
        }

        val command = LogLeadActivityCommand(
            leadId = leadId,
            type = LeadActivityType.TOUR, // High-value activity
            notes = "Completed gym tour"
        )

        val savedActivity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes
        ).apply {
            id = UUID.randomUUID()
        }

        given(leadRepository.findById(leadId)).willReturn(Optional.of(lead))
        given(leadActivityRepository.save(any<LeadActivity>())).willReturn(savedActivity)
        given(scoringService.applyActivityScoring(lead, command.type)).willReturn(15) // +15 points

        // When
        leadActivityService.logActivity(command)

        // Then
        verify(scoringService).applyActivityScoring(lead, LeadActivityType.TOUR)
    }

    @Test
    fun `logActivity should handle scoring failure gracefully`() {
        // Given
        val leadId = UUID.randomUUID()
        val lead = Lead(
            id = leadId,
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        val command = LogLeadActivityCommand(
            leadId = leadId,
            type = LeadActivityType.CALL,
            notes = "Phone call"
        )

        val savedActivity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes
        ).apply {
            id = UUID.randomUUID()
        }

        given(leadRepository.findById(leadId)).willReturn(Optional.of(lead))
        given(leadActivityRepository.save(any<LeadActivity>())).willReturn(savedActivity)
        given(scoringService.applyActivityScoring(any(), any()))
            .willThrow(RuntimeException("Scoring service unavailable"))

        // When
        val result = leadActivityService.logActivity(command)

        // Then - Activity should still be saved even if scoring fails
        assertThat(result).isNotNull
        verify(leadActivityRepository).save(any<LeadActivity>())
    }

    @Test
    fun `logActivity should store all activity details`() {
        // Given
        val leadId = UUID.randomUUID()
        val userId = UUID.randomUUID()
        val followUpDate = LocalDate.now().plusDays(7)

        val lead = Lead(
            id = leadId,
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        val command = LogLeadActivityCommand(
            leadId = leadId,
            type = LeadActivityType.CALL,
            notes = "Discussed membership options",
            contactMethod = "PHONE",
            outcome = "Interested - follow up needed",
            followUpDate = followUpDate,
            durationMinutes = 15,
            performedByUserId = userId
        )

        val savedActivity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes,
            contactMethod = command.contactMethod,
            outcome = command.outcome,
            followUpDate = command.followUpDate,
            durationMinutes = command.durationMinutes,
            performedByUserId = command.performedByUserId
        ).apply {
            id = UUID.randomUUID()
        }

        given(leadRepository.findById(leadId)).willReturn(Optional.of(lead))
        given(leadActivityRepository.save(any<LeadActivity>())).willReturn(savedActivity)

        // When
        val result = leadActivityService.logActivity(command)

        // Then
        assertThat(result.contactMethod).isEqualTo("PHONE")
        assertThat(result.outcome).isEqualTo("Interested - follow up needed")
        assertThat(result.followUpDate).isEqualTo(followUpDate)
        assertThat(result.durationMinutes).isEqualTo(15)
        assertThat(result.performedByUserId).isEqualTo(userId)
    }

    @Test
    fun `getActivity should return activity by ID`() {
        // Given
        val activityId = UUID.randomUUID()
        val activity = LeadActivity(
            leadId = UUID.randomUUID(),
            type = LeadActivityType.EMAIL,
            notes = "Sent welcome email"
        ).apply {
            id = activityId
        }

        given(leadActivityRepository.findById(activityId)).willReturn(Optional.of(activity))

        // When
        val result = leadActivityService.getActivity(activityId)

        // Then
        assertThat(result).isEqualTo(activity)
        verify(leadActivityRepository).findById(activityId)
    }

    @Test
    fun `getActivity should throw exception when not found`() {
        // Given
        val activityId = UUID.randomUUID()
        given(leadActivityRepository.findById(activityId)).willReturn(Optional.empty())

        // When & Then
        assertThrows<NoSuchElementException> {
            leadActivityService.getActivity(activityId)
        }
    }

    @Test
    fun `getActivitiesForLead should return paginated activities`() {
        // Given
        val leadId = UUID.randomUUID()
        val pageable = PageRequest.of(0, 10)

        val activities = listOf(
            LeadActivity(
                leadId = leadId,
                type = LeadActivityType.CALL,
                notes = "First call"
            ),
            LeadActivity(
                leadId = leadId,
                type = LeadActivityType.EMAIL,
                notes = "Follow-up email"
            )
        )

        val page = PageImpl(activities, pageable, activities.size.toLong())
        given(leadActivityRepository.findByLeadId(leadId, pageable)).willReturn(page)

        // When
        val result = leadActivityService.getActivitiesForLead(leadId, pageable)

        // Then
        assertThat(result.content).hasSize(2)
        assertThat(result.content).isEqualTo(activities)
        verify(leadActivityRepository).findByLeadId(leadId, pageable)
    }

    @Test
    fun `getActivitiesForLead should return empty page when no activities`() {
        // Given
        val leadId = UUID.randomUUID()
        val pageable = PageRequest.of(0, 10)

        val emptyPage = PageImpl<LeadActivity>(emptyList(), pageable, 0)
        given(leadActivityRepository.findByLeadId(leadId, pageable)).willReturn(emptyPage)

        // When
        val result = leadActivityService.getActivitiesForLead(leadId, pageable)

        // Then
        assertThat(result.content).isEmpty()
        assertThat(result.totalElements).isZero()
    }

    @Test
    fun `logActivity should handle different activity types`() {
        // Given
        val leadId = UUID.randomUUID()
        val lead = Lead(
            id = leadId,
            name = "John Doe",
            email = "john@example.com",
            phone = "+966501234567",
            source = LeadSource.WALK_IN
        )

        given(leadRepository.findById(leadId)).willReturn(Optional.of(lead))
        given(leadActivityRepository.save(any<LeadActivity>())).willAnswer {
            it.arguments[0] as LeadActivity
        }

        val activityTypes = listOf(
            LeadActivityType.CALL,
            LeadActivityType.EMAIL,
            LeadActivityType.SMS,
            LeadActivityType.TOUR,
            LeadActivityType.FOLLOW_UP_SCHEDULED,
            LeadActivityType.MEETING,
            LeadActivityType.NOTE
        )

        // When & Then
        activityTypes.forEach { type ->
            val command = LogLeadActivityCommand(
                leadId = leadId,
                type = type,
                notes = "Testing ${type.name}"
            )

            val result = leadActivityService.logActivity(command)
            assertThat(result.type).isEqualTo(type)
        }

        verify(leadActivityRepository, times(activityTypes.size)).save(any<LeadActivity>())
    }
}
