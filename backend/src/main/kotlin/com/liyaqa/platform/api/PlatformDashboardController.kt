package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ClientGrowthResponse
import com.liyaqa.platform.api.dto.DealPipelineOverviewResponse
import com.liyaqa.platform.api.dto.ExpiringClientSubscriptionResponse
import com.liyaqa.platform.api.dto.MonthlyRevenueResponse
import com.liyaqa.platform.api.dto.PlatformDashboardResponse
import com.liyaqa.platform.api.dto.PlatformHealthResponse
import com.liyaqa.platform.api.dto.PlatformRevenueResponse
import com.liyaqa.platform.api.dto.PlatformSummaryResponse
import com.liyaqa.platform.api.dto.RecentActivityResponse
import com.liyaqa.platform.api.dto.TopClientResponse
import com.liyaqa.platform.application.services.PlatformDashboardExportService
import com.liyaqa.platform.application.services.PlatformDashboardService
import com.liyaqa.platform.application.services.SupportTicketStatsResponse
import com.liyaqa.platform.application.services.SupportTicketStatsService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

/**
 * Controller for platform dashboard and analytics.
 * Provides aggregated metrics and insights for the internal Liyaqa team.
 *
 * Endpoints:
 * - GET /api/platform/dashboard                    - Get complete dashboard
 * - GET /api/platform/dashboard/summary            - Get summary statistics
 * - GET /api/platform/dashboard/revenue            - Get revenue metrics
 * - GET /api/platform/dashboard/revenue/monthly    - Get monthly revenue breakdown
 * - GET /api/platform/dashboard/growth             - Get client growth metrics
 * - GET /api/platform/dashboard/deal-pipeline      - Get deal pipeline overview
 * - GET /api/platform/dashboard/expiring-subscriptions - Get expiring subscriptions
 * - GET /api/platform/dashboard/top-clients        - Get top clients by revenue
 * - GET /api/platform/dashboard/recent-activity    - Get recent platform activity
 * - GET /api/platform/dashboard/health             - Get platform health indicators
 * - GET /api/platform/dashboard/support-stats      - Get support ticket statistics
 * - GET /api/platform/dashboard/export/summary-csv - Export summary to CSV
 * - GET /api/platform/dashboard/export/revenue-csv - Export revenue to CSV
 * - GET /api/platform/dashboard/export/monthly-csv - Export monthly revenue to CSV
 * - GET /api/platform/dashboard/export/clients-csv - Export top clients to CSV
 * - GET /api/platform/dashboard/export/pdf         - Export complete dashboard to PDF
 */
