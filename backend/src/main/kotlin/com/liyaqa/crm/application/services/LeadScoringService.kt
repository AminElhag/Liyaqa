package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.CreateScoringRuleCommand
import com.liyaqa.crm.application.commands.UpdateScoringRuleCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadActivityType
import com.liyaqa.crm.domain.model.LeadScoringRule
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.ports.LeadRepository
import com.liyaqa.crm.domain.ports.LeadScoringRuleRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing lead scoring rules and applying scores to leads.
 *
 * This service handles:
 * - CRUD operations for scoring rules
 * - Automatic scoring when leads are created (source-based)
 * - Automatic scoring when activities are logged
 * - Manual score recalculation
 */
@Service
@Transactional
class LeadScoringService(
    private val scoringRuleRepository: LeadScoringRuleRepository,
    private val leadRepository: LeadRepository
) {
    private val logger = LoggerFactory.getLogger(LeadScoringService::class.java)

    // ===== Rule CRUD Operations =====

    /**
     * Create a new scoring rule.
     */
    fun createRule(command: CreateScoringRuleCommand): LeadScoringRule {
        val rule = LeadScoringRule(
            name = command.name,
            triggerType = command.triggerType,
            triggerValue = command.triggerValue,
            scoreChange = command.scoreChange,
            isActive = command.isActive
        )

        val savedRule = scoringRuleRepository.save(rule)
        logger.info("Created scoring rule ${savedRule.id}: ${savedRule.name} (${savedRule.triggerType})")

        return savedRule
    }

    /**
     * Get a scoring rule by ID.
     */
    @Transactional(readOnly = true)
    fun getRule(id: UUID): LeadScoringRule {
        return scoringRuleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scoring rule not found: $id") }
    }

    /**
     * Update a scoring rule.
     */
    fun updateRule(id: UUID, command: UpdateScoringRuleCommand): LeadScoringRule {
        val rule = getRule(id)

        command.name?.let { rule.name = it }
        command.triggerValue?.let { rule.triggerValue = it }
        command.scoreChange?.let { rule.scoreChange = it }
        command.isActive?.let { rule.isActive = it }

        val savedRule = scoringRuleRepository.save(rule)
        logger.info("Updated scoring rule ${savedRule.id}: ${savedRule.name}")

        return savedRule
    }

    /**
     * Delete a scoring rule.
     */
    fun deleteRule(id: UUID) {
        val rule = getRule(id)
        scoringRuleRepository.deleteById(id)
        logger.info("Deleted scoring rule $id: ${rule.name}")
    }

    /**
     * Get all scoring rules.
     */
    @Transactional(readOnly = true)
    fun getAllRules(): List<LeadScoringRule> {
        return scoringRuleRepository.findAll()
    }

    /**
     * Get active scoring rules.
     */
    @Transactional(readOnly = true)
    fun getActiveRules(): List<LeadScoringRule> {
        return scoringRuleRepository.findAllActive()
    }

    /**
     * Get scoring rules by trigger type.
     */
    @Transactional(readOnly = true)
    fun getRulesByTriggerType(triggerType: LeadScoringTriggerType): List<LeadScoringRule> {
        return scoringRuleRepository.findActiveByTriggerType(triggerType)
    }

    // ===== Scoring Operations =====

    /**
     * Apply scoring based on lead source.
     * Called when a lead is created.
     *
     * @param lead The lead to score
     * @return The total score change applied
     */
    fun applySourceScoring(lead: Lead): Int {
        val rules = scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.SOURCE,
            lead.source.name
        )

        var totalScoreChange = 0

        for (rule in rules) {
            if (rule.matchesSource(lead.source)) {
                totalScoreChange += rule.scoreChange
                logger.debug("Applied source scoring rule '${rule.name}' to lead ${lead.id}: ${rule.scoreChange} points")
            }
        }

        if (totalScoreChange != 0) {
            applyScoreChange(lead, totalScoreChange)
            logger.info("Applied source-based scoring to lead ${lead.id}: total ${totalScoreChange} points (source: ${lead.source})")
        }

        return totalScoreChange
    }

    /**
     * Apply scoring based on activity type.
     * Called when an activity is logged.
     *
     * @param lead The lead to score
     * @param activityType The type of activity that was logged
     * @return The total score change applied
     */
    fun applyActivityScoring(lead: Lead, activityType: LeadActivityType): Int {
        val rules = scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.ACTIVITY,
            activityType.name
        )

        var totalScoreChange = 0

        for (rule in rules) {
            if (rule.matchesActivity(activityType)) {
                totalScoreChange += rule.scoreChange
                logger.debug("Applied activity scoring rule '${rule.name}' to lead ${lead.id}: ${rule.scoreChange} points")
            }
        }

        if (totalScoreChange != 0) {
            applyScoreChange(lead, totalScoreChange)
            leadRepository.save(lead)
            logger.info("Applied activity-based scoring to lead ${lead.id}: total ${totalScoreChange} points (activity: ${activityType})")
        }

        return totalScoreChange
    }

    /**
     * Apply engagement-based scoring.
     *
     * @param lead The lead to score
     * @param engagementType The type of engagement (e.g., "EMAIL_OPENED", "LINK_CLICKED")
     * @return The total score change applied
     */
    fun applyEngagementScoring(lead: Lead, engagementType: String): Int {
        val rules = scoringRuleRepository.findActiveByTriggerTypeAndValue(
            LeadScoringTriggerType.ENGAGEMENT,
            engagementType
        )

        var totalScoreChange = 0

        for (rule in rules) {
            if (rule.matchesEngagement(engagementType)) {
                totalScoreChange += rule.scoreChange
                logger.debug("Applied engagement scoring rule '${rule.name}' to lead ${lead.id}: ${rule.scoreChange} points")
            }
        }

        if (totalScoreChange != 0) {
            applyScoreChange(lead, totalScoreChange)
            leadRepository.save(lead)
            logger.info("Applied engagement-based scoring to lead ${lead.id}: total ${totalScoreChange} points (engagement: ${engagementType})")
        }

        return totalScoreChange
    }

    /**
     * Recalculate the total score for a lead based on all applicable rules.
     * This is useful for resetting and recalculating scores.
     *
     * @param leadId The ID of the lead to recalculate
     * @return The new total score
     */
    fun recalculateScore(leadId: UUID): Int {
        val lead = leadRepository.findById(leadId)
            .orElseThrow { NoSuchElementException("Lead not found: $leadId") }

        // Reset score
        lead.score = 0

        // Apply source scoring
        applySourceScoring(lead)

        // Note: Activity scoring would require fetching all activities
        // and reapplying rules. This is a simplified implementation.

        val savedLead = leadRepository.save(lead)
        logger.info("Recalculated score for lead ${lead.id}: new score = ${savedLead.score}")

        return savedLead.score
    }

    /**
     * Get scoring statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): ScoringStats {
        return ScoringStats(
            totalRules = scoringRuleRepository.count(),
            activeRules = scoringRuleRepository.countActive(),
            rulesByTriggerType = LeadScoringTriggerType.entries.associateWith { type ->
                scoringRuleRepository.findActiveByTriggerType(type).size.toLong()
            }
        )
    }

    // ===== Private Helper Methods =====

    /**
     * Apply score change to a lead.
     */
    private fun applyScoreChange(lead: Lead, scoreChange: Int) {
        if (scoreChange > 0) {
            lead.increaseScore(scoreChange)
        } else if (scoreChange < 0) {
            lead.decreaseScore(-scoreChange)
        }
    }

    /**
     * Statistics about scoring rules.
     */
    data class ScoringStats(
        val totalRules: Long,
        val activeRules: Long,
        val rulesByTriggerType: Map<LeadScoringTriggerType, Long>
    )
}
