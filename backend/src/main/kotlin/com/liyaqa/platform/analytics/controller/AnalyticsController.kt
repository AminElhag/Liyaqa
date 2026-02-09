package com.liyaqa.platform.analytics.controller

import com.liyaqa.platform.analytics.dto.AnalyticsDashboardResponse
import com.liyaqa.platform.analytics.dto.ChurnAnalysisResponse
import com.liyaqa.platform.analytics.dto.ComparativeResponse
import com.liyaqa.platform.analytics.dto.FeatureAdoptionResponse
import com.liyaqa.platform.analytics.model.ExportFormat
import com.liyaqa.platform.analytics.model.ReportType
import com.liyaqa.platform.analytics.service.AnalyticsExportService
import com.liyaqa.platform.analytics.service.ChurnAnalyticsService
import com.liyaqa.platform.analytics.service.ComparativeAnalyticsService
import com.liyaqa.platform.analytics.service.FeatureAdoptionService
import com.liyaqa.platform.analytics.service.PlatformAnalyticsService
import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/platform/analytics")
@PlatformSecured
@Tag(name = "Analytics", description = "Platform analytics and reporting")
class AnalyticsController(
    private val analyticsService: PlatformAnalyticsService,
    private val churnService: ChurnAnalyticsService,
    private val featureAdoptionService: FeatureAdoptionService,
    private val comparativeService: ComparativeAnalyticsService,
    private val exportService: AnalyticsExportService
) {

    @GetMapping("/dashboard")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get analytics dashboard", description = "Retrieves the aggregated analytics dashboard with key platform metrics")
    @ApiResponse(responseCode = "200", description = "Analytics dashboard retrieved successfully")
    fun getDashboard(): ResponseEntity<AnalyticsDashboardResponse> {
        return ResponseEntity.ok(analyticsService.getDashboard())
    }

    @GetMapping("/churn")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get churn analysis", description = "Retrieves churn analytics including churn rate, at-risk tenants, and trends")
    @ApiResponse(responseCode = "200", description = "Churn analysis retrieved successfully")
    fun getChurnAnalysis(): ResponseEntity<ChurnAnalysisResponse> {
        return ResponseEntity.ok(churnService.getChurnAnalysis())
    }

    @GetMapping("/feature-adoption")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get feature adoption metrics", description = "Retrieves feature adoption data across tenants including usage rates and trends")
    @ApiResponse(responseCode = "200", description = "Feature adoption metrics retrieved successfully")
    fun getFeatureAdoption(): ResponseEntity<FeatureAdoptionResponse> {
        return ResponseEntity.ok(featureAdoptionService.getFeatureAdoption())
    }

    @GetMapping("/comparative")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
    @Operation(summary = "Get comparative analytics", description = "Retrieves comparative analytics across tenants for benchmarking")
    @ApiResponse(responseCode = "200", description = "Comparative analytics retrieved successfully")
    fun getComparative(): ResponseEntity<ComparativeResponse> {
        return ResponseEntity.ok(comparativeService.getComparativeAnalytics())
    }

    @GetMapping("/reports/export")
    @PlatformSecured(permissions = [PlatformPermission.ANALYTICS_EXPORT])
    @Operation(summary = "Export analytics report", description = "Generates and downloads an analytics report in the specified format (CSV or PDF)")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Report exported successfully"),
        ApiResponse(responseCode = "400", description = "Invalid report type or export format")
    )
    fun exportReport(
        @RequestParam type: ReportType,
        @RequestParam format: ExportFormat,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?
    ): ResponseEntity<ByteArray> {
        val data = exportService.export(type, format)
        val filename = exportService.generateFilename(type, format)
        val contentType = when (format) {
            ExportFormat.CSV -> MediaType.parseMediaType("text/csv")
            ExportFormat.PDF -> MediaType.APPLICATION_PDF
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(contentType)
            .body(data)
    }
}
