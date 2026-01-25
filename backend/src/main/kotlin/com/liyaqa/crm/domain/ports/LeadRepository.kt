package com.liyaqa.crm.domain.ports

import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for lead persistence operations.
 * This is a domain-level abstraction - implementations are in the infrastructure layer.
 */
interface LeadRepository {
    fun save(lead: Lead): Lead
    fun findById(id: UUID): Optional<Lead>
    fun findByEmail(email: String): Optional<Lead>
    fun findAll(pageable: Pageable): Page<Lead>
    fun existsById(id: UUID): Boolean
    fun existsByEmail(email: String): Boolean
    fun deleteById(id: UUID)
    fun count(): Long

    // Status queries
    fun countByStatus(status: LeadStatus): Long
    fun findByStatus(status: LeadStatus, pageable: Pageable): Page<Lead>

    // Source queries
    fun countBySource(source: LeadSource): Long
    fun findBySource(source: LeadSource, pageable: Pageable): Page<Lead>

    // Assignment queries
    fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<Lead>
    fun countByAssignedToUserId(userId: UUID): Long
    fun findUnassigned(pageable: Pageable): Page<Lead>

    // Pipeline statistics
    fun countByStatusIn(statuses: List<LeadStatus>): Long
    fun findActiveLeads(pageable: Pageable): Page<Lead>

    /**
     * Search leads with various filters.
     */
    fun search(
        search: String?,
        status: LeadStatus?,
        source: LeadSource?,
        assignedToUserId: UUID?,
        createdAfter: LocalDate?,
        createdBefore: LocalDate?,
        pageable: Pageable
    ): Page<Lead>

    /**
     * Find all leads by a list of IDs in a single query.
     */
    fun findAllByIds(ids: List<UUID>): List<Lead>

    /**
     * Get leads that need follow-up (have follow-up activities scheduled).
     */
    fun findLeadsNeedingFollowUp(beforeDate: LocalDate, pageable: Pageable): Page<Lead>

    /**
     * Get recently contacted leads for dashboard.
     */
    fun findRecentlyContacted(limit: Int): List<Lead>

    /**
     * Get leads that were converted within a date range.
     */
    fun findConvertedBetween(startDate: LocalDate, endDate: LocalDate): List<Lead>
}
