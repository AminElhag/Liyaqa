package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.MembershipPlanService
import com.liyaqa.membership.domain.model.MembershipPlanStatus
import com.liyaqa.membership.domain.model.MembershipPlanType
import com.liyaqa.organization.api.PageResponse
import jakarta.validation.Valid
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
@RequestMapping("/api/membership-plans")
class MembershipPlanController(
    private val membershipPlanService: MembershipPlanService
) {
    /**
     * Creates a new membership plan.
     */
    @PostMapping
    @PreAuthorize("hasAuthority('plans_create')")
    fun createPlan(@Valid @RequestBody request: CreateMembershipPlanRequest): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.createPlan(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(MembershipPlanResponse.from(plan))
    }

    /**
     * Gets a membership plan by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('plans_view')")
    fun getPlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.getPlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Lists all membership plans with optional filtering by active status, plan status, or plan type.
     */
    @GetMapping
    @PreAuthorize("hasAuthority('plans_view')")
    fun getAllPlans(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String,
        @RequestParam(required = false) active: Boolean?,
        @RequestParam(required = false) status: MembershipPlanStatus?,
        @RequestParam(required = false) planType: MembershipPlanType?
    ): ResponseEntity<PageResponse<MembershipPlanResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val plansPage = when {
            status != null -> membershipPlanService.getPlansByStatus(status, pageable)
            planType != null -> membershipPlanService.getPlansByType(planType, pageable)
            active != null -> membershipPlanService.getPlansByActiveStatus(active, pageable)
            else -> membershipPlanService.getAllPlans(pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = plansPage.content.map { MembershipPlanResponse.from(it) },
                page = plansPage.number,
                size = plansPage.size,
                totalElements = plansPage.totalElements,
                totalPages = plansPage.totalPages,
                first = plansPage.isFirst,
                last = plansPage.isLast
            )
        )
    }

    /**
     * Lists only active membership plans.
     */
    @GetMapping("/active")
    @PreAuthorize("hasAuthority('plans_view')")
    fun getActivePlans(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<MembershipPlanResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val plansPage = membershipPlanService.getActivePlans(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = plansPage.content.map { MembershipPlanResponse.from(it) },
                page = plansPage.number,
                size = plansPage.size,
                totalElements = plansPage.totalElements,
                totalPages = plansPage.totalPages,
                first = plansPage.isFirst,
                last = plansPage.isLast
            )
        )
    }

    /**
     * Updates a membership plan.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('plans_update')")
    fun updatePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateMembershipPlanRequest
    ): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.updatePlan(id, request.toCommand())
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Activates a membership plan.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('plans_update')")
    fun activatePlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.activatePlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Deactivates a membership plan.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('plans_update')")
    fun deactivatePlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.deactivatePlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Archives a membership plan.
     */
    @PostMapping("/{id}/archive")
    @PreAuthorize("hasAuthority('plans_update')")
    fun archivePlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.archivePlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Reactivates an archived membership plan.
     */
    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('plans_update')")
    fun reactivatePlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.reactivatePlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Publishes a draft plan (DRAFT -> ACTIVE).
     */
    @PostMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('plans_update')")
    fun publishPlan(@PathVariable id: UUID): ResponseEntity<MembershipPlanResponse> {
        val plan = membershipPlanService.publishPlan(id)
        return ResponseEntity.ok(MembershipPlanResponse.from(plan))
    }

    /**
     * Gets plan statistics.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('plans_view')")
    fun getPlanStats(): ResponseEntity<PlanStatsResponse> {
        val stats = membershipPlanService.getPlanStats()
        return ResponseEntity.ok(
            PlanStatsResponse(
                totalPlans = stats["totalPlans"] ?: 0,
                activePlans = stats["activePlans"] ?: 0,
                draftPlans = stats["draftPlans"] ?: 0,
                archivedPlans = stats["archivedPlans"] ?: 0
            )
        )
    }

    /**
     * Deletes a membership plan.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('plans_delete')")
    fun deletePlan(@PathVariable id: UUID): ResponseEntity<Unit> {
        membershipPlanService.deletePlan(id)
        return ResponseEntity.noContent().build()
    }
}