package com.liyaqa.crm.infrastructure.persistence

import com.liyaqa.crm.domain.model.LeadAssignmentRule
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import com.liyaqa.crm.domain.ports.LeadAssignmentRuleRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for LeadAssignmentRule.
 */
interface SpringDataLeadAssignmentRuleRepository : JpaRepository<LeadAssignmentRule, UUID> {

    @Query("SELECT r FROM LeadAssignmentRule r WHERE r.isActive = true ORDER BY r.priority ASC, r.createdAt ASC")
    fun findAllActiveOrderByPriority(): List<LeadAssignmentRule>

    @Query("""
        SELECT r FROM LeadAssignmentRule r
        WHERE r.isActive = true
        AND r.ruleType = :ruleType
        ORDER BY r.priority ASC, r.createdAt ASC
    """)
    fun findActiveByTypeOrderByPriority(
        @Param("ruleType") ruleType: LeadAssignmentRuleType
    ): List<LeadAssignmentRule>

    @Query("SELECT COUNT(r) FROM LeadAssignmentRule r WHERE r.isActive = true")
    fun countActive(): Long
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaLeadAssignmentRuleRepository(
    private val springDataRepository: SpringDataLeadAssignmentRuleRepository
) : LeadAssignmentRuleRepository {

    override fun save(rule: LeadAssignmentRule): LeadAssignmentRule {
        return springDataRepository.save(rule)
    }

    override fun findById(id: UUID): Optional<LeadAssignmentRule> {
        return springDataRepository.findById(id)
    }

    override fun findAll(): List<LeadAssignmentRule> {
        return springDataRepository.findAll()
    }

    override fun findAllActiveOrderByPriority(): List<LeadAssignmentRule> {
        return springDataRepository.findAllActiveOrderByPriority()
    }

    override fun findActiveByTypeOrderByPriority(ruleType: LeadAssignmentRuleType): List<LeadAssignmentRule> {
        return springDataRepository.findActiveByTypeOrderByPriority(ruleType)
    }

    override fun existsById(id: UUID): Boolean {
        return springDataRepository.existsById(id)
    }

    override fun deleteById(id: UUID) {
        springDataRepository.deleteById(id)
    }

    override fun count(): Long {
        return springDataRepository.count()
    }

    override fun countActive(): Long {
        return springDataRepository.countActive()
    }
}
