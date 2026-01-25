package com.liyaqa.crm.infrastructure.persistence

import com.liyaqa.crm.domain.model.LeadScoringRule
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import com.liyaqa.crm.domain.ports.LeadScoringRuleRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.Optional
import java.util.UUID

/**
 * Spring Data JPA repository interface for LeadScoringRule.
 */
interface SpringDataLeadScoringRuleRepository : JpaRepository<LeadScoringRule, UUID> {

    @Query("SELECT r FROM LeadScoringRule r WHERE r.isActive = true ORDER BY r.createdAt")
    fun findAllActive(): List<LeadScoringRule>

    @Query("SELECT r FROM LeadScoringRule r WHERE r.isActive = true AND r.triggerType = :triggerType ORDER BY r.createdAt")
    fun findActiveByTriggerType(@Param("triggerType") triggerType: LeadScoringTriggerType): List<LeadScoringRule>

    @Query("""
        SELECT r FROM LeadScoringRule r
        WHERE r.isActive = true
        AND r.triggerType = :triggerType
        AND (r.triggerValue = :triggerValue OR r.triggerValue IS NULL)
        ORDER BY r.createdAt
    """)
    fun findActiveByTriggerTypeAndValue(
        @Param("triggerType") triggerType: LeadScoringTriggerType,
        @Param("triggerValue") triggerValue: String
    ): List<LeadScoringRule>

    @Query("SELECT COUNT(r) FROM LeadScoringRule r WHERE r.isActive = true")
    fun countActive(): Long
}

/**
 * Adapter implementing the domain port using Spring Data JPA.
 */
@Repository
class JpaLeadScoringRuleRepository(
    private val springDataRepository: SpringDataLeadScoringRuleRepository
) : LeadScoringRuleRepository {

    override fun save(rule: LeadScoringRule): LeadScoringRule {
        return springDataRepository.save(rule)
    }

    override fun findById(id: UUID): Optional<LeadScoringRule> {
        return springDataRepository.findById(id)
    }

    override fun findAll(): List<LeadScoringRule> {
        return springDataRepository.findAll()
    }

    override fun findAllActive(): List<LeadScoringRule> {
        return springDataRepository.findAllActive()
    }

    override fun findActiveByTriggerType(triggerType: LeadScoringTriggerType): List<LeadScoringRule> {
        return springDataRepository.findActiveByTriggerType(triggerType)
    }

    override fun findActiveByTriggerTypeAndValue(
        triggerType: LeadScoringTriggerType,
        triggerValue: String
    ): List<LeadScoringRule> {
        return springDataRepository.findActiveByTriggerTypeAndValue(triggerType, triggerValue)
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
