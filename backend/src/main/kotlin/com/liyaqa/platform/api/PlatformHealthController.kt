package com.liyaqa.platform.api

import com.liyaqa.platform.application.services.HealthMetrics
import com.liyaqa.platform.application.services.HealthReport
import com.liyaqa.platform.application.services.HealthScoreService
import com.liyaqa.platform.application.services.HealthStatistics
import com.liyaqa.platform.domain.model.ClientHealthScore
import com.liyaqa.platform.domain.model.HealthTrend
import com.liyaqa.platform.domain.model.RiskLevel
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * Controller for platform client health score management.
 * Provides endpoints for monitoring and managing client health scores.
 *
 * Endpoints:
 * - GET /api/platform/health/overview                    - Get health overview statistics
 * - GET /api/platform/health/at-risk                     - Get at-risk clients
 * - GET /api/platform/health/healthy                     - Get healthy clients
 * - GET /api/platform/health/declining                   - Get declining clients
 * - GET /api/platform/health/by-risk/{riskLevel}         - Get by risk level
 * - GET /api/platform/health/{organizationId}            - Get health score for organization
 * - GET /api/platform/health/{organizationId}/history    - Get health score history
 * - GET /api/platform/health/{organizationId}/report     - Get health report
 * - POST /api/platform/health/{organizationId}/recalculate - Recalculate health score
 */
@RestController
@RequestMapping("/api/platform/health")
@PlatformSecured
@Tag(name = "Health Monitoring", description = "Platform and client health monitoring")
class PlatformHealthController(
    private val healthScoreService: HealthScoreService
) {
    /**
     * Gets health overview statistics.
     */
    @Operation(summary = "Get health overview", description = "Returns aggregated health statistics across all clients")
    @ApiResponse(responseCode = "200", description = "Health statistics retrieved successfully")
    @GetMapping("/overview")
    fun getOverview(): ResponseEntity<HealthStatistics> {
        val stats = healthScoreService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    /**
     * Gets all at-risk clients (health score < 60).
     */
    @Operation(summary = "Get at-risk clients", description = "Returns paginated list of clients with health score below 60")
    @ApiResponse(responseCode = "200", description = "At-risk clients retrieved successfully")
    @GetMapping("/at-risk")
    fun getAtRiskClients(pageable: Pageable): ResponseEntity<Page<ClientHealthScoreResponse>> {
        val page = healthScoreService.getAtRiskClients(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets all healthy clients (health score >= 80).
     */
    @Operation(summary = "Get healthy clients", description = "Returns paginated list of clients with health score 80 or above")
    @ApiResponse(responseCode = "200", description = "Healthy clients retrieved successfully")
    @GetMapping("/healthy")
    fun getHealthyClients(pageable: Pageable): ResponseEntity<Page<ClientHealthScoreResponse>> {
        val page = healthScoreService.getHealthyClients(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets clients with declining health scores.
     */
    @Operation(summary = "Get declining clients", description = "Returns paginated list of clients with declining health trend")
    @ApiResponse(responseCode = "200", description = "Declining clients retrieved successfully")
    @GetMapping("/declining")
    fun getDecliningClients(pageable: Pageable): ResponseEntity<Page<ClientHealthScoreResponse>> {
        val page = healthScoreService.getDecliningClients(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets clients by risk level.
     */
    @Operation(summary = "Get clients by risk level", description = "Returns paginated list of clients filtered by the specified risk level")
    @ApiResponse(responseCode = "200", description = "Clients retrieved successfully")
    @GetMapping("/by-risk/{riskLevel}")
    fun getByRiskLevel(
        @PathVariable riskLevel: RiskLevel,
        pageable: Pageable
    ): ResponseEntity<Page<ClientHealthScoreResponse>> {
        val page = healthScoreService.getByRiskLevel(riskLevel, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets the latest health score for an organization.
     */
    @Operation(summary = "Get health score by organization", description = "Returns the latest health score for a specific organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Health score retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @GetMapping("/{organizationId}")
    fun getByOrganizationId(
        @PathVariable organizationId: UUID
    ): ResponseEntity<ClientHealthScoreResponse> {
        val score = healthScoreService.getLatestScore(organizationId)
        return ResponseEntity.ok(score.toResponse())
    }

    /**
     * Gets health score history for an organization.
     */
    @Operation(summary = "Get health score history", description = "Returns paginated health score history for an organization over the specified number of days")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Health score history retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @GetMapping("/{organizationId}/history")
    fun getHistory(
        @PathVariable organizationId: UUID,
        @RequestParam(defaultValue = "30") days: Int,
        pageable: Pageable
    ): ResponseEntity<Page<ClientHealthScoreResponse>> {
        val page = healthScoreService.getScoreHistory(organizationId, days, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets a detailed health report for an organization.
     */
    @Operation(summary = "Get health report", description = "Returns a detailed health report for an organization including recommendations")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Health report retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @GetMapping("/{organizationId}/report")
    fun getReport(
        @PathVariable organizationId: UUID
    ): ResponseEntity<HealthReport> {
        val report = healthScoreService.getHealthReport(organizationId)
        return ResponseEntity.ok(report)
    }

    /**
     * Recalculates the health score for an organization.
     */
    @Operation(summary = "Recalculate health score", description = "Recalculates and saves the health score for an organization based on provided metrics")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Health score recalculated successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @PostMapping("/{organizationId}/recalculate")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun recalculate(
        @PathVariable organizationId: UUID,
        @RequestBody metrics: HealthMetrics
    ): ResponseEntity<ClientHealthScoreResponse> {
        val score = healthScoreService.calculateAndSaveScore(organizationId, metrics)
        return ResponseEntity.ok(score.toResponse())
    }
}

/**
 * Response DTO for client health score.
 */
data class ClientHealthScoreResponse(
    val id: UUID,
    val organizationId: UUID,
    val overallScore: Int,
    val usageScore: Int,
    val engagementScore: Int,
    val paymentScore: Int,
    val supportScore: Int,
    val riskLevel: RiskLevel,
    val trend: HealthTrend,
    val scoreChange: Int?,
    val calculatedAt: String
)

/**
 * Extension function to convert ClientHealthScore to response DTO.
 */
private fun ClientHealthScore.toResponse() = ClientHealthScoreResponse(
    id = this.id,
    organizationId = this.organizationId,
    overallScore = this.overallScore,
    usageScore = this.usageScore,
    engagementScore = this.engagementScore,
    paymentScore = this.paymentScore,
    supportScore = this.supportScore,
    riskLevel = this.riskLevel,
    trend = this.trend,
    scoreChange = this.scoreChange,
    calculatedAt = this.calculatedAt.toString()
)
