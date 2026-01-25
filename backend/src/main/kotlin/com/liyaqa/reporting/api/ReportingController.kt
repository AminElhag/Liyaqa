package com.liyaqa.reporting.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.reporting.application.commands.*
import com.liyaqa.reporting.application.services.*
import com.liyaqa.shared.infrastructure.security.CurrentUser
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Report generation and scheduling")
class ReportingController(
    private val scheduledReportService: ScheduledReportService,
    private val churnAnalysisService: ChurnAnalysisService,
    private val ltvAnalysisService: LtvAnalysisService,
    private val objectMapper: ObjectMapper
) {
    // ========== Churn Report ==========

    @PostMapping("/churn")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Generate churn analysis report")
    fun generateChurnReport(
        @Valid @RequestBody request: GenerateChurnReportRequest
    ): ResponseEntity<ChurnReportResponse> {
        val filters = ChurnReportFilters(
            startDate = request.startDate,
            endDate = request.endDate,
            planIds = request.planIds,
            locationIds = request.locationIds
        )
        val reportData = churnAnalysisService.generateChurnReport(filters)
        return ResponseEntity.ok(ChurnReportResponse.from(reportData))
    }

    // ========== LTV Report ==========

    @PostMapping("/ltv")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Generate LTV analysis report")
    fun generateLtvReport(
        @Valid @RequestBody request: GenerateLtvReportRequest
    ): ResponseEntity<LtvReportResponse> {
        val filters = LtvReportFilters(
            startDate = request.startDate,
            endDate = request.endDate,
            segmentBy = request.segmentBy
        )
        val reportData = ltvAnalysisService.generateLtvReport(filters)
        return ResponseEntity.ok(LtvReportResponse.from(reportData))
    }

    // ========== Scheduled Reports ==========

    @PostMapping("/scheduled")
    @PreAuthorize("hasAuthority('reports_manage')")
    @Operation(summary = "Create a scheduled report")
    fun createScheduledReport(
        @Valid @RequestBody request: CreateScheduledReportRequest,
        @AuthenticationPrincipal currentUser: CurrentUser
    ): ResponseEntity<ScheduledReportResponse> {
        val command = CreateScheduledReportCommand(
            name = request.name,
            nameAr = request.nameAr,
            reportType = request.reportType,
            frequency = request.frequency,
            recipients = request.recipients,
            filters = request.filters,
            format = request.format
        )
        val report = scheduledReportService.createScheduledReport(command, currentUser.id)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ScheduledReportResponse.from(report, objectMapper))
    }

    @GetMapping("/scheduled")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "List scheduled reports")
    fun listScheduledReports(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<ScheduledReportResponse>> {
        val direction = Sort.Direction.valueOf(sortDirection.uppercase())
        val pageable = PageRequest.of(page, size, Sort.by(direction, sortBy))
        val reportsPage = scheduledReportService.listScheduledReports(pageable)

        val response = PageResponse(
            content = reportsPage.content.map { ScheduledReportResponse.from(it, objectMapper) },
            page = reportsPage.number,
            size = reportsPage.size,
            totalElements = reportsPage.totalElements,
            totalPages = reportsPage.totalPages,
            first = reportsPage.isFirst,
            last = reportsPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/scheduled/{id}")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Get a scheduled report")
    fun getScheduledReport(@PathVariable id: UUID): ResponseEntity<ScheduledReportResponse> {
        val report = scheduledReportService.getScheduledReport(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ScheduledReportResponse.from(report, objectMapper))
    }

    @PutMapping("/scheduled/{id}")
    @PreAuthorize("hasAuthority('reports_manage')")
    @Operation(summary = "Update a scheduled report")
    fun updateScheduledReport(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateScheduledReportRequest
    ): ResponseEntity<ScheduledReportResponse> {
        val command = UpdateScheduledReportCommand(
            name = request.name,
            nameAr = request.nameAr,
            frequency = request.frequency,
            recipients = request.recipients,
            filters = request.filters,
            format = request.format,
            enabled = request.enabled
        )
        val report = scheduledReportService.updateScheduledReport(id, command)
        return ResponseEntity.ok(ScheduledReportResponse.from(report, objectMapper))
    }

    @DeleteMapping("/scheduled/{id}")
    @PreAuthorize("hasAuthority('reports_manage')")
    @Operation(summary = "Delete a scheduled report")
    fun deleteScheduledReport(@PathVariable id: UUID): ResponseEntity<Void> {
        scheduledReportService.deleteScheduledReport(id)
        return ResponseEntity.noContent().build()
    }

    @PostMapping("/scheduled/{id}/enable")
    @PreAuthorize("hasAuthority('reports_manage')")
    @Operation(summary = "Enable a scheduled report")
    fun enableScheduledReport(@PathVariable id: UUID): ResponseEntity<ScheduledReportResponse> {
        val report = scheduledReportService.enableScheduledReport(id)
        return ResponseEntity.ok(ScheduledReportResponse.from(report, objectMapper))
    }

    @PostMapping("/scheduled/{id}/disable")
    @PreAuthorize("hasAuthority('reports_manage')")
    @Operation(summary = "Disable a scheduled report")
    fun disableScheduledReport(@PathVariable id: UUID): ResponseEntity<ScheduledReportResponse> {
        val report = scheduledReportService.disableScheduledReport(id)
        return ResponseEntity.ok(ScheduledReportResponse.from(report, objectMapper))
    }

    // ========== Report History ==========

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "List report generation history")
    fun listReportHistory(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ReportHistoryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val historyPage = scheduledReportService.listReportHistory(pageable)

        val response = PageResponse(
            content = historyPage.content.map { ReportHistoryResponse.from(it, objectMapper) },
            page = historyPage.number,
            size = historyPage.size,
            totalElements = historyPage.totalElements,
            totalPages = historyPage.totalPages,
            first = historyPage.isFirst,
            last = historyPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/history/{id}")
    @PreAuthorize("hasAuthority('reports_view')")
    @Operation(summary = "Get report history entry")
    fun getReportHistory(@PathVariable id: UUID): ResponseEntity<ReportHistoryResponse> {
        val history = scheduledReportService.getReportHistory(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ReportHistoryResponse.from(history, objectMapper))
    }
}
