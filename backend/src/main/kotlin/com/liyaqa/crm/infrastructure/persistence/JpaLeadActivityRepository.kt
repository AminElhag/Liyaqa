package com.liyaqa.crm.infrastructure.persistence

import com.liyaqa.crm.domain.model.LeadActivity
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.ports.LeadActivityRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for LeadActivity.
 */
interface SpringDataLeadActivityRepository : JpaRepository<LeadActivity, UUID> {
    fun findByLeadId(leadId: UUID, pageable: Pageable): Page<LeadActivity>
    fun findByLeadIdOrderByCreatedAtDesc(leadId: UUID): List<LeadActivity>
    fun countByLeadId(leadId: UUID): Long
    fun findByType(type: LeadActivityType, pageable: Pageable): Page<LeadActivity>
    fun countByType(type: LeadActivityType): Long
    fun findByPerformedByUserId(userId: UUID, pageable: Pageable): Page<LeadActivity>
    fun countByPerformedByUserId(userId: UUID): Long
    fun findByLeadIdIn(leadIds: List<UUID>): List<LeadActivity>

    @Modifying
    @Query("DELETE FROM LeadActivity la WHERE la.leadId = :leadId")
    fun deleteByLeadId(@Param("leadId") leadId: UUID)

    @Query("""
        SELECT la FROM LeadActivity la
        WHERE la.followUpDate IS NOT NULL
        AND la.followUpCompleted = false
        ORDER BY la.followUpDate ASC
    """)
    fun findPendingFollowUps(pageable: Pageable): Page<LeadActivity>

    @Query("""
        SELECT la FROM LeadActivity la
        WHERE la.followUpDate IS NOT NULL
        AND la.followUpCompleted = false
        AND la.followUpDate < :asOfDate
        ORDER BY la.followUpDate ASC
    """)
    fun findOverdueFollowUps(@Param("asOfDate") asOfDate: LocalDate, pageable: Pageable): Page<LeadActivity>

    @Query("""
        SELECT la FROM LeadActivity la
        WHERE la.followUpDate >= :startDate
        AND la.followUpDate <= :endDate
        ORDER BY la.followUpDate ASC
    """)
    fun findFollowUpsByDateRange(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate,
        pageable: Pageable
    ): Page<LeadActivity>

    @Query("""
        SELECT COUNT(la) FROM LeadActivity la
        WHERE la.followUpDate IS NOT NULL
        AND la.followUpCompleted = false
    """)
    fun countPendingFollowUps(): Long

    @Query("""
        SELECT COUNT(la) FROM LeadActivity la
        WHERE la.followUpDate IS NOT NULL
        AND la.followUpCompleted = false
        AND la.followUpDate < :asOfDate
    """)
    fun countOverdueFollowUps(@Param("asOfDate") asOfDate: LocalDate): Long

    @Query("""
        SELECT la FROM LeadActivity la
        WHERE la.followUpDate IS NOT NULL
        AND la.followUpCompleted = false
        AND la.followUpDate <= :beforeDate
        ORDER BY la.followUpDate ASC
    """)
    fun findPendingFollowUpsDueBefore(@Param("beforeDate") beforeDate: LocalDate, pageable: Pageable): Page<LeadActivity>
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaLeadActivityRepository(
    private val springDataRepository: SpringDataLeadActivityRepository
) : LeadActivityRepository {

    override fun save(activity: LeadActivity): LeadActivity {
        return springDataRepository.save(activity)
    }

    override fun findById(id: UUID): Optional<LeadActivity> {
        return springDataRepository.findById(id)
    }

    override fun findByLeadId(leadId: UUID, pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findByLeadId(leadId, pageable)
    }

    override fun findByLeadIdOrderByCreatedAtDesc(leadId: UUID): List<LeadActivity> {
        return springDataRepository.findByLeadIdOrderByCreatedAtDesc(leadId)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun deleteByLeadId(leadId: UUID) {
        springDataRepository.deleteByLeadId(leadId)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun countByLeadId(leadId: UUID): Long {
        return springDataRepository.countByLeadId(leadId)
    }

    override fun findByType(type: LeadActivityType, pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findByType(type, pageable)
    }

    override fun countByType(type: LeadActivityType): Long {
        return springDataRepository.countByType(type)
    }

    override fun findPendingFollowUps(pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findPendingFollowUps(pageable)
    }

    override fun findOverdueFollowUps(asOfDate: LocalDate, pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findOverdueFollowUps(asOfDate, pageable)
    }

    override fun findFollowUpsByDateRange(
        startDate: LocalDate,
        endDate: LocalDate,
        pageable: Pageable
    ): Page<LeadActivity> {
        return springDataRepository.findFollowUpsByDateRange(startDate, endDate, pageable)
    }

    override fun countPendingFollowUps(): Long {
        return springDataRepository.countPendingFollowUps()
    }

    override fun countOverdueFollowUps(asOfDate: LocalDate): Long {
        return springDataRepository.countOverdueFollowUps(asOfDate)
    }

    override fun findByPerformedByUserId(userId: UUID, pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findByPerformedByUserId(userId, pageable)
    }

    override fun countByPerformedByUserId(userId: UUID): Long {
        return springDataRepository.countByPerformedByUserId(userId)
    }

    override fun findRecentActivities(limit: Int): List<LeadActivity> {
        val pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        return springDataRepository.findAll(pageable).content
    }

    override fun findByLeadIdIn(leadIds: List<UUID>): List<LeadActivity> {
        return springDataRepository.findByLeadIdIn(leadIds)
    }

    override fun findPendingFollowUpsDueBefore(beforeDate: LocalDate, pageable: Pageable): Page<LeadActivity> {
        return springDataRepository.findPendingFollowUpsDueBefore(beforeDate, pageable)
    }
}
