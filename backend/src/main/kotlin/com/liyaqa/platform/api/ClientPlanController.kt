package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ClientPlanResponse
import com.liyaqa.platform.api.dto.ClientPlanSummaryResponse
import com.liyaqa.platform.api.dto.CreateClientPlanRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.UpdateClientPlanRequest
import com.liyaqa.platform.application.services.ClientPlanService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
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
@PlatformSecured
@Tag(name = "Client Management", description = "Manage client subscription plans")
class ClientPlanController(
    private val clientPlanService: ClientPlanService
) {
    /**
     * Creates a new client plan.
     * PLATFORM_ADMIN and SALES_REP can create plans (needed for quick plan creation during onboarding).
     */
    @Operation(summary = "Create a client plan", description = "Creates a new client subscription plan. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "Plan created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "409", description = "Plan with the same name already exists")
    ])
    @PostMapping
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun createPlan(@Valid @RequestBody request: CreateClientPlanRequest): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.createPlan(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientPlanResponse.from(plan))
    }

    /**
     * Gets a client plan by ID.
     */
    @Operation(summary = "Get a client plan by ID", description = "Retrieves the details of a specific client plan by its unique identifier.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Plan found"),
        ApiResponse(responseCode = "404", description = "Plan not found")
    ])
    @GetMapping("/{id}")
    fun getPlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.getPlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Lists all client plans with pagination.
     */
    @Operation(summary = "List all client plans", description = "Returns a paginated list of all client plans, with sorting support.")
    @ApiResponse(responseCode = "200", description = "Plans retrieved successfully")
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
    @Operation(summary = "List active client plans", description = "Returns a paginated list of only active client plans.")
    @ApiResponse(responseCode = "200", description = "Active plans retrieved successfully")
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
    @Operation(summary = "List active plans ordered", description = "Returns all active plans ordered by sort order without pagination. Useful for dropdowns and plan selection.")
    @ApiResponse(responseCode = "200", description = "Active ordered plans retrieved successfully")
    @GetMapping("/active/list")
    fun getActivePlansOrdered(): ResponseEntity<List<ClientPlanSummaryResponse>> {
        val plans = clientPlanService.getActivePlansOrdered()
        return ResponseEntity.ok(plans.map { ClientPlanSummaryResponse.from(it) })
    }

    /**
     * Updates a client plan.
     * Only PLATFORM_ADMIN can update plans.
     */
    @Operation(summary = "Update a client plan", description = "Updates an existing client plan. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Plan updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Plan not found")
    ])
    @PutMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun updatePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClientPlanRequest
    ): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.updatePlan(id, request.toCommand())
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Activates a client plan.
     * PLATFORM_ADMIN and SALES_REP can activate plans (needed for quick plan creation during onboarding).
     */
    @Operation(summary = "Activate a client plan", description = "Transitions a client plan to active status.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Plan activated successfully"),
        ApiResponse(responseCode = "404", description = "Plan not found"),
        ApiResponse(responseCode = "422", description = "Plan cannot be activated from its current state")
    ])
    @PostMapping("/{id}/activate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun activatePlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.activatePlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Deactivates a client plan.
     * Only PLATFORM_ADMIN can deactivate plans.
     */
    @Operation(summary = "Deactivate a client plan", description = "Transitions a client plan to inactive status. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Plan deactivated successfully"),
        ApiResponse(responseCode = "404", description = "Plan not found"),
        ApiResponse(responseCode = "422", description = "Plan cannot be deactivated from its current state")
    ])
    @PostMapping("/{id}/deactivate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun deactivatePlan(@PathVariable id: UUID): ResponseEntity<ClientPlanResponse> {
        val plan = clientPlanService.deactivatePlan(id)
        return ResponseEntity.ok(ClientPlanResponse.from(plan))
    }

    /**
     * Deletes a client plan.
     * Only PLATFORM_ADMIN can delete plans.
     * Note: Cannot delete plans with active subscriptions.
     */
    @Operation(summary = "Delete a client plan", description = "Deletes a client plan. Cannot delete plans with active subscriptions. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "204", description = "Plan deleted successfully"),
        ApiResponse(responseCode = "404", description = "Plan not found"),
        ApiResponse(responseCode = "409", description = "Plan has active subscriptions and cannot be deleted")
    ])
    @DeleteMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun deletePlan(@PathVariable id: UUID): ResponseEntity<Unit> {
        clientPlanService.deletePlan(id)
        return ResponseEntity.noContent().build()
    }
}
