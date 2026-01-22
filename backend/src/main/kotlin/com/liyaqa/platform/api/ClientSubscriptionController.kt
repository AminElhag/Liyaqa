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
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
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
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'MARKETING', 'SUPPORT')")
class ClientSubscriptionController(
    private val subscriptionService: ClientSubscriptionService
) {
    /**
     * Creates a new subscription.
     * Only PLATFORM_ADMIN and SALES_REP can create subscriptions.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun createSubscription(
        @Valid @RequestBody request: CreateClientSubscriptionRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.createSubscription(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Gets a subscription by ID.
     */
    @GetMapping("/{id}")
    fun getSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.getSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Lists all subscriptions with pagination.
     */
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
    @GetMapping("/stats")
    fun getSubscriptionStats(): ResponseEntity<SubscriptionStatsResponse> {
        val stats = subscriptionService.getSubscriptionStats()
        return ResponseEntity.ok(SubscriptionStatsResponse.from(stats))
    }

    /**
     * Updates a subscription.
     * Only PLATFORM_ADMIN and SALES_REP can update subscriptions.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
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
    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun activateSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.activateSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Suspends a subscription.
     * Only PLATFORM_ADMIN can suspend subscriptions.
     */
    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun suspendSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.suspendSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Cancels a subscription.
     * Only PLATFORM_ADMIN can cancel subscriptions.
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun cancelSubscription(@PathVariable id: UUID): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.cancelSubscription(id)
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }

    /**
     * Renews a subscription.
     * Only PLATFORM_ADMIN and SALES_REP can renew subscriptions.
     */
    @PostMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
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
    @PostMapping("/{id}/change-plan")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun changePlan(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeSubscriptionPlanRequest
    ): ResponseEntity<ClientSubscriptionResponse> {
        val subscription = subscriptionService.changePlan(id, request.toCommand())
        return ResponseEntity.ok(ClientSubscriptionResponse.from(subscription))
    }
}
