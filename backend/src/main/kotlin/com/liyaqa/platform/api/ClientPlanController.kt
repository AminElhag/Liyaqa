package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ClientPlanResponse
import com.liyaqa.platform.api.dto.ClientPlanSummaryResponse
import com.liyaqa.platform.api.dto.CreateClientPlanRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.UpdateClientPlanRequest
import com.liyaqa.platform.application.services.ClientPlanService
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

/**
 * Controller for managing B2B client plans (pricing tiers).
 * Accessible by platform users (internal Liyaqa team) only.
 *
 * Endpoints:
 * - GET    /api/platform/plans           - List all plans
 * - GET    /api/platform/plans/active    - List active plans only
 * - GET    /api/platform/plans/{id}      - Get plan details
 * - POST   /api/platform/plans           - Create new plan (PLATFORM_ADMIN only)
 * - PUT    /api/platform/plans/{id}      - Update plan (PLATFORM_ADMIN only)
 * - POST   /api/platform/plans/{id}/activate   - Activate plan
 * - POST   /api/platform/plans/{id}/deactivate - Deactivate plan
 * - DELETE /api/platform/plans/{id}      - Delete plan (PLATFORM_ADMIN only)
 */
@RestController
@RequestMapping("/api/platform/plans")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'MARKETING', 'SUPPORT')")
class ClientPlanController(
    private val clientPlanService: ClientPlanService
) {
    /**
     * Creates a new client plan.
     * Only PLATFORM_ADMIN can create plans.
     */
    @PostMapping
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun createPlan(@Valid @RequestBody request: CreateClientPlanRequest): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.createPlan(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientPlanResponse.from(plan))
    }

    /**
     * Gets a client plan by ID.
     */
    @GetMapping("/{id}")
    fun getPlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.getPlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Lists all client plans with pagination.
     */
    @GetMapping
    fun getAllPlans(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientPlanResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val plansPage = clientPlanService.getAllPlans(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = plansPage.content.map { ClientPlanResponse.from(it) },
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
     * Lists only active client plans.
     */
    @GetMapping("/active")
    fun getActivePlans(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<ClientPlanResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val plansPage = clientPlanService.getActivePlans(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = plansPage.content.map { ClientPlanResponse.from(it) },
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
     * Lists active plans ordered by sort order (no pagination).
     * Useful for dropdowns and plan selection.
     */
    @GetMapping("/active/list")
    fun getActivePlansOrdered(): ResponseEntity<List<ClientPlanSummaryResponse>> {
        val plans = clientPlanService.getActivePlansOrdered()
        return ResponseEntity.ok(plans.map { ClientPlanSummaryResponse.from(it) })
    }

    /**
     * Updates a client plan.
     * Only PLATFORM_ADMIN can update plans.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun updatePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClientPlanRequest
    ): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.updatePlan(id, request.toCommand())
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Activates a client plan.
     * Only PLATFORM_ADMIN can activate plans.
     */
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun activatePlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.activatePlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Deactivates a client plan.
     * Only PLATFORM_ADMIN can deactivate plans.
     */
    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun deactivatePlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.deactivatePlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Deletes a client plan.
     * Only PLATFORM_ADMIN can delete plans.
     * Note: Cannot delete plans with active subscriptions.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun deletePlan(@PathVariable id: UUID): ResponseEntity<Unit> {
        clientPlanService.deletePlan(id)
        return ResponseEntity.noContent().build()
    }
}
