package com.liyaqa.crm.infrastructure.persistence

import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import com.liyaqa.crm.domain.ports.LeadRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for Lead.
 */
interface SpringDataLeadRepository : JpaRepository<Lead, UUID> {
    fun findByEmail(email: String): Optional<Lead>
    fun existsByEmail(email: String): Boolean
    fun countByStatus(status: LeadStatus): Long
    fun countBySource(source: LeadSource): Long
    fun findByStatus(status: LeadStatus, pageable: Pageable): Page<Lead>
    fun findBySource(source: LeadSource, pageable: Pageable): Page<Lead>
    fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<Lead>
    fun countByAssignedToUserId(userId: UUID): Long

    @Query("SELECT l FROM Lead l WHERE l.assignedToUserId IS NULL")
    fun findUnassigned(pageable: Pageable): Page<Lead>

    @Query("SELECT COUNT(l) FROM Lead l WHERE l.status IN :statuses")
    fun countByStatusIn(@Param("statuses") statuses: List<LeadStatus>): Long

    @Query("SELECT l FROM Lead l WHERE l.status NOT IN ('WON', 'LOST')")
    fun findActiveLeads(pageable: Pageable): Page<Lead>

    @Query("""
        SELECT l FROM Lead l
        WHERE (:search IS NULL OR (
            LOWER(l.name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(l.email) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(l.phone) LIKE LOWER(CONCAT('%', :search, '%'))
        ))
        AND (:status IS NULL OR l.status = :status)
        AND (:source IS NULL OR l.source = :source)
        AND (:assignedToUserId IS NULL OR l.assignedToUserId = :assignedToUserId)
        AND (:createdAfter IS NULL OR l.createdAt >= :createdAfter)
        AND (:createdBefore IS NULL OR l.createdAt <= :createdBefore)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: LeadStatus?,
        @Param("source") source: LeadSource?,
        @Param("assignedToUserId") assignedToUserId: UUID?,
        @Param("createdAfter") createdAfter: Instant?,
        @Param("createdBefore") createdBefore: Instant?,
        pageable: Pageable
    ): Page<Lead>

    @Query("""
        SELECT l FROM Lead l WHERE l.status = 'CONTACTED'
        ORDER BY l.contactedAt DESC
    """)
    fun findRecentlyContacted(pageable: Pageable): Page<Lead>

    @Query("""
        SELECT l FROM Lead l
        WHERE l.status = 'WON'
        AND l.wonAt >= :startDate
        AND l.wonAt <= :endDate
    """)
    fun findConvertedBetween(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): List<Lead>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaLeadRepository(
    private val springDataRepository: SpringDataLeadRepository
) : LeadRepository {

    override fun save(lead: Lead): Lead {
        return springDataRepository.save(lead)
    }

    override fun findById(id: UUID): Optional<Lead> {
        return springDataRepository.findById(id)
    }

    override fun findByEmail(email: String): Optional<Lead> {
        return springDataRepository.findByEmail(email)
    }

    override fun findAll(pageable: Pageable): Page<Lead> {
        return springDataRepository.findAll(pageable)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun existsByEmail(email: String): Boolean {
        return springDataRepository.existsByEmail(email)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun countByStatus(status: LeadStatus): Long {
        return springDataRepository.countByStatus(status)
    }

    override fun findByStatus(status: LeadStatus, pageable: Pageable): Page<Lead> {
        return springDataRepository.findByStatus(status, pageable)
    }

    override fun countBySource(source: LeadSource): Long {
        return springDataRepository.countBySource(source)
    }

    override fun findBySource(source: LeadSource, pageable: Pageable): Page<Lead> {
        return springDataRepository.findBySource(source, pageable)
    }

    override fun findByAssignedToUserId(userId: UUID, pageable: Pageable): Page<Lead> {
        return springDataRepository.findByAssignedToUserId(userId, pageable)
    }

    override fun countByAssignedToUserId(userId: UUID): Long {
        return springDataRepository.countByAssignedToUserId(userId)
    }

    override fun findUnassigned(pageable: Pageable): Page<Lead> {
        return springDataRepository.findUnassigned(pageable)
    }

    override fun countByStatusIn(statuses: List<LeadStatus>): Long {
        return springDataRepository.countByStatusIn(statuses)
    }

    override fun findActiveLeads(pageable: Pageable): Page<Lead> {
        return springDataRepository.findActiveLeads(pageable)
    }

    override fun search(
        search: String?,
        status: LeadStatus?,
        source: LeadSource?,
        assignedToUserId: UUID?,
        createdAfter: LocalDate?,
        createdBefore: LocalDate?,
        pageable: Pageable
    ): Page<Lead> {
        val createdAfterInstant = createdAfter?.atStartOfDay()?.toInstant(ZoneOffset.UTC)
        val createdBeforeInstant = createdBefore?.plusDays(1)?.atStartOfDay()?.toInstant(ZoneOffset.UTC)

        return springDataRepository.search(
            search = search?.takeIf { it.isNotBlank() },
            status = status,
            source = source,
            assignedToUserId = assignedToUserId,
            createdAfter = createdAfterInstant,
            createdBefore = createdBeforeInstant,
            pageable = pageable
        )
    }

    override fun findAllByIds(ids: List<UUID>): List<Lead> {
        return springDataRepository.findAllById(ids).toList()
    }

    override fun findLeadsNeedingFollowUp(beforeDate: LocalDate, pageable: Pageable): Page<Lead> {
        // This would require a join with activities - simplified implementation
        return springDataRepository.findActiveLeads(pageable)
    }

    override fun findRecentlyContacted(limit: Int): List<Lead> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "contactedAt"))
        return springDataRepository.findRecentlyContacted(pageable).content
    }

    override fun findConvertedBetween(startDate: LocalDate, endDate: LocalDate): List<Lead> {
        return springDataRepository.findConvertedBetween(startDate, endDate)
    }
}
