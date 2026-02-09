package com.liyaqa.platform.support.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.support.dto.AgentPerformanceResponse
import com.liyaqa.platform.support.dto.TicketOverviewResponse
import com.liyaqa.platform.support.dto.TicketTrendResponse
import com.liyaqa.platform.support.dto.TrendPeriod
import com.liyaqa.platform.support.service.TicketAnalyticsService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/platform/tickets/analytics")
@PlatformSecured(permissions = [PlatformPermission.ANALYTICS_VIEW])
@Tag(name = "Support Tickets", description = "Support ticket analytics and metrics")
class TicketAnalyticsController(
    private val ticketAnalyticsService: TicketAnalyticsService
) {

    @GetMapping("/overview")
    @Operation(summary = "Get ticket overview", description = "Returns an overview of ticket metrics including counts by status, priority, and SLA compliance")
    @ApiResponse(responseCode = "200", description = "Ticket overview metrics")
    fun getOverview(): ResponseEntity<TicketOverviewResponse> {
        return ResponseEntity.ok(ticketAnalyticsService.getOverview())
    }

    @GetMapping("/agent-performance")
    @Operation(summary = "Get agent performance", description = "Returns performance metrics for each support agent including resolution time and ticket counts")
    @ApiResponse(responseCode = "200", description = "List of agent performance metrics")
    fun getAgentPerformance(): ResponseEntity<List<AgentPerformanceResponse>> {
        return ResponseEntity.ok(ticketAnalyticsService.getAgentPerformance())
    }

    @GetMapping("/trends")
    @Operation(summary = "Get ticket trends", description = "Returns ticket creation and resolution trends over time, grouped by the specified period")
    @ApiResponse(responseCode = "200", description = "List of ticket trend data points")
    fun getTrends(
        @RequestParam(defaultValue = "DAILY") period: TrendPeriod
    ): ResponseEntity<List<TicketTrendResponse>> {
        return ResponseEntity.ok(ticketAnalyticsService.getTrends(period))
    }
}
