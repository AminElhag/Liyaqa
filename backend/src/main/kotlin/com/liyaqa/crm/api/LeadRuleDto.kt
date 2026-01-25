package com.liyaqa.crm.api

import com.liyaqa.crm.domain.model.LeadAssignmentRule
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import com.liyaqa.crm.domain.model.LeadScoringRule
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

// ===== Scoring Rule DTOs =====

data class CreateScoringRuleRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotNull(message = "Trigger type is required")
    val triggerType: LeadScoringTriggerType,

    val triggerValue: String? = null,

    @field:NotNull(message = "Score change is required")
    val scoreChange: Int,

    val isActive: Boolean = true
)

data class UpdateScoringRuleRequest(
    val name: String? = null,
    val triggerValue: String? = null,
    val scoreChange: Int? = null,
    val isActive: Boolean? = null
)

data class ScoringRuleResponse(
    val id: UUID,
    val name: String,
    val triggerType: LeadScoringTriggerType,
    val triggerValue: String?,
    val scoreChange: Int,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(rule: LeadScoringRule): ScoringRuleResponse = ScoringRuleResponse(
            id = rule.id,
            name = rule.name,
            triggerType = rule.triggerType,
            triggerValue = rule.triggerValue,
            scoreChange = rule.scoreChange,
            isActive = rule.isActive,
            createdAt = rule.createdAt,
            updatedAt = rule.updatedAt
        )
    }
}

data class ScoringStatsResponse(
    val totalRules: Long,
    val activeRules: Long,
    val rulesByTriggerType: Map<LeadScoringTriggerType, Long>
)

// ===== Assignment Rule DTOs =====

data class CreateAssignmentRuleRequest(
    @field:NotBlank(message = "Name is required")
    val name: String,

    @field:NotNull(message = "Rule type is required")
    val ruleType: LeadAssignmentRuleType,

    val priority: Int = 0,

    val isActive: Boolean = true,

    @field:NotNull(message = "Configuration is required")
    val config: AssignmentRuleConfigRequest
)

data class UpdateAssignmentRuleRequest(
    val name: String? = null,
    val priority: Int? = null,
    val isActive: Boolean? = null,
    val config: AssignmentRuleConfigRequest? = null
)

/**
 * Request DTO for assignment rule configuration.
 * Only the relevant fields should be populated based on rule type.
 */
data class AssignmentRuleConfigRequest(
    // For ROUND_ROBIN
    val userIds: List<UUID>? = null,

    // For LOCATION_BASED
    val locationMappings: List<LocationMappingRequest>? = null,

    // For SOURCE_BASED
    val sourceMappings: List<SourceMappingRequest>? = null,

    // For LOCATION_BASED and SOURCE_BASED
    val defaultUserId: UUID? = null
)

data class LocationMappingRequest(
    val location: String,
    val userId: UUID
)

data class SourceMappingRequest(
    val source: String,
    val userId: UUID
)

data class AssignmentRuleResponse(
    val id: UUID,
    val name: String,
    val ruleType: LeadAssignmentRuleType,
    val priority: Int,
    val isActive: Boolean,
    val config: AssignmentRuleConfigResponse,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(rule: LeadAssignmentRule): AssignmentRuleResponse {
            val configResponse = when (rule.ruleType) {
                LeadAssignmentRuleType.ROUND_ROBIN -> {
                    val config = rule.getRoundRobinConfig()
                    AssignmentRuleConfigResponse(
                        userIds = config.userIds,
                        lastAssignedIndex = config.lastAssignedIndex
                    )
                }
                LeadAssignmentRuleType.LOCATION_BASED -> {
                    val config = rule.getLocationConfig()
                    AssignmentRuleConfigResponse(
                        locationMappings = config.locationMappings.map {
                            LocationMappingResponse(it.location, it.userId)
                        },
                        defaultUserId = config.defaultUserId
                    )
                }
                LeadAssignmentRuleType.SOURCE_BASED -> {
                    val config = rule.getSourceConfig()
                    AssignmentRuleConfigResponse(
                        sourceMappings = config.sourceMappings.map {
                            SourceMappingResponse(it.source.name, it.userId)
                        },
                        defaultUserId = config.defaultUserId
                    )
                }
                LeadAssignmentRuleType.MANUAL -> {
                    AssignmentRuleConfigResponse()
                }
            }

            return AssignmentRuleResponse(
                id = rule.id,
                name = rule.name,
                ruleType = rule.ruleType,
                priority = rule.priority,
                isActive = rule.isActive,
                config = configResponse,
                createdAt = rule.createdAt,
                updatedAt = rule.updatedAt
            )
        }
    }
}

/**
 * Response DTO for assignment rule configuration.
 */
data class AssignmentRuleConfigResponse(
    // For ROUND_ROBIN
    val userIds: List<UUID>? = null,
    val lastAssignedIndex: Int? = null,

    // For LOCATION_BASED
    val locationMappings: List<LocationMappingResponse>? = null,

    // For SOURCE_BASED
    val sourceMappings: List<SourceMappingResponse>? = null,

    // For LOCATION_BASED and SOURCE_BASED
    val defaultUserId: UUID? = null
)

data class LocationMappingResponse(
    val location: String,
    val userId: UUID
)

data class SourceMappingResponse(
    val source: String,
    val userId: UUID
)

data class AssignmentStatsResponse(
    val totalRules: Long,
    val activeRules: Long,
    val rulesByType: Map<LeadAssignmentRuleType, Long>
)
