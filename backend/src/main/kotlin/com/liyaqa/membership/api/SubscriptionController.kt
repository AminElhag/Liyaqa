package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.organization.api.PageResponse
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

@RestController
@RequestMapping("/api")
class SubscriptionController(
    private val subscriptionService: SubscriptionService
) {
    /**
     * Creates a new subscription for a member.
     */
    @PostMapping("/members/{memberId}/subscriptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun createSubscription(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CreateSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        // Ensure memberId in path matches request
        val command = request.copy(memberId = memberId).toCommand()
        val subscription = subscriptionService.createSubscription(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(SubscriptionResponse.from(subscription))
    }

    /**
     * Gets all subscriptions for a member.
     */
    @GetMapping("/members/{memberId}/subscriptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF') or @securityService.isSelf(#memberId)")
    fun getSubscriptionsByMember(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "startDate") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val subscriptionsPage = subscriptionService.getSubscriptionsByMember(memberId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { SubscriptionResponse.from(it) },
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
     * Gets the active subscription for a member.
     */
    @GetMapping("/members/{memberId}/subscriptions/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF') or @securityService.isSelf(#memberId)")
    fun getActiveSubscription(@PathVariable memberId: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.getActiveSubscription(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Gets a subscription by ID.
     */
    @GetMapping("/subscriptions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.getSubscription(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Lists all subscriptions.
     */
    @GetMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getAllSubscriptions(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val subscriptionsPage = subscriptionService.getAllSubscriptions(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { SubscriptionResponse.from(it) },
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
     * Lists subscriptions by status.
     */
    @GetMapping("/subscriptions/status/{status}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getSubscriptionsByStatus(
        @PathVariable status: SubscriptionStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val pageable = PageRequest.of(page, size)
        val subscriptionsPage = subscriptionService.getSubscriptionsByStatus(status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { SubscriptionResponse.from(it) },
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
     * Lists subscriptions expiring within the given number of days.
     */
    @GetMapping("/subscriptions/expiring")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "7") daysAhead: Int,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val pageable = PageRequest.of(page, size)
        val subscriptionsPage = subscriptionService.getExpiringSubscriptions(daysAhead, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { SubscriptionResponse.from(it) },
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
     * Updates a subscription.
     */
    @PutMapping("/subscriptions/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun updateSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.updateSubscription(id, request.toCommand())
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Freezes a subscription.
     */
    @PostMapping("/subscriptions/{id}/freeze")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun freezeSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.freezeSubscription(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Unfreezes a subscription.
     */
    @PostMapping("/subscriptions/{id}/unfreeze")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun unfreezeSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.unfreezeSubscription(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Cancels a subscription.
     */
    @PostMapping("/subscriptions/{id}/cancel")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun cancelSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.cancelSubscription(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Renews a subscription.
     */
    @PostMapping("/subscriptions/{id}/renew")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun renewSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RenewSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.renewSubscription(id, request.toCommand())
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Uses a class from the subscription.
     */
    @PostMapping("/subscriptions/{id}/use-class")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun useClass(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.useClass(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }

    /**
     * Uses a guest pass from the subscription.
     */
    @PostMapping("/subscriptions/{id}/use-guest-pass")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'CLUB_ADMIN', 'STAFF')")
    fun useGuestPass(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.useGuestPass(id)
        return ResponseEntity.ok(SubscriptionResponse.from(subscription))
    }
}