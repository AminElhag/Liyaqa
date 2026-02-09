package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ChangeSubscriptionPlanRequest
import com.liyaqa.platform.api.dto.ClientSubscriptionResponse
import com.liyaqa.platform.api.dto.ClientSubscriptionSummaryResponse
import com.liyaqa.platform.api.dto.CreateClientSubscriptionRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.RenewSubscriptionRequest
import com.liyaqa.platform.api.dto.SubscriptionStatsResponse
import com.liyaqa.platform.api.dto.UpdateClientSubscriptionRequest
import com.liyaqa.platform.application.services.ClientSubscriptionService
import com.liyaqa.platform.domain.model.ClientSubscriptionStatus
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
 * Controller for managing client subscriptions.
 * Accessible by platform users (internal Liyaqa team) only.
 *
 * Endpoints:
 * - GET    /api/platform/subscriptions                - List all subscriptions
 * - GET    /api/platform/subscriptions/stats          - Get subscription statistics
 * - GET    /api/platform/subscriptions/expiring       - Get expiring subscriptions
 * - GET    /api/platform/subscriptions/trials/expiring- Get expiring trials
 * - GET    /api/platform/subscriptions/{id}           - Get subscription details
 * - POST   /api/platform/subscriptions                - Create subscription
 * - PUT    /api/platform/subscriptions/{id}           - Update subscription
 * - POST   /api/platform/subscriptions/{id}/activate  - Activate subscription
 * - POST   /api/platform/subscriptions/{id}/suspend   - Suspend subscription
 * - POST   /api/platform/subscriptions/{id}/cancel    - Cancel subscription
 * - POST   /api/platform/subscriptions/{id}/renew     - Renew subscription
 * - POST   /api/platform/subscriptions/{id}/change-plan - Change subscription plan
 */
