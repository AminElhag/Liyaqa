package com.liyaqa.platform.subscription.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.subscription.dto.CreateSubscriptionPlanRequest
import com.liyaqa.platform.subscription.dto.PlanComparisonResponse
import com.liyaqa.platform.subscription.dto.SubscriptionPlanResponse
import com.liyaqa.platform.subscription.dto.UpdateSubscriptionPlanRequest
import com.liyaqa.platform.subscription.service.SubscriptionPlanService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
@RequestMapping("/api/v1/platform/subscriptions/plans")
@PlatformSecured
@Tag(name = "Subscription Plans", description = "Manage subscription plans and tiers")
class SubscriptionPlanController(
    private val subscriptionPlanService: SubscriptionPlanService
) {

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.PLANS_CREATE])
    @Operation(summary = "Create a subscription plan", description = "Creates a new subscription plan with the specified tiers and pricing")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Subscription plan created successfully"),
        ApiResponse(responseCode = "409", description = "A plan with the same name already exists")
    )
    fun createPlan(
        @Valid @RequestBody request: CreateSubscriptionPlanRequest
    ): ResponseEntity<SubscriptionPlanResponse> {
        val plan = subscriptionPlanService.createPlan(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(SubscriptionPlanResponse.from(plan))
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "List subscription plans", description = "Returns all subscription plans, optionally filtered to active-only")
    @ApiResponse(responseCode = "200", description = "List of subscription plans")
    fun listPlans(
        @RequestParam(defaultValue = "false") activeOnly: Boolean
    ): ResponseEntity<List<SubscriptionPlanResponse>> {
        val plans = subscriptionPlanService.listPlans(activeOnly)
        return ResponseEntity.ok(plans.map { SubscriptionPlanResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "Get a subscription plan by ID", description = "Returns the details of a specific subscription plan")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription plan found"),
        ApiResponse(responseCode = "404", description = "Subscription plan not found")
    )
    fun getPlan(@PathVariable id: UUID): ResponseEntity<SubscriptionPlanResponse> {
        val plan = subscriptionPlanService.getPlan(id)
        return ResponseEntity.ok(SubscriptionPlanResponse.from(plan))
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_EDIT])
    @Operation(summary = "Update a subscription plan", description = "Updates the details of an existing subscription plan")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription plan updated successfully"),
        ApiResponse(responseCode = "404", description = "Subscription plan not found")
    )
    fun updatePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSubscriptionPlanRequest
    ): ResponseEntity<SubscriptionPlanResponse> {
        val plan = subscriptionPlanService.updatePlan(id, request.toCommand())
        return ResponseEntity.ok(SubscriptionPlanResponse.from(plan))
    }

    @DeleteMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_DELETE])
    @Operation(summary = "Delete a subscription plan", description = "Soft-deletes a subscription plan by marking it inactive")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription plan deleted successfully"),
        ApiResponse(responseCode = "404", description = "Subscription plan not found")
    )
    fun deletePlan(@PathVariable id: UUID): ResponseEntity<SubscriptionPlanResponse> {
        val plan = subscriptionPlanService.deletePlan(id)
        return ResponseEntity.ok(SubscriptionPlanResponse.from(plan))
    }

    @GetMapping("/compare")
    @PlatformSecured(permissions = [PlatformPermission.PLANS_VIEW])
    @Operation(summary = "Compare subscription plans", description = "Returns a side-by-side comparison of the specified subscription plans")
    @ApiResponse(responseCode = "200", description = "Plan comparison result")
    fun comparePlans(@RequestParam ids: List<UUID>): ResponseEntity<PlanComparisonResponse> {
        val plans = subscriptionPlanService.comparePlans(ids)
        return ResponseEntity.ok(PlanComparisonResponse(plans.map { SubscriptionPlanResponse.from(it) }))
    }
}
