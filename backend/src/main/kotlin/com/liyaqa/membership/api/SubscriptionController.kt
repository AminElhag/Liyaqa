package com.liyaqa.membership.api

import com.liyaqa.billing.domain.ports.InvoiceRepository
import com.liyaqa.membership.application.services.SubscriptionService
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.organization.api.PageResponse
import com.liyaqa.shared.api.BulkItemResult
import com.liyaqa.shared.api.BulkItemStatus
import com.liyaqa.shared.api.BulkOperationResponse
import com.liyaqa.shared.api.validateBulkSize
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.format.annotation.DateTimeFormat
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
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api")
class SubscriptionController(
    private val subscriptionService: SubscriptionService,
    private val membershipPlanRepository: MembershipPlanRepository,
    private val invoiceRepository: InvoiceRepository
) {
    /**
     * Helper to build response with plan name and invoice ID
     */
    private fun toResponse(subscription: Subscription): SubscriptionResponse {
        val plan = membershipPlanRepository.findById(subscription.planId).orElse(null)
        val invoiceId = invoiceRepository.findFirstBySubscriptionIdOrderByCreatedAtDesc(subscription.id)
            .map { it.id }.orElse(null)
        return SubscriptionResponse.from(subscription, plan, invoiceId)
    }
    /**
     * Creates a new subscription for a member.
     */
    @PostMapping("/members/{memberId}/subscriptions")
    @PreAuthorize("hasAuthority('subscriptions_create')")
    fun createSubscription(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CreateSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        // Ensure memberId in path matches request
        val command = request.copy(memberId = memberId).toCommand()
        val subscription = subscriptionService.createSubscription(command)
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(subscription))
    }

    /**
     * Gets all subscriptions for a member.
     */
    @GetMapping("/members/{memberId}/subscriptions")
    @PreAuthorize("hasAuthority('subscriptions_view') or @securityService.isSelf(#memberId)")
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
                content = subscriptionsPage.content.map { toResponse(it) },
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
    @PreAuthorize("hasAuthority('subscriptions_view') or @securityService.isSelf(#memberId)")
    fun getActiveSubscription(@PathVariable memberId: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.getActiveSubscription(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Gets a subscription by ID.
     */
    @GetMapping("/subscriptions/{id}")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    fun getSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.getSubscription(id)
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Lists all subscriptions with optional search and filtering.
     *
     * @param planId Filter by membership plan ID
     * @param status Filter by subscription status (ACTIVE, PENDING_PAYMENT, FROZEN, CANCELLED, EXPIRED)
     * @param expiringBefore Filter subscriptions expiring on or before this date (ISO format: YYYY-MM-DD)
     */
    @GetMapping("/subscriptions")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    fun getAllSubscriptions(
        @RequestParam(required = false) planId: UUID?,
        @RequestParam(required = false) status: SubscriptionStatus?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) expiringBefore: LocalDate?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        // Use search if any filter is provided, otherwise get all
        val subscriptionsPage = if (planId != null || status != null || expiringBefore != null) {
            subscriptionService.searchSubscriptions(planId, status, expiringBefore, pageable)
        } else {
            subscriptionService.getAllSubscriptions(pageable)
        }

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { toResponse(it) },
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
    @PreAuthorize("hasAuthority('subscriptions_view')")
    fun getSubscriptionsByStatus(
        @PathVariable status: SubscriptionStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val pageable = PageRequest.of(page, size)
        val subscriptionsPage = subscriptionService.getSubscriptionsByStatus(status, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { toResponse(it) },
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
    @PreAuthorize("hasAuthority('subscriptions_view')")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "7") daysAhead: Int,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<SubscriptionResponse>> {
        val pageable = PageRequest.of(page, size)
        val subscriptionsPage = subscriptionService.getExpiringSubscriptions(daysAhead, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = subscriptionsPage.content.map { toResponse(it) },
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
    @PreAuthorize("hasAuthority('subscriptions_update')")
    fun updateSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.updateSubscription(id, request.toCommand())
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Unfreezes a subscription.
     */
    @PostMapping("/subscriptions/{id}/unfreeze")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    fun unfreezeSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.unfreezeSubscription(id)
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Cancels a subscription.
     */
    @PostMapping("/subscriptions/{id}/cancel")
    @PreAuthorize("hasAuthority('subscriptions_cancel')")
    fun cancelSubscription(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.cancelSubscription(id)
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Renews a subscription.
     */
    @PostMapping("/subscriptions/{id}/renew")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    fun renewSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RenewSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.renewSubscription(id, request.toCommand())
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Transfers a subscription to another member.
     */
    @PostMapping("/subscriptions/{id}/transfer")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    fun transferSubscription(
        @PathVariable id: UUID,
        @Valid @RequestBody request: TransferSubscriptionRequest
    ): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.transferSubscription(id, request.toCommand())
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Uses a class from the subscription.
     */
    @PostMapping("/subscriptions/{id}/use-class")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    fun useClass(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.useClass(id)
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Uses a guest pass from the subscription.
     */
    @PostMapping("/subscriptions/{id}/use-guest-pass")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    fun useGuestPass(@PathVariable id: UUID): ResponseEntity<SubscriptionResponse> {
        val subscription = subscriptionService.useGuestPass(id)
        return ResponseEntity.ok(toResponse(subscription))
    }

    /**
     * Deletes a subscription.
     * Only cancelled or expired subscriptions can be deleted.
     */
    @DeleteMapping("/subscriptions/{id}")
    @PreAuthorize("hasAuthority('subscriptions_delete')")
    fun deleteSubscription(@PathVariable id: UUID): ResponseEntity<Unit> {
        subscriptionService.deleteSubscription(id)
        return ResponseEntity.noContent().build()
    }

    // ==================== BULK OPERATIONS ====================

    /**
     * Bulk update subscription status (freeze, unfreeze, cancel).
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/subscriptions/bulk/status")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    @Operation(summary = "Bulk update subscription status", description = "Update status for multiple subscriptions at once")
    fun bulkUpdateStatus(
        @Valid @RequestBody request: BulkSubscriptionStatusRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.subscriptionIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = when (request.action) {
            BulkSubscriptionAction.FREEZE -> subscriptionService.bulkFreezeSubscriptions(request.subscriptionIds)
            BulkSubscriptionAction.UNFREEZE -> subscriptionService.bulkUnfreezeSubscriptions(request.subscriptionIds)
            BulkSubscriptionAction.CANCEL -> subscriptionService.bulkCancelSubscriptions(request.subscriptionIds)
        }

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Status changed to ${request.action.name}",
                    messageAr = getArabicSubscriptionStatusMessage(request.action)
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تحديث الحالة"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    /**
     * Bulk renew subscriptions.
     * Restricted to SUPER_ADMIN and CLUB_ADMIN roles.
     */
    @PostMapping("/subscriptions/bulk/renew")
    @PreAuthorize("hasAuthority('subscriptions_update')")
    @Operation(summary = "Bulk renew subscriptions", description = "Renew multiple subscriptions at once")
    fun bulkRenewSubscriptions(
        @Valid @RequestBody request: BulkSubscriptionRenewRequest
    ): ResponseEntity<BulkOperationResponse> {
        validateBulkSize(request.subscriptionIds)
        val startTime = System.currentTimeMillis()

        val resultsMap = subscriptionService.bulkRenewSubscriptions(
            request.subscriptionIds,
            request.newEndDate,
            request.paidAmount
        )

        val results = resultsMap.map { (id, result) ->
            if (result.isSuccess) {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.SUCCESS,
                    message = "Subscription renewed",
                    messageAr = "تم تجديد الاشتراك"
                )
            } else {
                BulkItemResult(
                    itemId = id,
                    status = BulkItemStatus.FAILED,
                    message = result.exceptionOrNull()?.message ?: "Unknown error",
                    messageAr = "فشل في تجديد الاشتراك"
                )
            }
        }

        return ResponseEntity.ok(BulkOperationResponse.from(results, startTime))
    }

    private fun getArabicSubscriptionStatusMessage(action: BulkSubscriptionAction): String {
        return when (action) {
            BulkSubscriptionAction.FREEZE -> "تم تجميد الاشتراك"
            BulkSubscriptionAction.UNFREEZE -> "تم إلغاء تجميد الاشتراك"
            BulkSubscriptionAction.CANCEL -> "تم إلغاء الاشتراك"
        }
    }
}