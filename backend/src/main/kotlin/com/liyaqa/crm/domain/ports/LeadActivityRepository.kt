package com.liyaqa.crm.domain.ports

import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for lead activity persistence operations.
 */
interface LeadActivityRepository {
    fun save(activity: LeadActivity): LeadActivity
    fun findById(id: UUID): Optional<LeadActivity>
    fun findByLeadId(leadId: UUID, pageable: Pageable): Page<LeadActivity>
    fun findByLeadIdOrderByCreatedAtDesc(leadId: UUID): List<LeadActivity>
    fun deleteById(id: UUID)
    fun deleteByLeadId(leadId: UUID)
    fun count(): Long
    fun countByLeadId(leadId: UUID): Long

    // Activity type queries
    fun findByType(type: LeadActivityType, pageable: Pageable): Page<LeadActivity>
    fun countByType(type: LeadActivityType): Long

    // Follow-up queries
    fun findPendingFollowUps(pageable: Pageable): Page<LeadActivity>
    fun findOverdueFollowUps(asOfDate: LocalDate, pageable: Pageable): Page<LeadActivity>
    fun findFollowUpsByDateRange(startDate: LocalDate, endDate: LocalDate, pageable: Pageable): Page<LeadActivity>
    fun countPendingFollowUps(): Long
    fun countOverdueFollowUps(asOfDate: LocalDate): Long

    // User queries
    fun findByPerformedByUserId(userId: UUID, pageable: Pageable): Page<LeadActivity>
    fun countByPerformedByUserId(userId: UUID): Long

    // Recent activities for dashboard
    fun findRecentActivities(limit: Int): List<LeadActivity>

    /**
     * Find activities for multiple leads in a single query.
     */
    fun findByLeadIdIn(leadIds: List<UUID>): List<LeadActivity>

    /**
     * Find pending follow-ups due before a specific date/time (for reminder jobs).
     * Returns activities where followUpDate is not null, not completed,
     * and due on or before the given date.
     */
    fun findPendingFollowUpsDueBefore(beforeDate: LocalDate, pageable: Pageable): Page<LeadActivity>
}
