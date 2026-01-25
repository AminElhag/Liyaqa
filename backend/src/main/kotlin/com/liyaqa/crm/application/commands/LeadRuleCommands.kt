package com.liyaqa.crm.application.commands

import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import java.util.UUID

// ===== Scoring Rule Commands =====

/**
 * Command to create a new lead scoring rule.
 */
data class CreateScoringRuleCommand(
    val name: String,
    val triggerType: LeadScoringTriggerType,
    val triggerValue: String? = null,
    val scoreChange: Int,
    val isActive: Boolean = true
)

/**
 * Command to update a lead scoring rule.
 */
data class UpdateScoringRuleCommand(
    val name: String? = null,
    val triggerValue: String? = null,
    val scoreChange: Int? = null,
    val isActive: Boolean? = null
)

// ===== Assignment Rule Commands =====

/**
 * Command to create a new lead assignment rule.
 */
data class CreateAssignmentRuleCommand(
    val name: String,
    val ruleType: LeadAssignmentRuleType,
    val priority: Int = 0,
    val isActive: Boolean = true,
    val config: AssignmentRuleConfig
)

/**
 * Command to update a lead assignment rule.
 */
data class UpdateAssignmentRuleCommand(
    val name: String? = null,
    val priority: Int? = null,
    val isActive: Boolean? = null,
    val config: AssignmentRuleConfig? = null
)

/**
 * Unified configuration for assignment rules.
 */
sealed class AssignmentRuleConfig {
    /**
     * Round-robin configuration.
     */
    data class RoundRobin(
        val userIds: List<UUID>
    ) : AssignmentRuleConfig()

    /**
     * Location-based configuration.
     */
    data class LocationBased(
        val locationMappings: List<LocationMappingInput>,
        val defaultUserId: UUID? = null
    ) : AssignmentRuleConfig()

    /**
     * Source-based configuration.
     */
    data class SourceBased(
        val sourceMappings: List<SourceMappingInput>,
        val defaultUserId: UUID? = null
    ) : AssignmentRuleConfig()

    /**
     * Manual assignment (no auto-assignment).
     */
    data object Manual : AssignmentRuleConfig()
}

/**
 * Input for location mapping.
 */
data class LocationMappingInput(
    val location: String,
    val userId: UUID
)

/**
 * Input for source mapping.
 */
data class SourceMappingInput(
    val source: String,
    val userId: UUID
)
