package com.liyaqa.platform.tenant.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.tenant.dto.ChangeStatusRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import com.liyaqa.platform.tenant.dto.CompleteStepRequest
import com.liyaqa.platform.tenant.dto.DataExportJobResponse
import com.liyaqa.platform.tenant.dto.DeactivateTenantRequest
import com.liyaqa.platform.tenant.dto.DeactivationLogResponse
import com.liyaqa.platform.tenant.dto.OnboardingChecklistResponse
import com.liyaqa.platform.tenant.dto.OnboardingProgressSummaryResponse
import com.liyaqa.platform.tenant.dto.ProvisionFromDealRequest
import com.liyaqa.platform.tenant.dto.ProvisionTenantRequest
import com.liyaqa.platform.tenant.dto.RequestDataExportRequest
import com.liyaqa.platform.tenant.dto.SuspendTenantRequest
import com.liyaqa.platform.tenant.dto.TenantResponse
import com.liyaqa.platform.tenant.dto.TenantSummaryResponse
import com.liyaqa.platform.tenant.dto.UpdateTenantRequest
import com.liyaqa.platform.tenant.model.ProvisioningStep
import com.liyaqa.platform.tenant.model.TenantStatus
import com.liyaqa.platform.tenant.service.TenantOffboardingService
import com.liyaqa.platform.tenant.service.TenantProvisioningService
import com.liyaqa.shared.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
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
@RequestMapping("/api/v1/platform/tenants")
@PlatformSecured
@Tag(name = "Tenant Management", description = "Manage tenant organizations and lifecycle")
class TenantController(
    private val tenantProvisioningService: TenantProvisioningService,
    private val tenantOffboardingService: TenantOffboardingService
) {
    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_CREATE])
    @Operation(summary = "Provision a new tenant", description = "Creates and provisions a new tenant organization with the specified configuration")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Tenant provisioned successfully"),
        ApiResponse(responseCode = "409", description = "Tenant with this identifier already exists")
    )
    fun provisionTenant(
        @Valid @RequestBody request: ProvisionTenantRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantProvisioningService.provisionTenant(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant))
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_VIEW])
    @Operation(summary = "List tenants", description = "Retrieves a paginated list of tenants with optional status filtering and sorting")
    @ApiResponse(responseCode = "200", description = "Tenant list retrieved successfully")
    fun listTenants(
        @RequestParam(required = false) status: TenantStatus?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<TenantSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val tenantsPage = tenantProvisioningService.listTenants(status, pageable)
        return ResponseEntity.ok(PageResponse.from(tenantsPage) { TenantSummaryResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_VIEW])
    @Operation(summary = "Get tenant by ID", description = "Retrieves detailed information about a specific tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getTenant(@PathVariable id: UUID): ResponseEntity<TenantResponse> {
        val tenant = tenantProvisioningService.getTenant(id)
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_UPDATE])
    @Operation(summary = "Update tenant", description = "Updates the configuration and details of an existing tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant updated successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun updateTenant(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTenantRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantProvisioningService.updateTenant(id, request.toCommand())
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @PutMapping("/{id}/status")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_STATUS_CHANGE])
    @Operation(summary = "Change tenant status", description = "Transitions the tenant to a new status in its lifecycle")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant status changed successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found"),
        ApiResponse(responseCode = "422", description = "Invalid status transition")
    )
    fun changeTenantStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeStatusRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantProvisioningService.changeTenantStatus(id, request.toCommand())
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @GetMapping("/{id}/onboarding")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_VIEW])
    @Operation(summary = "Get onboarding checklist", description = "Retrieves the onboarding progress and checklist items for a tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Onboarding checklist retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getOnboardingChecklist(@PathVariable id: UUID): ResponseEntity<OnboardingProgressSummaryResponse> {
        val items = tenantProvisioningService.getOnboardingChecklist(id)
        val totalSteps = ProvisioningStep.entries.size
        val completedSteps = items.count { it.completed }.toLong()
        val percentage = if (totalSteps > 0) ((completedSteps * 100) / totalSteps).toInt() else 0

        return ResponseEntity.ok(
            OnboardingProgressSummaryResponse(
                totalSteps = totalSteps,
                completedSteps = completedSteps,
                percentage = percentage,
                items = items.map { OnboardingChecklistResponse.from(it) }
            )
        )
    }

    @PutMapping("/{id}/onboarding/{step}")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_UPDATE])
    @Operation(summary = "Complete onboarding step", description = "Marks a specific onboarding step as completed for a tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Onboarding step completed successfully"),
        ApiResponse(responseCode = "404", description = "Tenant or onboarding step not found"),
        ApiResponse(responseCode = "422", description = "Onboarding step already completed or invalid transition")
    )
    fun completeOnboardingStep(
        @PathVariable id: UUID,
        @PathVariable step: ProvisioningStep,
        @RequestBody(required = false) request: CompleteStepRequest?
    ): ResponseEntity<OnboardingChecklistResponse> {
        val item = tenantProvisioningService.completeOnboardingStep(id, step, request?.notes)
        return ResponseEntity.ok(OnboardingChecklistResponse.from(item))
    }

    @PostMapping("/from-deal/{dealId}")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_CREATE])
    @Operation(summary = "Provision tenant from deal", description = "Creates a new tenant from an existing deal, inheriting deal configuration")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Tenant provisioned from deal successfully"),
        ApiResponse(responseCode = "404", description = "Deal not found"),
        ApiResponse(responseCode = "409", description = "Tenant already provisioned from this deal")
    )
    fun provisionFromDeal(
        @PathVariable dealId: UUID,
        @Valid @RequestBody request: ProvisionFromDealRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantProvisioningService.provisionFromDeal(dealId, request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant))
    }

    // ============================================
    // Offboarding Endpoints
    // ============================================

    @PutMapping("/{id}/deactivate")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_DEACTIVATE])
    @Operation(summary = "Deactivate tenant", description = "Deactivates a tenant, disabling access while preserving data")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant deactivated successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found"),
        ApiResponse(responseCode = "422", description = "Tenant cannot be deactivated in its current state")
    )
    fun deactivateTenant(
        @PathVariable id: UUID,
        @Valid @RequestBody request: DeactivateTenantRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantOffboardingService.deactivateTenant(id, request.toCommand())
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @PutMapping("/{id}/suspend")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_STATUS_CHANGE])
    @Operation(summary = "Suspend tenant", description = "Temporarily suspends a tenant, blocking all user access until reactivation")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant suspended successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found"),
        ApiResponse(responseCode = "422", description = "Tenant cannot be suspended in its current state")
    )
    fun suspendTenant(
        @PathVariable id: UUID,
        @Valid @RequestBody request: SuspendTenantRequest
    ): ResponseEntity<TenantResponse> {
        val tenant = tenantOffboardingService.suspendTenant(id, request.toCommand())
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @PostMapping("/{id}/exports")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_EXPORT_DATA])
    @Operation(summary = "Request data export", description = "Initiates an asynchronous data export job for the specified tenant")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Data export job created successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun requestDataExport(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RequestDataExportRequest
    ): ResponseEntity<DataExportJobResponse> {
        val job = tenantOffboardingService.requestDataExport(id, request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(DataExportJobResponse.from(job))
    }

    @GetMapping("/{id}/exports")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_EXPORT_DATA])
    @Operation(summary = "List data exports", description = "Retrieves all data export jobs for the specified tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data export list retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getDataExports(@PathVariable id: UUID): ResponseEntity<List<DataExportJobResponse>> {
        val exports = tenantOffboardingService.getDataExports(id)
        return ResponseEntity.ok(exports.map { DataExportJobResponse.from(it) })
    }

    @GetMapping("/{id}/exports/{exportId}")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_EXPORT_DATA])
    @Operation(summary = "Get data export by ID", description = "Retrieves the status and details of a specific data export job")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Data export details retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Tenant or data export job not found")
    )
    fun getDataExport(
        @PathVariable id: UUID,
        @PathVariable exportId: UUID
    ): ResponseEntity<DataExportJobResponse> {
        val job = tenantOffboardingService.getDataExport(exportId)
        return ResponseEntity.ok(DataExportJobResponse.from(job))
    }

    @PutMapping("/{id}/archive")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_ARCHIVE])
    @Operation(summary = "Archive tenant", description = "Archives a deactivated tenant, marking it for eventual data cleanup")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Tenant archived successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found"),
        ApiResponse(responseCode = "422", description = "Tenant must be deactivated before archiving")
    )
    fun archiveTenant(@PathVariable id: UUID): ResponseEntity<TenantResponse> {
        val tenant = tenantOffboardingService.archiveTenant(id)
        return ResponseEntity.ok(TenantResponse.from(tenant))
    }

    @GetMapping("/{id}/deactivation-history")
    @PlatformSecured(permissions = [PlatformPermission.TENANTS_VIEW])
    @Operation(summary = "Get deactivation history", description = "Retrieves the history of deactivation events for a tenant")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Deactivation history retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Tenant not found")
    )
    fun getDeactivationHistory(@PathVariable id: UUID): ResponseEntity<List<DeactivationLogResponse>> {
        val logs = tenantOffboardingService.getDeactivationHistory(id)
        return ResponseEntity.ok(logs.map { DeactivationLogResponse.from(it) })
    }
}
