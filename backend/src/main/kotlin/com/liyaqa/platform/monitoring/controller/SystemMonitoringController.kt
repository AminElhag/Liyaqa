package com.liyaqa.platform.monitoring.controller

import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.monitoring.dto.ErrorSummaryResponse
import com.liyaqa.platform.monitoring.dto.ScheduledJobResponse
import com.liyaqa.platform.monitoring.dto.SystemHealthResponse
import com.liyaqa.platform.monitoring.service.SystemMonitoringService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/platform/monitoring/system")
@PlatformSecured
@Tag(name = "System Monitoring", description = "System health, scheduled jobs, and error tracking")
class SystemMonitoringController(
    private val systemMonitoringService: SystemMonitoringService
) {

    @Operation(summary = "Get application health status including DB, memory, and uptime")
    @GetMapping("/health")
    fun getSystemHealth(): ResponseEntity<SystemHealthResponse> {
        return ResponseEntity.ok(systemMonitoringService.getSystemHealth())
    }

    @Operation(summary = "Get scheduled job statuses and last run times")
    @GetMapping("/jobs")
    fun getScheduledJobs(): ResponseEntity<List<ScheduledJobResponse>> {
        return ResponseEntity.ok(systemMonitoringService.getScheduledJobs())
    }

    @Operation(summary = "Get aggregated error counts for 24h, 7d, and 30d windows")
    @GetMapping("/errors")
    fun getErrorSummary(): ResponseEntity<ErrorSummaryResponse> {
        return ResponseEntity.ok(systemMonitoringService.getErrorSummary())
    }
}
