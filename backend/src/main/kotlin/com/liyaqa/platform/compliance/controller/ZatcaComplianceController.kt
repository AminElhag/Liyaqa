package com.liyaqa.platform.compliance.controller

import com.liyaqa.platform.compliance.dto.ZatcaComplianceStatusResponse
import com.liyaqa.platform.compliance.dto.ZatcaIssueResponse
import com.liyaqa.platform.compliance.dto.ZatcaMonthlyTrendPoint
import com.liyaqa.platform.compliance.dto.ZatcaSubmissionResponse
import com.liyaqa.platform.compliance.dto.ZatcaTenantDetailResponse
import com.liyaqa.platform.compliance.service.ZatcaComplianceService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/compliance/zatca")
@PlatformSecured
@Tag(name = "ZATCA Compliance", description = "ZATCA e-invoicing compliance management")
class ZatcaComplianceController(
    private val zatcaComplianceService: ZatcaComplianceService
) {

    @GetMapping("/status")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get aggregated ZATCA status", description = "Retrieve aggregated ZATCA compliance status across all tenants")
    @ApiResponse(responseCode = "200", description = "ZATCA compliance status retrieved successfully")
    fun getAggregatedStatus(): ResponseEntity<ZatcaComplianceStatusResponse> {
        return ResponseEntity.ok(zatcaComplianceService.getAggregatedStatus())
    }

    @GetMapping("/tenants/{tenantId}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get tenant ZATCA detail", description = "Retrieve ZATCA compliance details for a specific tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant ZATCA detail found"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getTenantDetail(@PathVariable tenantId: UUID): ResponseEntity<ZatcaTenantDetailResponse> {
        return ResponseEntity.ok(zatcaComplianceService.getTenantDetail(tenantId))
    }

    @GetMapping("/trend")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get monthly ZATCA trend", description = "Retrieve monthly compliant vs failed counts")
    @ApiResponse(responseCode = "200", description = "ZATCA trend data retrieved successfully")
    fun getMonthlyTrend(
        @RequestParam(defaultValue = "6") months: Int
    ): ResponseEntity<List<ZatcaMonthlyTrendPoint>> {
        return ResponseEntity.ok(zatcaComplianceService.getMonthlyTrend(months))
    }

    @GetMapping("/issues")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_VIEW])
    @Operation(summary = "Get recent ZATCA issues", description = "Retrieve recent failed/rejected ZATCA submissions")
    @ApiResponse(responseCode = "200", description = "ZATCA issues retrieved successfully")
    fun getRecentIssues(
        @RequestParam(defaultValue = "20") limit: Int
    ): ResponseEntity<List<ZatcaIssueResponse>> {
        return ResponseEntity.ok(zatcaComplianceService.getRecentIssues(limit))
    }

    @PostMapping("/retry/{invoiceId}")
    @PlatformSecured(permissions = [PlatformPermission.COMPLIANCE_MANAGE])
    @Operation(summary = "Retry ZATCA submission", description = "Retry a failed ZATCA e-invoice submission")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Submission retried successfully"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "422", description = "Invoice is not in a retryable state")
    )
    fun retrySubmission(@PathVariable invoiceId: UUID): ResponseEntity<ZatcaSubmissionResponse> {
        return ResponseEntity.ok(zatcaComplianceService.retrySubmission(invoiceId))
    }
}
