package com.liyaqa.crm.api

import com.liyaqa.crm.application.commands.AssignmentRuleConfig
import com.liyaqa.crm.application.commands.CreateAssignmentRuleCommand
import com.liyaqa.crm.application.commands.LocationMappingInput
import com.liyaqa.crm.application.commands.SourceMappingInput
import com.liyaqa.crm.application.commands.UpdateAssignmentRuleCommand
import com.liyaqa.crm.application.services.LeadAssignmentService
import com.liyaqa.crm.domain.model.LeadAssignmentRuleType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/leads/assignment-rules")
@Tag(name = "Lead Assignment Rules", description = "Manage lead assignment rules for automatic lead assignment")
class LeadAssignmentRuleController(
    private val assignmentService: LeadAssignmentService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Create a new assignment rule")
    fun createRule(
        @Valid @RequestBody request: CreateAssignmentRuleRequest
    ): ResponseEntity<AssignmentRuleResponse> {
        val command = CreateAssignmentRuleCommand(
            name = request.name,
            ruleType = request.ruleType,
            priority = request.priority,
            isActive = request.isActive,
            config = convertToConfig(request.ruleType, request.config)
        )
        val rule = assignmentService.createRule(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(AssignmentRuleResponse.from(rule))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get an assignment rule by ID")
    fun getRule(@PathVariable id: UUID): ResponseEntity<AssignmentRuleResponse> {
        val rule = assignmentService.getRule(id)
        return ResponseEntity.ok(AssignmentRuleResponse.from(rule))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Update an assignment rule")
    fun updateRule(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateAssignmentRuleRequest
    ): ResponseEntity<AssignmentRuleResponse> {
        // Get existing rule to determine type for config conversion
        val existingRule = assignmentService.getRule(id)

        val command = UpdateAssignmentRuleCommand(
            name = request.name,
            priority = request.priority,
            isActive = request.isActive,
            config = request.config?.let { convertToConfig(existingRule.ruleType, it) }
        )
        val rule = assignmentService.updateRule(id, command)
        return ResponseEntity.ok(AssignmentRuleResponse.from(rule))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_delete')")
    @Operation(summary = "Delete an assignment rule")
    fun deleteRule(@PathVariable id: UUID): ResponseEntity<Void> {
        assignmentService.deleteRule(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "List all assignment rules")
    fun listRules(
        @RequestParam(required = false) activeOnly: Boolean = false
    ): ResponseEntity<List<AssignmentRuleResponse>> {
        val rules = if (activeOnly) {
            assignmentService.getActiveRules()
        } else {
            assignmentService.getAllRules()
        }
        return ResponseEntity.ok(rules.map { AssignmentRuleResponse.from(it) })
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get assignment rule statistics")
    fun getStats(): ResponseEntity<AssignmentStatsResponse> {
        val stats = assignmentService.getStats()
        return ResponseEntity.ok(AssignmentStatsResponse(
            totalRules = stats.totalRules,
            activeRules = stats.activeRules,
            rulesByType = stats.rulesByType
        ))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Activate an assignment rule")
    fun activateRule(@PathVariable id: UUID): ResponseEntity<AssignmentRuleResponse> {
        val rule = assignmentService.updateRule(id, UpdateAssignmentRuleCommand(isActive = true))
        return ResponseEntity.ok(AssignmentRuleResponse.from(rule))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Deactivate an assignment rule")
    fun deactivateRule(@PathVariable id: UUID): ResponseEntity<AssignmentRuleResponse> {
        val rule = assignmentService.updateRule(id, UpdateAssignmentRuleCommand(isActive = false))
        return ResponseEntity.ok(AssignmentRuleResponse.from(rule))
    }

    /**
     * Convert request config to domain config based on rule type.
     */
    private fun convertToConfig(ruleType: LeadAssignmentRuleType, request: AssignmentRuleConfigRequest): AssignmentRuleConfig {
        return when (ruleType) {
            LeadAssignmentRuleType.ROUND_ROBIN -> {
                require(!request.userIds.isNullOrEmpty()) { "User IDs are required for round-robin rules" }
                AssignmentRuleConfig.RoundRobin(userIds = request.userIds)
            }
            LeadAssignmentRuleType.LOCATION_BASED -> {
                AssignmentRuleConfig.LocationBased(
                    locationMappings = request.locationMappings?.map {
                        LocationMappingInput(it.location, it.userId)
                    } ?: emptyList(),
                    defaultUserId = request.defaultUserId
                )
            }
            LeadAssignmentRuleType.SOURCE_BASED -> {
                AssignmentRuleConfig.SourceBased(
                    sourceMappings = request.sourceMappings?.map {
                        SourceMappingInput(it.source, it.userId)
                    } ?: emptyList(),
                    defaultUserId = request.defaultUserId
                )
            }
            LeadAssignmentRuleType.MANUAL -> {
                AssignmentRuleConfig.Manual
            }
        }
    }
}
