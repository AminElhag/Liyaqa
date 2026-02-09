package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ChangeStageRequest
import com.liyaqa.platform.api.dto.CreateDealActivityRequest
import com.liyaqa.platform.api.dto.DealActivityResponse
import com.liyaqa.platform.api.dto.DealCreateRequest
import com.liyaqa.platform.api.dto.DealMetricsResponse
import com.liyaqa.platform.api.dto.DealPipelineResponse
import com.liyaqa.platform.api.dto.DealResponse
import com.liyaqa.platform.api.dto.DealSummaryResponse
import com.liyaqa.platform.api.dto.DealUpdateRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.application.services.DealService
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStage
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
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
@RequestMapping("/api/platform/deals")
@PlatformSecured
@Tag(name = "Deals", description = "Manage sales deals and pipeline")
class DealController(
    private val dealService: DealService
) {
    @Operation(summary = "Create a deal", description = "Creates a new sales deal in the pipeline. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "Deal created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body")
    ])
    @PostMapping
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun createDeal(
        @Valid @RequestBody request: DealCreateRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.createDeal(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(DealResponse.from(deal))
    }

    @Operation(summary = "List deals", description = "Returns a paginated list of deals with optional filtering by stage, source, and assignee.")
    @ApiResponse(responseCode = "200", description = "Deals retrieved successfully")
    @GetMapping
    fun listDeals(
        @RequestParam(required = false) stage: DealStage?,
        @RequestParam(required = false) source: DealSource?,
        @RequestParam(required = false) assignedToId: UUID?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val dealsPage = dealService.listDeals(stage, source, assignedToId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = dealsPage.content.map { DealSummaryResponse.from(it) },
                page = dealsPage.number,
                size = dealsPage.size,
                totalElements = dealsPage.totalElements,
                totalPages = dealsPage.totalPages,
                first = dealsPage.isFirst,
                last = dealsPage.isLast
            )
        )
    }

    @Operation(summary = "Get deals by status/stage", description = "Returns a paginated list of deals filtered by stage.")
    @ApiResponse(responseCode = "200", description = "Deals retrieved successfully")
    @GetMapping("/status/{status}")
    fun getDealsByStatus(
        @PathVariable status: DealStage,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "100") size: Int
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val dealsPage = dealService.listDeals(stage = status, pageable = pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = dealsPage.content.map { DealSummaryResponse.from(it) },
                page = dealsPage.number,
                size = dealsPage.size,
                totalElements = dealsPage.totalElements,
                totalPages = dealsPage.totalPages,
                first = dealsPage.isFirst,
                last = dealsPage.isLast
            )
        )
    }

    @Operation(summary = "Get a deal by ID", description = "Retrieves the details of a specific deal including its activities.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Deal found"),
        ApiResponse(responseCode = "404", description = "Deal not found")
    ])
    @GetMapping("/{id}")
    fun getDeal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.getDeal(id)
        val activities = dealService.getActivities(id)
        return ResponseEntity.ok(DealResponse.from(deal, activities))
    }

    @Operation(summary = "Update a deal", description = "Updates an existing deal. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Deal updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Deal not found")
    ])
    @PutMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun updateDeal(
        @PathVariable id: UUID,
        @Valid @RequestBody request: DealUpdateRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.updateDeal(id, request.toCommand())
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    @Operation(summary = "Change deal stage", description = "Moves a deal to a different pipeline stage. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Deal stage changed successfully"),
        ApiResponse(responseCode = "404", description = "Deal not found"),
        ApiResponse(responseCode = "422", description = "Invalid stage transition")
    ])
    @PutMapping("/{id}/stage")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun changeDealStage(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeStageRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.changeDealStage(id, request.toCommand())
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    @Operation(summary = "Add an activity to a deal", description = "Records a new activity (call, email, meeting, etc.) on a deal. Requires PLATFORM_ADMIN or ACCOUNT_MANAGER role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "Activity added successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request body"),
        ApiResponse(responseCode = "404", description = "Deal not found")
    ])
    @PostMapping("/{id}/activities")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN, PlatformUserRole.ACCOUNT_MANAGER])
    fun addActivity(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateDealActivityRequest
    ): ResponseEntity<DealActivityResponse> {
        val activity = dealService.addActivity(id, request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(DealActivityResponse.from(activity))
    }

    @Operation(summary = "Get deal activities", description = "Retrieves all activities recorded for a specific deal.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Activities retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Deal not found")
    ])
    @GetMapping("/{id}/activities")
    fun getActivities(@PathVariable id: UUID): ResponseEntity<List<DealActivityResponse>> {
        val activities = dealService.getActivities(id)
        return ResponseEntity.ok(activities.map { DealActivityResponse.from(it) })
    }

    @Operation(summary = "Get deal pipeline", description = "Returns the count of deals in each pipeline stage.")
    @ApiResponse(responseCode = "200", description = "Pipeline counts retrieved successfully")
    @GetMapping("/pipeline")
    fun getPipeline(): ResponseEntity<DealPipelineResponse> {
        val counts = dealService.getPipelineCounts()
        return ResponseEntity.ok(DealPipelineResponse(counts = counts))
    }

    @Operation(summary = "Get deal metrics", description = "Returns aggregated deal metrics including win rate, average deal size, and conversion rates.")
    @ApiResponse(responseCode = "200", description = "Deal metrics retrieved successfully")
    @GetMapping("/metrics")
    fun getMetrics(): ResponseEntity<DealMetricsResponse> {
        val metrics = dealService.getMetrics()
        return ResponseEntity.ok(DealMetricsResponse.from(metrics))
    }
}
