package com.liyaqa.platform.subscription.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.subscription.dto.InvoiceResponse
import com.liyaqa.platform.subscription.dto.MarkPaidRequest
import com.liyaqa.platform.subscription.dto.OutstandingInvoiceResponse
import com.liyaqa.platform.subscription.dto.PlanRevenueResponse
import com.liyaqa.platform.subscription.dto.RevenueMetricsResponse
import com.liyaqa.platform.subscription.service.BillingAnalyticsService
import com.liyaqa.platform.subscription.service.SubscriptionInvoiceService
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
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/billing")
@PlatformSecured
@Tag(name = "Billing", description = "Billing and invoice management")
class BillingController(
    private val billingAnalyticsService: BillingAnalyticsService,
    private val subscriptionInvoiceService: SubscriptionInvoiceService,
    private val tenantRepository: TenantRepository
) {

    @GetMapping("/revenue")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get revenue metrics", description = "Returns aggregated revenue metrics including MRR, ARR, and growth rates")
    @ApiResponse(responseCode = "200", description = "Revenue metrics")
    fun getRevenueMetrics(): ResponseEntity<RevenueMetricsResponse> {
        return ResponseEntity.ok(billingAnalyticsService.getRevenueMetrics())
    }

    @GetMapping("/revenue/by-plan")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get revenue by plan", description = "Returns revenue breakdown grouped by subscription plan")
    @ApiResponse(responseCode = "200", description = "Revenue breakdown by plan")
    fun getRevenueByPlan(): ResponseEntity<List<PlanRevenueResponse>> {
        return ResponseEntity.ok(billingAnalyticsService.getRevenueByPlan())
    }

    @GetMapping("/outstanding")
    @PlatformSecured(permissions = [PlatformPermission.INVOICES_VIEW])
    @Operation(summary = "Get outstanding invoices", description = "Returns all unpaid invoices across all tenants")
    @ApiResponse(responseCode = "200", description = "List of outstanding invoices")
    fun getOutstandingInvoices(): ResponseEntity<List<OutstandingInvoiceResponse>> {
        val invoices = subscriptionInvoiceService.getOutstandingInvoices()
        val responses = invoices.mapNotNull { invoice ->
            val tenant = tenantRepository.findById(invoice.tenantId).orElse(null) ?: return@mapNotNull null
            OutstandingInvoiceResponse.from(invoice, tenant)
        }
        return ResponseEntity.ok(responses)
    }

    @PostMapping("/invoices/{id}/mark-paid")
    @PlatformSecured(permissions = [PlatformPermission.INVOICES_LIFECYCLE])
    @Operation(summary = "Mark an invoice as paid", description = "Records a payment against an outstanding invoice")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice marked as paid"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "422", description = "Invoice is not in a payable state")
    )
    fun markInvoicePaid(
        @PathVariable id: UUID,
        @Valid @RequestBody request: MarkPaidRequest
    ): ResponseEntity<InvoiceResponse> {
        val invoice = subscriptionInvoiceService.markPaid(id, request.toCommand())
        return ResponseEntity.ok(InvoiceResponse.from(invoice))
    }

    @GetMapping("/invoices/{id}/pdf")
    @PlatformSecured(permissions = [PlatformPermission.INVOICES_VIEW])
    @Operation(summary = "Download invoice PDF", description = "Downloads a PDF version of the specified invoice (not yet implemented)")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice PDF file"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "501", description = "PDF generation not yet implemented")
    )
    fun getInvoicePdf(@PathVariable id: UUID): ResponseEntity<Void> {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build()
    }
}