@RestController
@RequestMapping("/api/platform/dashboard")
@PlatformSecured
@Tag(name = "Platform Dashboard", description = "Platform dashboard metrics and analytics")
class PlatformDashboardController(
    private val dashboardService: PlatformDashboardService,
    private val supportTicketStatsService: SupportTicketStatsService,
    private val exportService: PlatformDashboardExportService
) {
    /**
     * Gets the complete dashboard with all metrics.
     *
     * @param timezone Timezone for date calculations (default: Asia/Riyadh)
     * @param startDate Optional start date for filtering (ISO format: yyyy-MM-dd)
     * @param endDate Optional end date for filtering (ISO format: yyyy-MM-dd)
     */
    @Operation(summary = "Get complete dashboard", description = "Returns the complete platform dashboard with all metrics, optionally filtered by date range and timezone.")
    @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully")
    @GetMapping
    fun getDashboard(
        @RequestParam(defaultValue = "Asia/Riyadh") timezone: String,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?
    ): ResponseEntity<PlatformDashboardResponse> {
        val dashboard = dashboardService.getDashboard(timezone, startDate, endDate)
        return ResponseEntity.ok(dashboard)
    }

    /**
     * Gets summary statistics.
     */
    @Operation(summary = "Get summary statistics", description = "Returns high-level summary statistics for the platform (total clients, revenue, etc.).")
    @ApiResponse(responseCode = "200", description = "Summary statistics retrieved successfully")
    @GetMapping("/summary")
    fun getSummary(): ResponseEntity<PlatformSummaryResponse> {
        val summary = dashboardService.getSummary()
        return ResponseEntity.ok(summary)
    }

    /**
     * Gets revenue metrics.
     * Only PLATFORM_ADMIN can view revenue details.
     *
     * @param timezone Timezone for date calculations (default: Asia/Riyadh)
     * @param startDate Optional start date for filtering (ISO format: yyyy-MM-dd)
     * @param endDate Optional end date for filtering (ISO format: yyyy-MM-dd)
     */
    @Operation(summary = "Get revenue metrics", description = "Returns detailed revenue metrics. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Revenue metrics retrieved successfully")
    @GetMapping("/revenue")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun getRevenue(
        @RequestParam(defaultValue = "Asia/Riyadh") timezone: String,
        @RequestParam(required = false) startDate: String?,
        @RequestParam(required = false) endDate: String?
    ): ResponseEntity<PlatformRevenueResponse> {
        val revenue = dashboardService.getRevenue(timezone, startDate, endDate)
        return ResponseEntity.ok(revenue)
    }

    /**
     * Gets monthly revenue breakdown.
     * Only PLATFORM_ADMIN can view revenue details.
     */
    @Operation(summary = "Get monthly revenue breakdown", description = "Returns a month-by-month revenue breakdown. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Monthly revenue retrieved successfully")
    @GetMapping("/revenue/monthly")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun getMonthlyRevenue(
        @RequestParam(defaultValue = "12") months: Int
    ): ResponseEntity<List<MonthlyRevenueResponse>> {
        val monthlyRevenue = dashboardService.getMonthlyRevenue(months)
        return ResponseEntity.ok(monthlyRevenue)
    }

    /**
     * Gets client growth metrics.
     */
    @Operation(summary = "Get client growth metrics", description = "Returns client growth metrics including new clients, churn rate, and net growth.")
    @ApiResponse(responseCode = "200", description = "Client growth metrics retrieved successfully")
    @GetMapping("/growth")
    fun getClientGrowth(): ResponseEntity<ClientGrowthResponse> {
        val growth = dashboardService.getClientGrowth()
        return ResponseEntity.ok(growth)
    }

    /**
     * Gets deal pipeline overview.
     */
    @Operation(summary = "Get deal pipeline overview", description = "Returns an overview of the sales deal pipeline with stage counts and values.")
    @ApiResponse(responseCode = "200", description = "Deal pipeline overview retrieved successfully")
    @GetMapping("/deal-pipeline")
    fun getDealPipeline(): ResponseEntity<DealPipelineOverviewResponse> {
        val pipeline = dashboardService.getDealPipeline()
        return ResponseEntity.ok(pipeline)
    }

    /**
     * Gets expiring subscriptions.
     */
    @Operation(summary = "Get expiring subscriptions", description = "Returns subscriptions that are expiring within the specified number of days ahead.")
    @ApiResponse(responseCode = "200", description = "Expiring subscriptions retrieved successfully")
    @GetMapping("/expiring-subscriptions")
    fun getExpiringSubscriptions(
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<ExpiringClientSubscriptionResponse>> {
        val expiring = dashboardService.getExpiringSubscriptions(daysAhead)
        return ResponseEntity.ok(expiring)
    }

    /**
     * Gets top clients by revenue.
     */
    @Operation(summary = "Get top clients by revenue", description = "Returns the top clients ranked by revenue. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponse(responseCode = "200", description = "Top clients retrieved successfully")
    @GetMapping("/top-clients")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun getTopClients(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<TopClientResponse>> {
        val topClients = dashboardService.getTopClients(limit)
        return ResponseEntity.ok(topClients)
    }

    /**
     * Gets recent platform activity.
     */
    @Operation(summary = "Get recent activity", description = "Returns the most recent platform activity entries.")
    @ApiResponse(responseCode = "200", description = "Recent activity retrieved successfully")
    @GetMapping("/recent-activity")
    fun getRecentActivity(
        @RequestParam(defaultValue = "20") limit: Int
    ): ResponseEntity<List<RecentActivityResponse>> {
        val activity = dashboardService.getRecentActivity(limit)
        return ResponseEntity.ok(activity)
    }

    /**
     * Gets platform health indicators.
     */
    @Operation(summary = "Get platform health", description = "Returns platform health indicators including system status and service availability.")
    @ApiResponse(responseCode = "200", description = "Platform health retrieved successfully")
    @GetMapping("/health")
    fun getHealth(): ResponseEntity<PlatformHealthResponse> {
        val health = dashboardService.getHealth()
        return ResponseEntity.ok(health)
    }

    /**
     * Gets support ticket statistics.
     * Available for PLATFORM_ADMIN and SUPPORT_REP roles.
     */
    @Operation(summary = "Get support ticket statistics", description = "Returns support ticket statistics. Requires PLATFORM_ADMIN or SUPPORT role.")
    @ApiResponse(responseCode = "200", description = "Support statistics retrieved successfully")
    @GetMapping("/support-stats")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.SUPPORT_LEAD, PlatformUserRole.SUPPORT_AGENT])
    fun getSupportStats(): ResponseEntity<SupportTicketStatsResponse> {
        val stats = supportTicketStatsService.getStats()
        return ResponseEntity.ok(stats)
    }

    // ==================== EXPORT ENDPOINTS ====================

    /**
     * Exports summary statistics to CSV.
     * Only PLATFORM_ADMIN can export data.
     */
    @Operation(summary = "Export summary to CSV", description = "Exports summary statistics as a CSV file download. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "CSV file generated successfully")
    @GetMapping("/export/summary-csv")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun exportSummaryToCsv(): ResponseEntity<ByteArray> {
        val csv = exportService.exportSummaryToCsv()
        val filename = exportService.generateFilename("summary", "csv")

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv)
    }

    /**
     * Exports revenue metrics to CSV.
     * Only PLATFORM_ADMIN can export data.
     *
     * @param timezone Timezone for date calculations (default: Asia/Riyadh)
     */
    @Operation(summary = "Export revenue to CSV", description = "Exports revenue metrics as a CSV file download. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "CSV file generated successfully")
    @GetMapping("/export/revenue-csv")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun exportRevenueToCsv(
        @RequestParam(defaultValue = "Asia/Riyadh") timezone: String
    ): ResponseEntity<ByteArray> {
        val csv = exportService.exportRevenueToCsv(timezone)
        val filename = exportService.generateFilename("revenue", "csv")

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv)
    }

    /**
     * Exports monthly revenue breakdown to CSV.
     * Only PLATFORM_ADMIN can export data.
     *
     * @param months Number of months to include (default: 12)
     */
    @Operation(summary = "Export monthly revenue to CSV", description = "Exports monthly revenue breakdown as a CSV file download. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "CSV file generated successfully")
    @GetMapping("/export/monthly-csv")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun exportMonthlyRevenueToCsv(
        @RequestParam(defaultValue = "12") months: Int
    ): ResponseEntity<ByteArray> {
        val csv = exportService.exportMonthlyRevenueToCsv(months)
        val filename = exportService.generateFilename("monthly_revenue", "csv")

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv)
    }

    /**
     * Exports top clients by revenue to CSV.
     * Only PLATFORM_ADMIN and SALES_REP can export client data.
     *
     * @param limit Number of top clients to include (default: 10)
     */
    @Operation(summary = "Export top clients to CSV", description = "Exports top clients by revenue as a CSV file download. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponse(responseCode = "200", description = "CSV file generated successfully")
    @GetMapping("/export/clients-csv")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun exportTopClientsToCsv(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<ByteArray> {
        val csv = exportService.exportTopClientsToCsv(limit)
        val filename = exportService.generateFilename("top_clients", "csv")

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(csv)
    }

    /**
     * Exports complete dashboard report to PDF.
     * Only PLATFORM_ADMIN can export data.
     *
     * @param timezone Timezone for date calculations (default: Asia/Riyadh)
     */
    @Operation(summary = "Export dashboard to PDF", description = "Exports the complete dashboard report as a PDF file download. Requires PLATFORM_ADMIN role.")
    @ApiResponse(responseCode = "200", description = "PDF file generated successfully")
    @GetMapping("/export/pdf")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun exportDashboardToPdf(
        @RequestParam(defaultValue = "Asia/Riyadh") timezone: String
    ): ResponseEntity<ByteArray> {
        val pdf = exportService.exportDashboardToPdf(timezone)
        val filename = exportService.generateFilename("report", "pdf")

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$filename\"")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf)
    }
}
