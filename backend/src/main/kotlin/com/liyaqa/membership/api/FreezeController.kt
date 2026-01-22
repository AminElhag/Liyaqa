package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.FreezeService
import com.liyaqa.shared.domain.Money
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
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

// ==========================================
// FREEZE PACKAGE CONTROLLER
// ==========================================

@RestController
@RequestMapping("/api/freeze-packages")
@Tag(name = "Freeze Packages", description = "Manage configurable freeze packages for subscriptions")
class FreezePackageController(
    private val freezeService: FreezeService
) {

    @PostMapping
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Create a new freeze package")
    fun createFreezePackage(
        @Valid @RequestBody request: CreateFreezePackageRequest
    ): ResponseEntity<FreezePackageResponse> {
        val freezePackage = freezeService.createFreezePackage(
            name = request.name.toLocalizedText(),
            description = request.description?.toLocalizedText(),
            freezeDays = request.freezeDays,
            price = Money(request.priceAmount, request.priceCurrency),
            extendsContract = request.extendsContract,
            requiresDocumentation = request.requiresDocumentation,
            sortOrder = request.sortOrder
        )
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(FreezePackageResponse.from(freezePackage))
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get freeze package by ID")
    fun getFreezePackage(@PathVariable id: UUID): ResponseEntity<FreezePackageResponse> {
        val freezePackage = freezeService.getFreezePackage(id)
        return ResponseEntity.ok(FreezePackageResponse.from(freezePackage))
    }

    @GetMapping
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get all freeze packages")
    fun getAllFreezePackages(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "sortOrder") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDirection: String
    ): ResponseEntity<PageResponse<FreezePackageResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val packagePage = freezeService.getAllFreezePackages(pageable)

        val response = PageResponse(
            content = packagePage.content.map { FreezePackageResponse.from(it) },
            page = packagePage.number,
            size = packagePage.size,
            totalElements = packagePage.totalElements,
            totalPages = packagePage.totalPages,
            first = packagePage.isFirst,
            last = packagePage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get all active freeze packages")
    fun getActiveFreezePackages(): ResponseEntity<List<FreezePackageResponse>> {
        val packages = freezeService.getActiveFreezePackages()
        return ResponseEntity.ok(packages.map { FreezePackageResponse.from(it) })
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Update freeze package")
    fun updateFreezePackage(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateFreezePackageRequest
    ): ResponseEntity<FreezePackageResponse> {
        val freezePackage = freezeService.updateFreezePackage(
            id = id,
            name = request.name?.toLocalizedText(),
            description = request.description?.toLocalizedText(),
            freezeDays = request.freezeDays,
            price = if (request.priceAmount != null) {
                Money(request.priceAmount, request.priceCurrency ?: "SAR")
            } else null,
            extendsContract = request.extendsContract,
            requiresDocumentation = request.requiresDocumentation,
            sortOrder = request.sortOrder
        )
        return ResponseEntity.ok(FreezePackageResponse.from(freezePackage))
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Activate freeze package")
    fun activateFreezePackage(@PathVariable id: UUID): ResponseEntity<FreezePackageResponse> {
        val freezePackage = freezeService.activateFreezePackage(id)
        return ResponseEntity.ok(FreezePackageResponse.from(freezePackage))
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Deactivate freeze package")
    fun deactivateFreezePackage(@PathVariable id: UUID): ResponseEntity<FreezePackageResponse> {
        val freezePackage = freezeService.deactivateFreezePackage(id)
        return ResponseEntity.ok(FreezePackageResponse.from(freezePackage))
    }
}

// ==========================================
// SUBSCRIPTION FREEZE CONTROLLER
// ==========================================

@RestController
@RequestMapping("/api/subscriptions/{subscriptionId}/freeze")
@Tag(name = "Subscription Freeze", description = "Freeze and unfreeze subscription operations")
class SubscriptionFreezeController(
    private val freezeService: FreezeService,
    private val subscriptionService: com.liyaqa.membership.application.services.SubscriptionService
) {

    @GetMapping("/balance")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get freeze balance for subscription")
    fun getFreezeBalance(
        @PathVariable subscriptionId: UUID
    ): ResponseEntity<FreezeBalanceResponse> {
        val balance = freezeService.getFreezeBalance(subscriptionId)
        return if (balance != null) {
            ResponseEntity.ok(FreezeBalanceResponse.from(balance))
        } else {
            // Return empty balance with zero days instead of 404
            val subscription = subscriptionService.getSubscription(subscriptionId)
            ResponseEntity.ok(FreezeBalanceResponse.empty(subscriptionId, subscription.memberId))
        }
    }

    @PostMapping("/purchase")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Purchase freeze days from a package")
    fun purchaseFreezeDays(
        @PathVariable subscriptionId: UUID,
        @Valid @RequestBody request: PurchaseFreezeDaysRequest,
        @RequestParam memberId: UUID
    ): ResponseEntity<FreezeBalanceResponse> {
        val balance = freezeService.purchaseFreezeDays(
            memberId = memberId,
            subscriptionId = subscriptionId,
            freezePackageId = request.freezePackageId
        )
        return ResponseEntity.ok(FreezeBalanceResponse.from(balance))
    }

    @PostMapping("/grant")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Grant freeze days (promotional, compensation, etc.)")
    fun grantFreezeDays(
        @PathVariable subscriptionId: UUID,
        @Valid @RequestBody request: GrantFreezeDaysRequest,
        @RequestParam memberId: UUID
    ): ResponseEntity<FreezeBalanceResponse> {
        val balance = freezeService.grantFreezeDays(
            memberId = memberId,
            subscriptionId = subscriptionId,
            days = request.days,
            source = request.source
        )
        return ResponseEntity.ok(FreezeBalanceResponse.from(balance))
    }

    @PostMapping
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Freeze subscription")
    fun freezeSubscription(
        @PathVariable subscriptionId: UUID,
        @Valid @RequestBody request: FreezeSubscriptionRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<FreezeResultResponse> {
        val userId = try {
            UUID.fromString(userDetails?.username)
        } catch (e: Exception) {
            null
        }

        val result = freezeService.freezeSubscription(
            subscriptionId = subscriptionId,
            freezeDays = request.freezeDays,
            freezeType = request.freezeType,
            reason = request.reason,
            documentPath = request.documentPath,
            createdByUserId = userId
        )

        return ResponseEntity.ok(FreezeResultResponse(
            subscriptionId = subscriptionId,
            status = result.subscription.status.name,
            freezeHistory = FreezeHistoryResponse.from(result.history),
            daysUsedFromBalance = result.daysUsedFromBalance,
            originalEndDate = result.originalEndDate,
            newEndDate = result.newEndDate
        ))
    }

    @PostMapping("/unfreeze")
    @PreAuthorize("hasAuthority('subscriptions_freeze')")
    @Operation(summary = "Unfreeze subscription")
    fun unfreezeSubscription(
        @PathVariable subscriptionId: UUID
    ): ResponseEntity<FreezeResultResponse> {
        val result = freezeService.unfreezeSubscription(subscriptionId)

        return ResponseEntity.ok(FreezeResultResponse(
            subscriptionId = subscriptionId,
            status = result.subscription.status.name,
            freezeHistory = FreezeHistoryResponse.from(result.history),
            daysUsedFromBalance = 0,
            originalEndDate = result.originalEndDate,
            newEndDate = result.newEndDate
        ))
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get freeze history for subscription")
    fun getFreezeHistory(
        @PathVariable subscriptionId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "10") size: Int
    ): ResponseEntity<PageResponse<FreezeHistoryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "freezeStartDate"))
        val historyPage = freezeService.getFreezeHistory(subscriptionId, pageable)

        val response = PageResponse(
            content = historyPage.content.map { FreezeHistoryResponse.from(it) },
            page = historyPage.number,
            size = historyPage.size,
            totalElements = historyPage.totalElements,
            totalPages = historyPage.totalPages,
            first = historyPage.isFirst,
            last = historyPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('subscriptions_view')")
    @Operation(summary = "Get active freeze for subscription")
    fun getActiveFreeze(
        @PathVariable subscriptionId: UUID
    ): ResponseEntity<FreezeHistoryResponse> {
        val activeFreeze = freezeService.getActiveFreeze(subscriptionId)
        return if (activeFreeze != null) {
            ResponseEntity.ok(FreezeHistoryResponse.from(activeFreeze))
        } else {
            ResponseEntity.notFound().build()
        }
    }
}
