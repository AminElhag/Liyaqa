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
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
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
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'MARKETING')")
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
    @GetMapping("/revenue")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
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
    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun getMonthlyRevenue(
        @RequestParam(defaultValue = "12") months: Int
    ): ResponseEntity<List<MonthlyRevenueResponse>> {
        val monthlyRevenue = dashboardService.getMonthlyRevenue(months)
        return ResponseEntity.ok(monthlyRevenue)
    }

    /**
     * Gets client growth metrics.
     */
    @GetMapping("/growth")
    fun getClientGrowth(): ResponseEntity<ClientGrowthResponse> {
        val growth = dashboardService.getClientGrowth()
        return ResponseEntity.ok(growth)
    }

    /**
     * Gets deal pipeline overview.
     */
    @GetMapping("/deal-pipeline")
    fun getDealPipeline(): ResponseEntity<DealPipelineOverviewResponse> {
        val pipeline = dashboardService.getDealPipeline()
        return ResponseEntity.ok(pipeline)
    }

    /**
     * Gets expiring subscriptions.
     */
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
    @GetMapping("/top-clients")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun getTopClients(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<TopClientResponse>> {
        val topClients = dashboardService.getTopClients(limit)
        return ResponseEntity.ok(topClients)
    }

    /**
     * Gets recent platform activity.
     */
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
    @GetMapping("/health")
    fun getHealth(): ResponseEntity<PlatformHealthResponse> {
        val health = dashboardService.getHealth()
        return ResponseEntity.ok(health)
    }

    /**
     * Gets support ticket statistics.
     * Available for PLATFORM_ADMIN and SUPPORT_REP roles.
     */
    @GetMapping("/support-stats")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SUPPORT_REP')")
    fun getSupportStats(): ResponseEntity<SupportTicketStatsResponse> {
        val stats = supportTicketStatsService.getStats()
        return ResponseEntity.ok(stats)
    }

    // ==================== EXPORT ENDPOINTS ====================

    /**
     * Exports summary statistics to CSV.
     * Only PLATFORM_ADMIN can export data.
     */
    @GetMapping("/export/summary-csv")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
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
    @GetMapping("/export/revenue-csv")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
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
    @GetMapping("/export/monthly-csv")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
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
    @GetMapping("/export/clients-csv")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
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
    @GetMapping("/export/pdf")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
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
