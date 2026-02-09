package com.liyaqa.platform.subscription.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.subscription.dto.CancelSubscriptionRequest
import com.liyaqa.platform.subscription.dto.ChangePlanRequest
import com.liyaqa.platform.subscription.dto.CreateSubscriptionRequest
import com.liyaqa.platform.subscription.dto.ExpiringSubscriptionResponse
import com.liyaqa.platform.subscription.dto.InvoiceResponse
import com.liyaqa.platform.subscription.dto.TenantSubscriptionResponse
import com.liyaqa.platform.subscription.repository.SubscriptionPlanRepository
import com.liyaqa.platform.subscription.service.SubscriptionInvoiceService
import com.liyaqa.platform.subscription.service.TenantSubscriptionService
import com.liyaqa.platform.tenant.repository.TenantRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
@RequestMapping("/api/v1/platform/subscriptions")
@PlatformSecured
@Tag(name = "Tenant Subscriptions", description = "Manage tenant subscription lifecycle")
class TenantSubscriptionController(
    private val tenantSubscriptionService: TenantSubscriptionService,
    private val subscriptionInvoiceService: SubscriptionInvoiceService,
    private val subscriptionPlanRepository: SubscriptionPlanRepository,
    private val tenantRepository: TenantRepository
) {

    @PostMapping("/tenants/{tenantId}/subscribe")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_CREATE])
    @Operation(summary = "Create a tenant subscription", description = "Subscribes a tenant to a plan, creating a new active subscription")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Subscription created successfully"),
        ApiResponse(responseCode = "404", description = "Tenant or plan not found"),
        ApiResponse(responseCode = "409", description = "Tenant already has an active subscription")
    )
    fun createSubscription(
        @PathVariable tenantId: UUID,
        @Valid @RequestBody request: CreateSubscriptionRequest
    ): ResponseEntity<TenantSubscriptionResponse> {
        val subscription = tenantSubscriptionService.subscribe(request.toCommand(tenantId))
        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(TenantSubscriptionResponse.from(subscription, plan))
    }

    @GetMapping("/tenants/{tenantId}/subscription")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_VIEW])
    @Operation(summary = "Get tenant subscription", description = "Returns the active subscription details for a tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription details"),
        ApiResponse(responseCode = "404", description = "Subscription not found for the tenant")
    )
    fun getSubscription(@PathVariable tenantId: UUID): ResponseEntity<TenantSubscriptionResponse> {
        val subscription = tenantSubscriptionService.getSubscription(tenantId)
        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        return ResponseEntity.ok(TenantSubscriptionResponse.from(subscription, plan))
    }

    @PutMapping("/tenants/{tenantId}/subscription/change-plan")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_EDIT])
    @Operation(summary = "Change subscription plan", description = "Changes the tenant's subscription to a different plan (upgrade or downgrade)")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Plan changed successfully"),
        ApiResponse(responseCode = "404", description = "Subscription or target plan not found"),
        ApiResponse(responseCode = "422", description = "Plan change not allowed for current subscription state")
    )
    fun changePlan(
        @PathVariable tenantId: UUID,
        @Valid @RequestBody request: ChangePlanRequest
    ): ResponseEntity<TenantSubscriptionResponse> {
        val subscription = tenantSubscriptionService.changePlan(tenantId, request.toCommand())
        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        return ResponseEntity.ok(TenantSubscriptionResponse.from(subscription, plan))
    }

    @PutMapping("/tenants/{tenantId}/subscription/cancel")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_LIFECYCLE])
    @Operation(summary = "Cancel a subscription", description = "Cancels the tenant's active subscription with the specified reason")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription cancelled successfully"),
        ApiResponse(responseCode = "404", description = "Active subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription is not in a cancellable state")
    )
    fun cancelSubscription(
        @PathVariable tenantId: UUID,
        @Valid @RequestBody request: CancelSubscriptionRequest
    ): ResponseEntity<TenantSubscriptionResponse> {
        val subscription = tenantSubscriptionService.cancel(tenantId, request.toCommand())
        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        return ResponseEntity.ok(TenantSubscriptionResponse.from(subscription, plan))
    }

    @PutMapping("/tenants/{tenantId}/subscription/renew")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_LIFECYCLE])
    @Operation(summary = "Renew a subscription", description = "Renews the tenant's subscription for another billing cycle")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Subscription renewed successfully"),
        ApiResponse(responseCode = "404", description = "Active subscription not found"),
        ApiResponse(responseCode = "422", description = "Subscription is not in a renewable state")
    )
    fun renewSubscription(@PathVariable tenantId: UUID): ResponseEntity<TenantSubscriptionResponse> {
        val subscription = tenantSubscriptionService.renew(tenantId)
        val plan = subscriptionPlanRepository.findById(subscription.planId).orElse(null)
        return ResponseEntity.ok(TenantSubscriptionResponse.from(subscription, plan))
    }

    @GetMapping("/tenants/{tenantId}/invoices")
    @PlatformSecured(permissions = [PlatformPermission.INVOICES_VIEW])
    @Operation(summary = "Get tenant invoices", description = "Returns all invoices for a specific tenant's subscription")
    @ApiResponse(responseCode = "200", description = "List of invoices for the tenant")
    fun getInvoices(@PathVariable tenantId: UUID): ResponseEntity<List<InvoiceResponse>> {
        val invoices = subscriptionInvoiceService.getInvoicesByTenant(tenantId)
        return ResponseEntity.ok(invoices.map { InvoiceResponse.from(it) })
    }

    @GetMapping("/expiring")
    @PlatformSecured(permissions = [PlatformPermission.SUBSCRIPTIONS_VIEW])
    @Operation(summary = "Get expiring subscriptions", description = "Returns subscriptions that will expire within the specified number of days")
    @ApiResponse(responseCode = "200", description = "List of expiring subscriptions")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<List<ExpiringSubscriptionResponse>> {
        val expiring = tenantSubscriptionService.getExpiringSubscriptions(days)
        val responses = expiring.mapNotNull { sub ->
            val tenant = tenantRepository.findById(sub.tenantId).orElse(null) ?: return@mapNotNull null
            val plan = subscriptionPlanRepository.findById(sub.planId).orElse(null)
            ExpiringSubscriptionResponse.from(sub, tenant, plan)
        }
        return ResponseEntity.ok(responses)
    }
}
