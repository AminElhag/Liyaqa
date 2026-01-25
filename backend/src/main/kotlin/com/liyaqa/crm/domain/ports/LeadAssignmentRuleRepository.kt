package com.liyaqa.crm.domain.ports

import com.liyaqa.crm.domain.model.LeadAssignmentRule
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for LeadAssignmentRule persistence.
 */
interface LeadAssignmentRuleRepository {

    /**
     * Save an assignment rule.
     */
    fun save(rule: LeadAssignmentRule): LeadAssignmentRule

    /**
     * Find an assignment rule by ID.
     */
    fun findById(id: UUID): Optional<LeadAssignmentRule>

    /**
     * Find all assignment rules.
     */
    fun findAll(): List<LeadAssignmentRule>

    /**
     * Find all active assignment rules, ordered by priority ascending.
     */
    fun findAllActiveOrderByPriority(): List<LeadAssignmentRule>

    /**
     * Find active assignment rules by type, ordered by priority ascending.
     */
    fun findActiveByTypeOrderByPriority(ruleType: LeadAssignmentRuleType): List<LeadAssignmentRule>

    /**
     * Check if a rule exists by ID.
     */
    fun existsById(id: UUID): Boolean

    /**
     * Delete a rule by ID.
     */
    fun deleteById(id: UUID)

    /**
     * Count all rules.
     */
    fun count(): Long

    /**
     * Count active rules.
     */
    fun countActive(): Long
}
