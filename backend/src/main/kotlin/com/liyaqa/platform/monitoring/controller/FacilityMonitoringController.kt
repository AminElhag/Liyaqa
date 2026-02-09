package com.liyaqa.platform.monitoring.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.monitoring.dto.AtRiskFacilityResponse
import com.liyaqa.platform.monitoring.dto.FacilityActivityResponse
import com.liyaqa.platform.monitoring.dto.FacilityHealthResponse
import com.liyaqa.platform.monitoring.service.FacilityMonitoringService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/monitoring/facilities")
@PlatformSecured
@Tag(name = "Facility Monitoring", description = "Cross-tenant facility health dashboards")
class FacilityMonitoringController(
    private val facilityMonitoringService: FacilityMonitoringService
) {

    @Operation(summary = "Get health overview of all facilities")
    @GetMapping("/health")
    @PlatformSecured(permissions = [PlatformPermission.HEALTH_VIEW])
    fun getAllFacilitiesHealth(
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<FacilityHealthResponse>> {
        return ResponseEntity.ok(facilityMonitoringService.getAllFacilitiesHealth(pageable))
    }

    @Operation(summary = "Get activity timeline for a specific facility")
    @GetMapping("/{tenantId}/activity")
    @PlatformSecured(permissions = [PlatformPermission.HEALTH_VIEW])
    fun getFacilityActivity(
        @PathVariable tenantId: UUID,
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<FacilityActivityResponse>> {
        return ResponseEntity.ok(facilityMonitoringService.getFacilityActivity(tenantId, pageable))
    }

    @Operation(summary = "Get facilities with declining metrics or low health scores")
    @GetMapping("/at-risk")
    @PlatformSecured(permissions = [PlatformPermission.HEALTH_VIEW])
    fun getAtRiskFacilities(
        @PageableDefault(size = 20) pageable: Pageable
    ): ResponseEntity<Page<AtRiskFacilityResponse>> {
        return ResponseEntity.ok(facilityMonitoringService.getAtRiskFacilities(pageable))
    }
}
