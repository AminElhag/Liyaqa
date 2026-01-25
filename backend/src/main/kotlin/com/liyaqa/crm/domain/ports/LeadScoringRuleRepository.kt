package com.liyaqa.crm.domain.ports

import com.liyaqa.crm.domain.model.LeadScoringRule
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import java.util.Optional
import java.util.UUID

/**
 * Repository interface for LeadScoringRule persistence.
 */
interface LeadScoringRuleRepository {

    /**
     * Save a scoring rule.
     */
    fun save(rule: LeadScoringRule): LeadScoringRule

    /**
     * Find a scoring rule by ID.
     */
    fun findById(id: UUID): Optional<LeadScoringRule>

    /**
     * Find all scoring rules.
     */
    fun findAll(): List<LeadScoringRule>

    /**
     * Find all active scoring rules.
     */
    fun findAllActive(): List<LeadScoringRule>

    /**
     * Find active scoring rules by trigger type.
     */
    fun findActiveByTriggerType(triggerType: LeadScoringTriggerType): List<LeadScoringRule>

    /**
     * Find active scoring rules by trigger type and value.
     */
    fun findActiveByTriggerTypeAndValue(triggerType: LeadScoringTriggerType, triggerValue: String): List<LeadScoringRule>

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
