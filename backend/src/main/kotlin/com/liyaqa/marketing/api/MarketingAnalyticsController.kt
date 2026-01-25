package com.liyaqa.marketing.api

import com.liyaqa.marketing.application.services.MarketingAnalyticsService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/marketing/analytics")
@Tag(name = "Marketing Analytics", description = "Campaign analytics and reporting")
class MarketingAnalyticsController(
    private val analyticsService: MarketingAnalyticsService
) {

    @GetMapping("/overview")
    @PreAuthorize("hasAuthority('marketing_analytics_read')")
    @Operation(summary = "Get marketing overview statistics")
    fun getOverview(): ResponseEntity<MarketingOverviewResponse> {
        val overview = analyticsService.getOverview()
        return ResponseEntity.ok(MarketingOverviewResponse.from(overview))
    }

    @GetMapping("/campaigns/{id}")
    @PreAuthorize("hasAuthority('marketing_analytics_read')")
    @Operation(summary = "Get campaign analytics")
    fun getCampaignAnalytics(@PathVariable id: UUID): ResponseEntity<CampaignAnalyticsResponse> {
        val analytics = analyticsService.getCampaignAnalytics(id)
        return ResponseEntity.ok(CampaignAnalyticsResponse.from(analytics))
    }

    @GetMapping("/campaigns/{id}/ab-test")
    @PreAuthorize("hasAuthority('marketing_analytics_read')")
    @Operation(summary = "Get A/B test results for campaign")
    fun getAbTestResults(@PathVariable id: UUID): ResponseEntity<List<AbTestResultResponse>> {
        val results = analyticsService.getAbTestResults(id)
        return ResponseEntity.ok(results.map { AbTestResultResponse.from(it) })
    }

    @GetMapping("/campaigns/{id}/timeline")
    @PreAuthorize("hasAuthority('marketing_analytics_read')")
    @Operation(summary = "Get campaign message timeline")
    fun getCampaignTimeline(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<List<TimelineDataPointResponse>> {
        val timeline = analyticsService.getCampaignTimeline(id, days)
        return ResponseEntity.ok(timeline.map { TimelineDataPointResponse.from(it) })
    }
}
