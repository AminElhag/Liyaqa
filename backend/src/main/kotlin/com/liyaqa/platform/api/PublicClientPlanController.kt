package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.PublicClientPlanDto
import com.liyaqa.platform.application.services.ClientPlanService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Public API endpoint for client plans.
 * No authentication required - used by landing page for pricing display.
 */
@RestController
@RequestMapping("/api/public/plans")
@Tag(name = "Subscription Plans", description = "Public subscription plan listing")
class PublicClientPlanController(
    private val clientPlanService: ClientPlanService
) {

    /**
     * Get all active client plans for public display.
     * Returns plans ordered by sortOrder for consistent display.
     */
    @Operation(summary = "Get public subscription plans", description = "Returns all active subscription plans ordered for public pricing display. No authentication required.")
    @ApiResponse(responseCode = "200", description = "Plans retrieved successfully")
    @GetMapping
    fun getPublicPlans(): ResponseEntity<List<PublicClientPlanDto>> {
        val plans = clientPlanService.getActivePlansOrdered()
            .map { PublicClientPlanDto.from(it) }

        return ResponseEntity.ok(plans)
    }
}
