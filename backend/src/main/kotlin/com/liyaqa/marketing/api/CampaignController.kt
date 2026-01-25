package com.liyaqa.marketing.api

import com.liyaqa.marketing.application.commands.DuplicateCampaignCommand
import com.liyaqa.marketing.application.services.CampaignExecutionService
import com.liyaqa.marketing.application.services.CampaignService
import com.liyaqa.marketing.domain.model.CampaignStatus
import com.liyaqa.marketing.domain.model.CampaignType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
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
@RequestMapping("/api/marketing/campaigns")
@Tag(name = "Marketing Campaigns", description = "Campaign management")
class CampaignController(
    private val campaignService: CampaignService,
    private val executionService: CampaignExecutionService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('marketing_campaigns_create')")
    @Operation(summary = "Create a new campaign")
    fun createCampaign(
        @Valid @RequestBody request: CreateCampaignRequest
    ): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.createCampaign(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(CampaignResponse.from(campaign))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('marketing_campaigns_read')")
    @Operation(summary = "List campaigns")
    fun listCampaigns(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: CampaignStatus?,
        @RequestParam(required = false) campaignType: CampaignType?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<Page<CampaignResponse>> {
        val sort = if (sortDir.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size, sort)
        val campaigns = campaignService.searchCampaigns(search, status, campaignType, pageable)
        return ResponseEntity.ok(campaigns.map { CampaignResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_campaigns_read')")
    @Operation(summary = "Get campaign details")
    fun getCampaign(@PathVariable id: UUID): ResponseEntity<CampaignDetailResponse> {
        val campaign = campaignService.getCampaign(id)
        val steps = campaignService.getSteps(id)
        return ResponseEntity.ok(CampaignDetailResponse(
            campaign = CampaignResponse.from(campaign),
            steps = steps.map { CampaignStepResponse.from(it) }
        ))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Update campaign")
    fun updateCampaign(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateCampaignRequest
    ): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.updateCampaign(id, request.toCommand())
        return ResponseEntity.ok(CampaignResponse.from(campaign))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('marketing_campaigns_delete')")
    @Operation(summary = "Delete campaign")
    fun deleteCampaign(@PathVariable id: UUID): ResponseEntity<Void> {
        campaignService.deleteCampaign(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('marketing_campaigns_activate')")
    @Operation(summary = "Activate campaign")
    fun activateCampaign(@PathVariable id: UUID): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.activateCampaign(id)
        return ResponseEntity.ok(CampaignResponse.from(campaign))
    }

    @PostMapping("/{id}/pause")
    @PreAuthorize("hasAuthority('marketing_campaigns_activate')")
    @Operation(summary = "Pause campaign")
    fun pauseCampaign(@PathVariable id: UUID): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.pauseCampaign(id)
        return ResponseEntity.ok(CampaignResponse.from(campaign))
    }

    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Archive campaign")
    fun archiveCampaign(@PathVariable id: UUID): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.archiveCampaign(id)
        return ResponseEntity.ok(CampaignResponse.from(campaign))
    }

    @PostMapping("/{id}/duplicate")
    @PreAuthorize("hasAuthority('marketing_campaigns_create')")
    @Operation(summary = "Duplicate campaign")
    fun duplicateCampaign(
        @PathVariable id: UUID,
        @Valid @RequestBody request: DuplicateCampaignRequest
    ): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.duplicateCampaign(
            DuplicateCampaignCommand(id, request.newName)
        )
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(CampaignResponse.from(campaign))
    }

    // ==================== STEPS ====================

    @PostMapping("/{id}/steps")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Add step to campaign")
    fun addStep(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateCampaignStepRequest
    ): ResponseEntity<CampaignStepResponse> {
        val step = campaignService.addStep(request.toCommand(id))
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(CampaignStepResponse.from(step))
    }

    @GetMapping("/{id}/steps")
    @PreAuthorize("hasAuthority('marketing_campaigns_read')")
    @Operation(summary = "Get campaign steps")
    fun getSteps(@PathVariable id: UUID): ResponseEntity<List<CampaignStepResponse>> {
        val steps = campaignService.getSteps(id)
        return ResponseEntity.ok(steps.map { CampaignStepResponse.from(it) })
    }

    @PutMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Update campaign step")
    fun updateStep(
        @PathVariable id: UUID,
        @PathVariable stepId: UUID,
        @Valid @RequestBody request: UpdateCampaignStepRequest
    ): ResponseEntity<CampaignStepResponse> {
        val step = campaignService.updateStep(stepId, request.toCommand())
        return ResponseEntity.ok(CampaignStepResponse.from(step))
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Delete campaign step")
    fun deleteStep(
        @PathVariable id: UUID,
        @PathVariable stepId: UUID
    ): ResponseEntity<Void> {
        campaignService.deleteStep(stepId)
        return ResponseEntity.noContent().build()
    }

    // ==================== ENROLLMENTS ====================

    @GetMapping("/{id}/enrollments")
    @PreAuthorize("hasAuthority('marketing_campaigns_read')")
    @Operation(summary = "Get campaign enrollments")
    fun getEnrollments(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<EnrollmentResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("enrolledAt").descending())
        val enrollments = executionService.getEnrollments(id, pageable)
        return ResponseEntity.ok(enrollments.map { EnrollmentResponse.from(it) })
    }

    @PostMapping("/{id}/enrollments")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Manually enroll members")
    fun enrollMembers(
        @PathVariable id: UUID,
        @Valid @RequestBody request: EnrollMembersRequest
    ): ResponseEntity<Map<String, Int>> {
        val enrolled = executionService.enrollMembers(id, request.memberIds)
        return ResponseEntity.ok(mapOf("enrolled" to enrolled))
    }

    @DeleteMapping("/{id}/enrollments/{enrollmentId}")
    @PreAuthorize("hasAuthority('marketing_campaigns_update')")
    @Operation(summary = "Cancel enrollment")
    fun cancelEnrollment(
        @PathVariable id: UUID,
        @PathVariable enrollmentId: UUID
    ): ResponseEntity<Void> {
        executionService.cancelEnrollment(enrollmentId)
        return ResponseEntity.noContent().build()
    }

    // ==================== TEMPLATES ====================

    @GetMapping("/templates")
    @PreAuthorize("hasAuthority('marketing_campaigns_read')")
    @Operation(summary = "List campaign templates")
    fun listTemplates(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<CampaignResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("name").ascending())
        val templates = campaignService.listTemplates(pageable)
        return ResponseEntity.ok(templates.map { CampaignResponse.from(it) })
    }

    @PostMapping("/templates/{templateId}/create")
    @PreAuthorize("hasAuthority('marketing_campaigns_create')")
    @Operation(summary = "Create campaign from template")
    fun createFromTemplate(
        @PathVariable templateId: UUID,
        @Valid @RequestBody request: CreateFromTemplateRequest
    ): ResponseEntity<CampaignResponse> {
        val campaign = campaignService.createCampaignFromTemplate(templateId, request.name)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(CampaignResponse.from(campaign))
    }
}
