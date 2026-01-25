package com.liyaqa.crm.api

import com.liyaqa.crm.application.commands.CreateScoringRuleCommand
import com.liyaqa.crm.application.commands.UpdateScoringRuleCommand
import com.liyaqa.crm.application.services.LeadScoringService
import com.liyaqa.crm.domain.model.LeadScoringTriggerType
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
@RequestMapping("/api/leads/scoring-rules")
@Tag(name = "Lead Scoring Rules", description = "Manage lead scoring rules for automatic lead scoring")
class LeadScoringRuleController(
    private val scoringService: LeadScoringService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Create a new scoring rule")
    fun createRule(
        @Valid @RequestBody request: CreateScoringRuleRequest
    ): ResponseEntity<ScoringRuleResponse> {
        val command = CreateScoringRuleCommand(
            name = request.name,
            triggerType = request.triggerType,
            triggerValue = request.triggerValue,
            scoreChange = request.scoreChange,
            isActive = request.isActive
        )
        val rule = scoringService.createRule(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(ScoringRuleResponse.from(rule))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get a scoring rule by ID")
    fun getRule(@PathVariable id: UUID): ResponseEntity<ScoringRuleResponse> {
        val rule = scoringService.getRule(id)
        return ResponseEntity.ok(ScoringRuleResponse.from(rule))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Update a scoring rule")
    fun updateRule(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateScoringRuleRequest
    ): ResponseEntity<ScoringRuleResponse> {
        val command = UpdateScoringRuleCommand(
            name = request.name,
            triggerValue = request.triggerValue,
            scoreChange = request.scoreChange,
            isActive = request.isActive
        )
        val rule = scoringService.updateRule(id, command)
        return ResponseEntity.ok(ScoringRuleResponse.from(rule))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_delete')")
    @Operation(summary = "Delete a scoring rule")
    fun deleteRule(@PathVariable id: UUID): ResponseEntity<Void> {
        scoringService.deleteRule(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "List all scoring rules")
    fun listRules(
        @RequestParam(required = false) activeOnly: Boolean = false,
        @RequestParam(required = false) triggerType: LeadScoringTriggerType? = null
    ): ResponseEntity<List<ScoringRuleResponse>> {
        val rules = when {
            triggerType != null -> scoringService.getRulesByTriggerType(triggerType)
            activeOnly -> scoringService.getActiveRules()
            else -> scoringService.getAllRules()
        }
        return ResponseEntity.ok(rules.map { ScoringRuleResponse.from(it) })
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get scoring rule statistics")
    fun getStats(): ResponseEntity<ScoringStatsResponse> {
        val stats = scoringService.getStats()
        return ResponseEntity.ok(ScoringStatsResponse(
            totalRules = stats.totalRules,
            activeRules = stats.activeRules,
            rulesByTriggerType = stats.rulesByTriggerType
        ))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Activate a scoring rule")
    fun activateRule(@PathVariable id: UUID): ResponseEntity<ScoringRuleResponse> {
        val rule = scoringService.updateRule(id, UpdateScoringRuleCommand(isActive = true))
        return ResponseEntity.ok(ScoringRuleResponse.from(rule))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Deactivate a scoring rule")
    fun deactivateRule(@PathVariable id: UUID): ResponseEntity<ScoringRuleResponse> {
        val rule = scoringService.updateRule(id, UpdateScoringRuleCommand(isActive = false))
        return ResponseEntity.ok(ScoringRuleResponse.from(rule))
    }

    @PostMapping("/leads/{leadId}/recalculate")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Recalculate the score for a specific lead")
    fun recalculateLeadScore(@PathVariable leadId: UUID): ResponseEntity<Map<String, Int>> {
        val newScore = scoringService.recalculateScore(leadId)
        return ResponseEntity.ok(mapOf("score" to newScore))
    }
}
