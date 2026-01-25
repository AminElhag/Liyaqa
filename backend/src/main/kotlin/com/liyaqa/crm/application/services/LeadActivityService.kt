package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.CompleteFollowUpCommand
import com.liyaqa.crm.application.commands.LogLeadActivityCommand
import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import com.liyaqa.crm.domain.ports.LeadRepository
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Lazy
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class LeadActivityService(
    private val leadActivityRepository: LeadActivityRepository,
    private val leadRepository: LeadRepository,
    @Lazy private val scoringService: LeadScoringService
) {
    private val logger = LoggerFactory.getLogger(LeadActivityService::class.java)

    /**
     * Log a new activity for a lead.
     */
    fun logActivity(command: LogLeadActivityCommand): LeadActivity {
        // Verify lead exists and get it for scoring
        val lead = leadRepository.findById(command.leadId)
            .orElseThrow { NoSuchElementException("Lead not found: ${command.leadId}") }

        val activity = LeadActivity(
            leadId = command.leadId,
            type = command.type,
            notes = command.notes,
            contactMethod = command.contactMethod,
            outcome = command.outcome,
            followUpDate = command.followUpDate,
            durationMinutes = command.durationMinutes,
            performedByUserId = command.performedByUserId
        )

        val savedActivity = leadActivityRepository.save(activity)
        logger.info("Logged ${command.type} activity for lead ${command.leadId}")

        // Apply activity-based scoring
        try {
            val scoreChange = scoringService.applyActivityScoring(lead, command.type)
            if (scoreChange != 0) {
                logger.debug("Applied activity scoring to lead ${lead.id}: ${scoreChange} points for ${command.type}")
            }
        } catch (e: Exception) {
            logger.warn("Failed to apply activity scoring: ${e.message}", e)
        }

        return savedActivity
    }

    /**
     * Get activity by ID.
     */
    @Transactional(readOnly = true)
    fun getActivity(id: UUID): LeadActivity {
        return leadActivityRepository.findById(id)
            .orElseThrow { NoSuchElementException("Activity not found: $id") }
    }

    /**
     * Get activities for a lead.
     */
    @Transactional(readOnly = true)
    fun getActivitiesForLead(leadId: UUID, pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findByLeadId(leadId, pageable)
    }

    /**
     * Get all activities for a lead, ordered by most recent.
     */
    @Transactional(readOnly = true)
    fun getAllActivitiesForLead(leadId: UUID): List<LeadActivity> {
        return leadActivityRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
    }

    /**
     * Delete an activity.
     */
    fun deleteActivity(id: UUID) {
        val activity = getActivity(id)
        leadActivityRepository.deleteById(id)
        logger.info("Deleted activity $id for lead ${activity.leadId}")
    }

    /**
     * Complete a follow-up activity.
     */
    fun completeFollowUp(command: CompleteFollowUpCommand): LeadActivity {
        val activity = getActivity(command.activityId)

        activity.completeFollowUp()
        command.outcome?.let { activity.outcome = it }
        command.notes?.let { activity.notes = it }

        val savedActivity = leadActivityRepository.save(activity)
        logger.info("Completed follow-up activity ${command.activityId}")

        return savedActivity
    }

    /**
     * Get pending follow-ups.
     */
    @Transactional(readOnly = true)
    fun getPendingFollowUps(pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findPendingFollowUps(pageable)
    }

    /**
     * Get overdue follow-ups.
     */
    @Transactional(readOnly = true)
    fun getOverdueFollowUps(pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findOverdueFollowUps(LocalDate.now(), pageable)
    }

    /**
     * Get follow-ups for a date range.
     */
    @Transactional(readOnly = true)
    fun getFollowUpsInRange(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findFollowUpsByDateRange(startDate, endDate, pageable)
    }

    /**
     * Get activities by type.
     */
    @Transactional(readOnly = true)
    fun getActivitiesByType(type: LeadActivityType, pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findByType(type, pageable)
    }

    /**
     * Get activities performed by a user.
     */
    @Transactional(readOnly = true)
    fun getActivitiesByUser(userId: UUID, pageable: Pageable): Page<LeadActivity> {
        return leadActivityRepository.findByPerformedByUserId(userId, pageable)
    }

    /**
     * Get recent activities for dashboard.
     */
    @Transactional(readOnly = true)
    fun getRecentActivities(limit: Int): List<LeadActivity> {
        return leadActivityRepository.findRecentActivities(limit)
    }

    /**
     * Get activity statistics.
     */
    @Transactional(readOnly = true)
    fun getActivityStats(): ActivityStats {
        return ActivityStats(
            totalActivities = leadActivityRepository.count(),
            pendingFollowUps = leadActivityRepository.countPendingFollowUps(),
            overdueFollowUps = leadActivityRepository.countOverdueFollowUps(LocalDate.now()),
            activitiesByType = LeadActivityType.entries.associateWith { type ->
                leadActivityRepository.countByType(type)
            }
        )
    }

    /**
     * Get user activity statistics.
     */
    @Transactional(readOnly = true)
    fun getUserActivityCount(userId: UUID): Long {
        return leadActivityRepository.countByPerformedByUserId(userId)
    }

    data class ActivityStats(
        val totalActivities: Long,
        val pendingFollowUps: Long,
        val overdueFollowUps: Long,
        val activitiesByType: Map<LeadActivityType, Long>
    )
}
