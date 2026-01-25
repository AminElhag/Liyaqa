package com.liyaqa.crm.api

import com.liyaqa.crm.application.commands.AssignLeadCommand
import com.liyaqa.crm.application.commands.BulkAssignLeadsCommand
import com.liyaqa.crm.application.commands.CompleteFollowUpCommand
import com.liyaqa.crm.application.commands.ConvertLeadCommand
import com.liyaqa.crm.application.commands.CreateLeadCommand
import com.liyaqa.crm.application.commands.LogLeadActivityCommand
import com.liyaqa.crm.application.commands.TransitionLeadStatusCommand
import com.liyaqa.crm.application.commands.UpdateLeadCommand
import com.liyaqa.crm.application.services.LeadActivityService
import com.liyaqa.crm.application.services.LeadService
import com.liyaqa.crm.domain.model.LeadSource
import com.liyaqa.crm.domain.model.LeadStatus
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/leads")
@Tag(name = "Leads", description = "CRM Lead Management - manage sales pipeline and lead activities")
class LeadController(
    private val leadService: LeadService,
    private val leadActivityService: LeadActivityService
) {

    // ===== Lead CRUD =====

    @PostMapping
    @PreAuthorize("hasAuthority('leads_create')")
    @Operation(summary = "Create a new lead")
    fun createLead(@Valid @RequestBody request: CreateLeadRequest): ResponseEntity<LeadResponse> {
        val command = CreateLeadCommand(
            name = request.name,
            email = request.email,
            phone = request.phone,
            source = request.source,
            assignedToUserId = request.assignedToUserId,
            notes = request.notes,
            priority = request.priority,
            expectedConversionDate = request.expectedConversionDate,
            campaignSource = request.campaignSource,
            campaignMedium = request.campaignMedium,
            campaignName = request.campaignName
        )
        val lead = leadService.createLead(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(LeadResponse.from(lead))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get a lead by ID")
    fun getLead(@PathVariable id: UUID): ResponseEntity<LeadResponse> {
        val lead = leadService.getLead(id)
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Update a lead")
    fun updateLead(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateLeadRequest
    ): ResponseEntity<LeadResponse> {
        val command = UpdateLeadCommand(
            name = request.name,
            email = request.email,
            phone = request.phone,
            source = request.source,
            assignedToUserId = request.assignedToUserId,
            notes = request.notes,
            priority = request.priority,
            expectedConversionDate = request.expectedConversionDate
        )
        val lead = leadService.updateLead(id, command)
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('leads_delete')")
    @Operation(summary = "Delete a lead")
    fun deleteLead(@PathVariable id: UUID): ResponseEntity<Void> {
        leadService.deleteLead(id)
        return ResponseEntity.noContent().build()
    }

    // ===== Lead Search & List =====

    @GetMapping
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Search leads with filters")
    fun searchLeads(
        @RequestParam(required = false) search: String?,
        @RequestParam(required = false) status: LeadStatus?,
        @RequestParam(required = false) source: LeadSource?,
        @RequestParam(required = false) assignedToUserId: UUID?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) createdAfter: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) createdBefore: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<PageResponse<LeadResponse>> {
        val sort = Sort.by(
            if (sortDir.equals("asc", ignoreCase = true)) Sort.Direction.ASC else Sort.Direction.DESC,
            sortBy
        )
        val pageable = PageRequest.of(page, size, sort)

        val leads = leadService.searchLeads(
            search = search,
            status = status,
            source = source,
            assignedToUserId = assignedToUserId,
            createdAfter = createdAfter,
            createdBefore = createdBefore,
            pageable = pageable
        )

        return ResponseEntity.ok(PageResponse.from(leads.map { LeadResponse.from(it) }))
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get active (non-terminal) leads")
    fun getActiveLeads(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val leads = leadService.getActiveLeads(pageable)
        return ResponseEntity.ok(PageResponse.from(leads.map { LeadResponse.from(it) }))
    }

    @GetMapping("/unassigned")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get unassigned leads")
    fun getUnassignedLeads(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val leads = leadService.getUnassignedLeads(pageable)
        return ResponseEntity.ok(PageResponse.from(leads.map { LeadResponse.from(it) }))
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get leads assigned to current user")
    fun getMyLeads(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadResponse>> {
        val userId = getCurrentUserId()
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val leads = leadService.getLeadsAssignedTo(userId, pageable)
        return ResponseEntity.ok(PageResponse.from(leads.map { LeadResponse.from(it) }))
    }

    // ===== Status Transitions =====

    @PostMapping("/{id}/transition")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Transition lead status")
    fun transitionStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: TransitionStatusRequest
    ): ResponseEntity<LeadResponse> {
        val command = TransitionLeadStatusCommand(
            leadId = id,
            newStatus = request.status,
            reason = request.reason,
            memberId = request.memberId
        )
        val lead = leadService.transitionStatus(command)
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/contact")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Mark lead as contacted")
    fun markContacted(@PathVariable id: UUID): ResponseEntity<LeadResponse> {
        val lead = leadService.transitionStatus(
            TransitionLeadStatusCommand(leadId = id, newStatus = LeadStatus.CONTACTED)
        )
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/schedule-tour")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Schedule tour for lead")
    fun scheduleTour(@PathVariable id: UUID): ResponseEntity<LeadResponse> {
        val lead = leadService.transitionStatus(
            TransitionLeadStatusCommand(leadId = id, newStatus = LeadStatus.TOUR_SCHEDULED)
        )
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/start-trial")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Start trial for lead")
    fun startTrial(@PathVariable id: UUID): ResponseEntity<LeadResponse> {
        val lead = leadService.transitionStatus(
            TransitionLeadStatusCommand(leadId = id, newStatus = LeadStatus.TRIAL)
        )
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAuthority('leads_convert')")
    @Operation(summary = "Convert lead to member")
    fun convertLead(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ConvertLeadRequest
    ): ResponseEntity<LeadResponse> {
        val command = ConvertLeadCommand(leadId = id, memberId = request.memberId)
        val lead = leadService.convertLead(command)
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/mark-lost")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Mark lead as lost")
    fun markLost(
        @PathVariable id: UUID,
        @RequestParam(required = false) reason: String?
    ): ResponseEntity<LeadResponse> {
        val lead = leadService.transitionStatus(
            TransitionLeadStatusCommand(leadId = id, newStatus = LeadStatus.LOST, reason = reason)
        )
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/{id}/reopen")
    @PreAuthorize("hasAuthority('leads_update')")
    @Operation(summary = "Reopen a lost lead")
    fun reopenLead(@PathVariable id: UUID): ResponseEntity<LeadResponse> {
        val lead = leadService.transitionStatus(
            TransitionLeadStatusCommand(leadId = id, newStatus = LeadStatus.NEW)
        )
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    // ===== Assignment =====

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Assign lead to a user")
    fun assignLead(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignLeadRequest
    ): ResponseEntity<LeadResponse> {
        val command = AssignLeadCommand(leadId = id, assignToUserId = request.assignToUserId)
        val lead = leadService.assignLead(command)
        return ResponseEntity.ok(LeadResponse.from(lead))
    }

    @PostMapping("/bulk-assign")
    @PreAuthorize("hasAuthority('leads_assign')")
    @Operation(summary = "Bulk assign leads to a user")
    fun bulkAssign(@Valid @RequestBody request: BulkAssignRequest): ResponseEntity<List<LeadResponse>> {
        val command = BulkAssignLeadsCommand(
            leadIds = request.leadIds,
            assignToUserId = request.assignToUserId
        )
        val leads = leadService.bulkAssignLeads(command)
        return ResponseEntity.ok(leads.map { LeadResponse.from(it) })
    }

    // ===== Activities =====

    @PostMapping("/{id}/activities")
    @PreAuthorize("hasAuthority('lead_activities_create')")
    @Operation(summary = "Log an activity for a lead")
    fun logActivity(
        @PathVariable id: UUID,
        @Valid @RequestBody request: LogActivityRequest
    ): ResponseEntity<LeadActivityResponse> {
        val command = LogLeadActivityCommand(
            leadId = id,
            type = request.type,
            notes = request.notes,
            contactMethod = request.contactMethod,
            outcome = request.outcome,
            followUpDate = request.followUpDate,
            durationMinutes = request.durationMinutes,
            performedByUserId = getCurrentUserId()
        )
        val activity = leadActivityService.logActivity(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(LeadActivityResponse.from(activity))
    }

    @GetMapping("/{id}/activities")
    @PreAuthorize("hasAuthority('lead_activities_read')")
    @Operation(summary = "Get activities for a lead")
    fun getLeadActivities(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadActivityResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val activities = leadActivityService.getActivitiesForLead(id, pageable)
        return ResponseEntity.ok(PageResponse.from(activities.map { LeadActivityResponse.from(it) }))
    }

    @PostMapping("/activities/{activityId}/complete")
    @PreAuthorize("hasAuthority('lead_activities_create')")
    @Operation(summary = "Complete a follow-up activity")
    fun completeFollowUp(
        @PathVariable activityId: UUID,
        @Valid @RequestBody request: CompleteFollowUpRequest
    ): ResponseEntity<LeadActivityResponse> {
        val command = CompleteFollowUpCommand(
            activityId = activityId,
            outcome = request.outcome,
            notes = request.notes
        )
        val activity = leadActivityService.completeFollowUp(command)
        return ResponseEntity.ok(LeadActivityResponse.from(activity))
    }

    @DeleteMapping("/activities/{activityId}")
    @PreAuthorize("hasAuthority('lead_activities_create')")
    @Operation(summary = "Delete an activity")
    fun deleteActivity(@PathVariable activityId: UUID): ResponseEntity<Void> {
        leadActivityService.deleteActivity(activityId)
        return ResponseEntity.noContent().build()
    }

    // ===== Follow-ups =====

    @GetMapping("/follow-ups/pending")
    @PreAuthorize("hasAuthority('lead_activities_read')")
    @Operation(summary = "Get pending follow-ups")
    fun getPendingFollowUps(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadActivityResponse>> {
        val pageable = PageRequest.of(page, size)
        val activities = leadActivityService.getPendingFollowUps(pageable)
        return ResponseEntity.ok(PageResponse.from(activities.map { LeadActivityResponse.from(it) }))
    }

    @GetMapping("/follow-ups/overdue")
    @PreAuthorize("hasAuthority('lead_activities_read')")
    @Operation(summary = "Get overdue follow-ups")
    fun getOverdueFollowUps(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<LeadActivityResponse>> {
        val pageable = PageRequest.of(page, size)
        val activities = leadActivityService.getOverdueFollowUps(pageable)
        return ResponseEntity.ok(PageResponse.from(activities.map { LeadActivityResponse.from(it) }))
    }

    // ===== Statistics =====

    @GetMapping("/stats/pipeline")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get pipeline statistics")
    fun getPipelineStats(): ResponseEntity<PipelineStatsResponse> {
        val byStatus = leadService.getPipelineStats()
        val total = byStatus.values.sum()
        val active = byStatus.filterKeys { it !in listOf(LeadStatus.WON, LeadStatus.LOST) }.values.sum()
        val conversionRate = leadService.getConversionRate(
            LocalDate.now().minusMonths(1),
            LocalDate.now()
        )
        return ResponseEntity.ok(
            PipelineStatsResponse(
                byStatus = byStatus,
                total = total,
                active = active,
                conversionRate = conversionRate
            )
        )
    }

    @GetMapping("/stats/sources")
    @PreAuthorize("hasAuthority('leads_read')")
    @Operation(summary = "Get source statistics")
    fun getSourceStats(): ResponseEntity<SourceStatsResponse> {
        val bySource = leadService.getSourceStats()
        return ResponseEntity.ok(
            SourceStatsResponse(
                bySource = bySource,
                total = bySource.values.sum()
            )
        )
    }

    @GetMapping("/stats/activities")
    @PreAuthorize("hasAuthority('lead_activities_read')")
    @Operation(summary = "Get activity statistics")
    fun getActivityStats(): ResponseEntity<ActivityStatsResponse> {
        val stats = leadActivityService.getActivityStats()
        return ResponseEntity.ok(
            ActivityStatsResponse(
                totalActivities = stats.totalActivities,
                pendingFollowUps = stats.pendingFollowUps,
                overdueFollowUps = stats.overdueFollowUps,
                byType = stats.activitiesByType
            )
        )
    }

    private fun getCurrentUserId(): UUID {
        val auth = SecurityContextHolder.getContext().authentication
            ?: throw IllegalStateException("No authentication found in security context")
        return UUID.fromString(auth.name)
    }
}