@RestController
@RequestMapping("/api/platform/subscriptions")
@PlatformSecured
@Tag(name = "Client Management", description = "Manage client subscriptions")
class ClientSubscriptionController(
    private val subscriptionService: ClientSubscriptionService
) {
    /**
     * Creates a new subscription.
     * Only PLATFORM_ADMIN and SALES_REP can create subscriptions.
     */
    @Operation(summary = "Create a subscription", description = "Creates a new client subscription. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "Subscription created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "409", description = "Organization already has an active subscription")
    ])
    @PostMapping
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun createSubscription(
        @Valid @RequestBody request: CreateClientSubscriptionRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.createSubscription(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Gets a subscription by ID.
     */
    @Operation(summary = "Get a subscription by ID", description = "Retrieves the details of a specific client subscription.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription found"),
        ApiResponse(responseCode = "404", description = "Subscription not found")
    ])
    @GetMapping("/{id}")
    fun getSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.getSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Lists all subscriptions with pagination.
     */
    @Operation(summary = "List all subscriptions", description = "Returns a paginated list of all client subscriptions with optional status filtering.")
    @ApiResponse(responseCode = "200", description = "Subscriptions retrieved successfully")
    @GetMapping
    fun getAllSubscriptions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) status: ClientSubscriptionStatus?
    ): ResponseEntity<PageResponse<ClientSubscriptionResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val subscriptionsPage = if (status != null) {
            subscriptionService.getSubscriptionsByStatus(status, pageable)
        } else {
            subscriptionService.getAllSubscriptions(pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { ClientSubscriptionResponse.from(it) },
                page = subscriptionsPage.number,
                size = subscriptionsPage.size,
                totalElements = subscriptionsPage.totalElements,
                totalPages = subscriptionsPage.totalPages,
                first = subscriptionsPage.isFirst,
                last = subscriptionsPage.isLast
            )
        )
    }

    /**
     * Gets subscriptions for a specific organization.
     */
    @Operation(summary = "List subscriptions by organization", description = "Returns a paginated list of subscriptions for a specific organization.")
    @ApiResponse(responseCode = "200", description = "Organization subscriptions retrieved successfully")
    @GetMapping("/organization/{organizationId}")
    fun getSubscriptionsByOrganization(
        @PathVariable organizationId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientSubscriptionSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val subscriptionsPage = subscriptionService.getSubscriptionsByOrganizationPaged(organizationId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { ClientSubscriptionSummaryResponse.from(it) },
                page = subscriptionsPage.number,
                size = subscriptionsPage.size,
                totalElements = subscriptionsPage.totalElements,
                totalPages = subscriptionsPage.totalPages,
                first = subscriptionsPage.isFirst,
                last = subscriptionsPage.isLast
            )
        )
    }

    /**
     * Gets the active subscription for an organization.
     */
    @Operation(summary = "Get active subscription for organization", description = "Retrieves the currently active subscription for a specific organization.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Active subscription found"),
        ApiResponse(responseCode = "404", description = "No active subscription found for the organization")
    ])
    @GetMapping("/organization/{organizationId}/active")
    fun getActiveSubscription(
        @PathVariable organizationId: UUID
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.getActiveSubscription(organizationId)
            ?: throw NoSuchElementException("No active subscription found for organization: $organizationId")
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Gets subscriptions for a specific sales rep.
     */
    @Operation(summary = "List subscriptions by sales rep", description = "Returns a paginated list of subscriptions managed by a specific sales representative.")
    @ApiResponse(responseCode = "200", description = "Sales rep subscriptions retrieved successfully")
    @GetMapping("/sales-rep/{salesRepId}")
    fun getSubscriptionsBySalesRep(
        @PathVariable salesRepId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ClientSubscriptionSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val subscriptionsPage = subscriptionService.getSubscriptionsBySalesRep(salesRepId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { ClientSubscriptionSummaryResponse.from(it) },
                page = subscriptionsPage.number,
                size = subscriptionsPage.size,
                totalElements = subscriptionsPage.totalElements,
                totalPages = subscriptionsPage.totalPages,
                first = subscriptionsPage.isFirst,
                last = subscriptionsPage.isLast
            )
        )
    }

    /**
     * Gets expiring subscriptions.
     */
    @Operation(summary = "Get expiring subscriptions", description = "Returns subscriptions that are expiring within the specified number of days ahead.")
    @ApiResponse(responseCode = "200", description = "Expiring subscriptions retrieved successfully")
    @GetMapping("/expiring")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<ClientSubscriptionSummaryResponse>> {
        val subscriptions = subscriptionService.getExpiringSubscriptions(daysAhead)
        return ResponseEntity.ok(subscriptions.map { ClientSubscriptionSummaryResponse.from(it) })
    }

    /**
     * Gets expiring trials.
     */
    @Operation(summary = "Get expiring trials", description = "Returns trial subscriptions that are expiring within the specified number of days ahead.")
    @ApiResponse(responseCode = "200", description = "Expiring trials retrieved successfully")
    @GetMapping("/trials/expiring")
    fun getExpiringTrials(
        @RequestParam(defaultValue = "7") daysAhead: Int
    ): ResponseEntity<List<ClientSubscriptionSummaryResponse>> {
        val subscriptions = subscriptionService.getExpiringTrials(daysAhead)
        return ResponseEntity.ok(subscriptions.map { ClientSubscriptionSummaryResponse.from(it) })
    }

    /**
     * Gets subscription statistics.
     */
    @Operation(summary = "Get subscription statistics", description = "Returns aggregated statistics about all client subscriptions.")
    @ApiResponse(responseCode = "200", description = "Subscription statistics retrieved successfully")
    @GetMapping("/stats")
    fun getSubscriptionStats(): ResponseEntity<SubscriptionStatsResponse> {
        val stats = subscriptionService.getSubscriptionStats()
        return ResponseEntity.ok(SubscriptionStatsResponse.from(stats))
    }

    /**
     * Updates a subscription.
     * Only PLATFORM_ADMIN and SALES_REP can update subscriptions.
     */
    @Operation(summary = "Update a subscription", description = "Updates an existing client subscription. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Subscription not found")
    ])
    @PutMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun updateSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateClientSubscriptionRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.updateSubscription(id, request.toCommand())
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Activates a subscription.
     * Only PLATFORM_ADMIN can activate subscriptions.
     */
    @Operation(summary = "Activate a subscription", description = "Transitions a subscription to active status. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription activated successfully"),
        ApiResponse(responseCode = "404", description = "Subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription cannot be activated from its current state")
    ])
    @PostMapping("/{id}/activate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun activateSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.activateSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Suspends a subscription.
     * Only PLATFORM_ADMIN can suspend subscriptions.
     */
    @Operation(summary = "Suspend a subscription", description = "Suspends an active subscription. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription suspended successfully"),
        ApiResponse(responseCode = "404", description = "Subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription cannot be suspended from its current state")
    ])
    @PostMapping("/{id}/suspend")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun suspendSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.suspendSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Cancels a subscription.
     * Only PLATFORM_ADMIN can cancel subscriptions.
     */
    @Operation(summary = "Cancel a subscription", description = "Cancels an active or suspended subscription. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription cancelled successfully"),
        ApiResponse(responseCode = "404", description = "Subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription cannot be cancelled from its current state")
    ])
    @PostMapping("/{id}/cancel")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun cancelSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.cancelSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Renews a subscription.
     * Only PLATFORM_ADMIN and SALES_REP can renew subscriptions.
     */
    @Operation(summary = "Renew a subscription", description = "Renews an existing subscription with new terms. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription renewed successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription cannot be renewed from its current state")
    ])
    @PostMapping("/{id}/renew")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun renewSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RenewSubscriptionRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.renewSubscription(id, request.toCommand())
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Changes the plan for a subscription (upgrade/downgrade).
     * Only PLATFORM_ADMIN and SALES_REP can change plans.
     */
    @Operation(summary = "Change subscription plan", description = "Changes the plan for an existing subscription (upgrade or downgrade). Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Subscription plan changed successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Subscription or target plan not found"),
        ApiResponse(responseCode = "422", description = "Plan change not allowed from current subscription state")
    ])
    @PostMapping("/{id}/change-plan")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun changePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeSubscriptionPlanRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.changePlan(id, request.toCommand())
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }
}
