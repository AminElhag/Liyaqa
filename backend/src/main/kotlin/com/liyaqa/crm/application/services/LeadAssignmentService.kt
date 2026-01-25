package com.liyaqa.crm.application.services

import com.liyaqa.crm.application.commands.AssignmentRuleConfig
import com.liyaqa.crm.application.commands.CreateAssignmentRuleCommand
import com.liyaqa.crm.application.commands.UpdateAssignmentRuleCommand
import com.liyaqa.crm.domain.model.Lead
import com.liyaqa.crm.domain.model.LeadAssignmentRule
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LocationBasedConfig
import com.liyaqa.crm.domain.model.LocationMapping
import com.liyaqa.crm.domain.model.RoundRobinConfig
import com.liyaqa.crm.domain.model.SourceBasedConfig
import com.liyaqa.crm.domain.model.SourceMapping
import com.liyaqa.crm.domain.ports.LeadAssignmentRuleRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing lead assignment rules and auto-assigning leads.
 *
 * This service handles:
 * - CRUD operations for assignment rules
 * - Automatic assignment when leads are created
 * - Round-robin, location-based, and source-based assignment strategies
 */
@Service
@Transactional
class LeadAssignmentService(
    private val assignmentRuleRepository: LeadAssignmentRuleRepository
) {
    private val logger = LoggerFactory.getLogger(LeadAssignmentService::class.java)

    // ===== Rule CRUD Operations =====

    /**
     * Create a new assignment rule.
     */
    fun createRule(command: CreateAssignmentRuleCommand): LeadAssignmentRule {
        val rule = LeadAssignmentRule(
            name = command.name,
            ruleType = command.ruleType,
            priority = command.priority,
            isActive = command.isActive
        )

        // Set configuration based on rule type
        applyConfig(rule, command.config)

        val savedRule = assignmentRuleRepository.save(rule)
        logger.info("Created assignment rule ${savedRule.id}: ${savedRule.name} (${savedRule.ruleType})")

        return savedRule
    }

    /**
     * Get an assignment rule by ID.
     */
    @Transactional(readOnly = true)
    fun getRule(id: UUID): LeadAssignmentRule {
        return assignmentRuleRepository.findById(id)
            .orElseThrow { NoSuchElementException("Assignment rule not found: $id") }
    }

    /**
     * Update an assignment rule.
     */
    fun updateRule(id: UUID, command: UpdateAssignmentRuleCommand): LeadAssignmentRule {
        val rule = getRule(id)

        command.name?.let { rule.name = it }
        command.priority?.let { rule.priority = it }
        command.isActive?.let { rule.isActive = it }
        command.config?.let { applyConfig(rule, it) }

        val savedRule = assignmentRuleRepository.save(rule)
        logger.info("Updated assignment rule ${savedRule.id}: ${savedRule.name}")

        return savedRule
    }

    /**
     * Delete an assignment rule.
     */
    fun deleteRule(id: UUID) {
        val rule = getRule(id)
        assignmentRuleRepository.deleteById(id)
        logger.info("Deleted assignment rule $id: ${rule.name}")
    }

    /**
     * Get all assignment rules.
     */
    @Transactional(readOnly = true)
    fun getAllRules(): List<LeadAssignmentRule> {
        return assignmentRuleRepository.findAll()
    }

    /**
     * Get active assignment rules ordered by priority.
     */
    @Transactional(readOnly = true)
    fun getActiveRules(): List<LeadAssignmentRule> {
        return assignmentRuleRepository.findAllActiveOrderByPriority()
    }

    // ===== Assignment Operations =====

    /**
     * Auto-assign a lead based on active assignment rules.
     * Rules are evaluated in priority order (lowest priority number first).
     *
     * @param lead The lead to assign
     * @param location Optional location hint for location-based assignment
     * @return The assigned user ID, or null if no assignment could be made
     */
    fun autoAssign(lead: Lead, location: String? = null): UUID? {
        val activeRules = assignmentRuleRepository.findAllActiveOrderByPriority()

        if (activeRules.isEmpty()) {
            logger.debug("No active assignment rules found for lead ${lead.id}")
            return null
        }

        for (rule in activeRules) {
            val assignedUserId = when (rule.ruleType) {
                LeadAssignmentRuleType.ROUND_ROBIN -> applyRoundRobin(rule)
                LeadAssignmentRuleType.LOCATION_BASED -> applyLocationBased(rule, location)
                LeadAssignmentRuleType.SOURCE_BASED -> applySourceBased(rule, lead.source)
                LeadAssignmentRuleType.MANUAL -> null
            }

            if (assignedUserId != null) {
                lead.assignTo(assignedUserId)
                logger.info("Auto-assigned lead ${lead.id} to user $assignedUserId via rule '${rule.name}' (${rule.ruleType})")
                return assignedUserId
            }
        }

        logger.debug("No suitable assignment rule matched for lead ${lead.id}")
        return null
    }

    /**
     * Get assignment statistics.
     */
    @Transactional(readOnly = true)
    fun getStats(): AssignmentStats {
        return AssignmentStats(
            totalRules = assignmentRuleRepository.count(),
            activeRules = assignmentRuleRepository.countActive(),
            rulesByType = LeadAssignmentRuleType.entries.associateWith { type ->
                assignmentRuleRepository.findActiveByTypeOrderByPriority(type).size.toLong()
            }
        )
    }

    // ===== Private Helper Methods =====

    /**
     * Apply configuration to a rule.
     */
    private fun applyConfig(rule: LeadAssignmentRule, config: AssignmentRuleConfig) {
        when (config) {
            is AssignmentRuleConfig.RoundRobin -> {
                require(rule.ruleType == LeadAssignmentRuleType.ROUND_ROBIN) {
                    "Round-robin config can only be applied to ROUND_ROBIN rules"
                }
                rule.setRoundRobinConfig(RoundRobinConfig(userIds = config.userIds))
            }
            is AssignmentRuleConfig.LocationBased -> {
                require(rule.ruleType == LeadAssignmentRuleType.LOCATION_BASED) {
                    "Location-based config can only be applied to LOCATION_BASED rules"
                }
                rule.setLocationConfig(LocationBasedConfig(
                    locationMappings = config.locationMappings.map { LocationMapping(it.location, it.userId) },
                    defaultUserId = config.defaultUserId
                ))
            }
            is AssignmentRuleConfig.SourceBased -> {
                require(rule.ruleType == LeadAssignmentRuleType.SOURCE_BASED) {
                    "Source-based config can only be applied to SOURCE_BASED rules"
                }
                rule.setSourceConfig(SourceBasedConfig(
                    sourceMappings = config.sourceMappings.map {
                        SourceMapping(LeadSource.valueOf(it.source), it.userId)
                    },
                    defaultUserId = config.defaultUserId
                ))
            }
            is AssignmentRuleConfig.Manual -> {
                require(rule.ruleType == LeadAssignmentRuleType.MANUAL) {
                    "Manual config can only be applied to MANUAL rules"
                }
                rule.config = "{}"
            }
        }
    }

    /**
     * Apply round-robin assignment.
     */
    private fun applyRoundRobin(rule: LeadAssignmentRule): UUID? {
        val config = rule.getRoundRobinConfig()

        if (config.userIds.isEmpty()) {
            logger.debug("Round-robin rule '${rule.name}' has no users configured")
            return null
        }

        val nextUserId = config.getNextUserId() ?: return null

        // Update the rule to track the last assigned index
        val updatedConfig = config.advance()
        rule.setRoundRobinConfig(updatedConfig)
        assignmentRuleRepository.save(rule)

        return nextUserId
    }

    /**
     * Apply location-based assignment.
     */
    private fun applyLocationBased(rule: LeadAssignmentRule, location: String?): UUID? {
        val config = rule.getLocationConfig()

        if (location == null) {
            logger.debug("No location provided for location-based rule '${rule.name}'")
            return config.defaultUserId
        }

        // Find a matching location (case-insensitive)
        val mapping = config.locationMappings.find {
            it.location.equals(location, ignoreCase = true)
        }

        if (mapping != null) {
            return mapping.userId
        }

        // Fall back to default user
        return config.defaultUserId
    }

    /**
     * Apply source-based assignment.
     */
    private fun applySourceBased(rule: LeadAssignmentRule, source: LeadSource): UUID? {
        val config = rule.getSourceConfig()

        // Find a matching source
        val mapping = config.sourceMappings.find { it.source == source }

        if (mapping != null) {
            return mapping.userId
        }

        // Fall back to default user
        return config.defaultUserId
    }

    /**
     * Statistics about assignment rules.
     */
    data class AssignmentStats(
        val totalRules: Long,
        val activeRules: Long,
        val rulesByType: Map<LeadAssignmentRuleType, Long>
    )
}
