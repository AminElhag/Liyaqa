package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.ConvertDealRequest
import com.liyaqa.platform.api.dto.CreateDealRequest
import com.liyaqa.platform.api.dto.DealConversionResultResponse
import com.liyaqa.platform.api.dto.DealResponse
import com.liyaqa.platform.api.dto.DealStatsResponse
import com.liyaqa.platform.api.dto.DealSummaryResponse
import com.liyaqa.platform.api.dto.LoseDealRequest
import com.liyaqa.platform.api.dto.PageResponse
import com.liyaqa.platform.api.dto.ReassignDealRequest
import com.liyaqa.platform.api.dto.SalesRepDealStatsResponse
import com.liyaqa.platform.api.dto.UpdateDealRequest
import com.liyaqa.platform.application.services.DealService
import com.liyaqa.platform.domain.model.DealSource
import com.liyaqa.platform.domain.model.DealStatus
import com.liyaqa.shared.infrastructure.security.SecurityService
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * Controller for managing sales deals in the pipeline.
 * Accessible by platform users (internal Liyaqa team) only.
 *
 * Endpoints:
 * - GET    /api/platform/deals                  - List all deals
 * - GET    /api/platform/deals/stats            - Get deal pipeline statistics
 * - GET    /api/platform/deals/status/{status}  - Filter by status
 * - GET    /api/platform/deals/source/{source}  - Filter by source
 * - GET    /api/platform/deals/expiring         - Get deals expected to close soon
 * - GET    /api/platform/deals/{id}             - Get deal details
 * - GET    /api/platform/my-deals               - Get current user's deals
 * - GET    /api/platform/deals/sales-rep/{id}   - Get deals by sales rep
 * - GET    /api/platform/deals/sales-rep/{id}/stats - Get stats for sales rep
 * - POST   /api/platform/deals                  - Create deal
 * - PUT    /api/platform/deals/{id}             - Update deal
 * - POST   /api/platform/deals/{id}/advance     - Advance to next stage
 * - POST   /api/platform/deals/{id}/qualify     - Move to QUALIFIED
 * - POST   /api/platform/deals/{id}/proposal    - Move to PROPOSAL
 * - POST   /api/platform/deals/{id}/negotiate   - Move to NEGOTIATION
 * - POST   /api/platform/deals/{id}/convert     - Convert to client
 * - POST   /api/platform/deals/{id}/lose        - Mark as lost
 * - POST   /api/platform/deals/{id}/reopen      - Reopen lost deal
 * - POST   /api/platform/deals/{id}/reassign    - Reassign to another rep
 * - DELETE /api/platform/deals/{id}             - Delete deal
 */
@RestController
@RequestMapping("/api/platform")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'MARKETING', 'SUPPORT')")
class DealController(
    private val dealService: DealService,
    private val securityService: SecurityService
) {
    // ============================================
    // CRUD Operations
    // ============================================

    /**
     * Creates a new deal.
     * Only PLATFORM_ADMIN and SALES_REP can create deals.
     */
    @PostMapping("/deals")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun createDeal(
        @Valid @RequestBody request: CreateDealRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.createDeal(request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(DealResponse.from(deal))
    }

    /**
     * Gets a deal by ID.
     */
    @GetMapping("/deals/{id}")
    fun getDeal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.getDeal(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Lists all deals with pagination.
     */
    @GetMapping("/deals")
    fun getAllDeals(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)
        val dealsPage = dealService.getAllDeals(pageable)

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

    /**
     * Gets deals filtered by status.
     */
    @GetMapping("/deals/status/{status}")
    fun getDealsByStatus(
        @PathVariable status: DealStatus,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val dealsPage = dealService.getDealsByStatus(status, pageable)

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

    /**
     * Gets deals filtered by source.
     */
    @GetMapping("/deals/source/{source}")
    fun getDealsBySource(
        @PathVariable source: DealSource,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val dealsPage = dealService.getDealsBySource(source, pageable)

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

    /**
     * Gets all open deals (not WON or LOST).
     */
    @GetMapping("/deals/open")
    fun getOpenDeals(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "expectedCloseDate"))
        val dealsPage = dealService.getOpenDeals(pageable)

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

    /**
     * Gets deals expected to close within given days.
     */
    @GetMapping("/deals/expiring")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun getDealsExpectedToClose(
        @RequestParam(defaultValue = "30") daysAhead: Int
    ): ResponseEntity<List<DealSummaryResponse>> {
        val deals = dealService.getDealsExpectedToClose(daysAhead)
        return ResponseEntity.ok(deals.map { DealSummaryResponse.from(it) })
    }

    /**
     * Gets the current user's deals (for sales reps).
     */
    @GetMapping("/my-deals")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun getMyDeals(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "false") openOnly: Boolean
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("Could not determine current user")

        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val dealsPage = if (openOnly) {
            dealService.getOpenDealsBySalesRep(currentUserId, pageable)
        } else {
            dealService.getDealsBySalesRep(currentUserId, pageable)
        }

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

    /**
     * Gets deals by sales rep.
     * Only PLATFORM_ADMIN can view other reps' deals.
     */
    @GetMapping("/deals/sales-rep/{salesRepId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun getDealsBySalesRep(
        @PathVariable salesRepId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "false") openOnly: Boolean
    ): ResponseEntity<PageResponse<DealSummaryResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val dealsPage = if (openOnly) {
            dealService.getOpenDealsBySalesRep(salesRepId, pageable)
        } else {
            dealService.getDealsBySalesRep(salesRepId, pageable)
        }

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

    /**
     * Updates a deal.
     * Only PLATFORM_ADMIN and SALES_REP can update deals.
     */
    @PutMapping("/deals/{id}")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun updateDeal(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateDealRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.updateDeal(id, request.toCommand())
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Deletes a deal. Only LEAD or LOST deals can be deleted.
     * Only PLATFORM_ADMIN can delete deals.
     */
    @DeleteMapping("/deals/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun deleteDeal(@PathVariable id: UUID): ResponseEntity<Void> {
        dealService.deleteDeal(id)
        return ResponseEntity.noContent().build()
    }

    // ============================================
    // Status Transitions
    // ============================================

    /**
     * Advances a deal to the next stage.
     */
    @PostMapping("/deals/{id}/advance")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun advanceDeal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.advanceDeal(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Qualifies a deal (LEAD -> QUALIFIED).
     */
    @PostMapping("/deals/{id}/qualify")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun qualifyDeal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.qualifyDeal(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Sends a proposal (QUALIFIED -> PROPOSAL).
     */
    @PostMapping("/deals/{id}/proposal")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun sendProposal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.sendProposal(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Starts negotiation (PROPOSAL -> NEGOTIATION).
     */
    @PostMapping("/deals/{id}/negotiate")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun startNegotiation(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.startNegotiation(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Converts a deal to a client.
     * Creates organization, club, admin user, and optionally subscription.
     */
    @PostMapping("/deals/{id}/convert")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun convertDeal(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ConvertDealRequest
    ): ResponseEntity<DealConversionResultResponse> {
        val result = dealService.convertDeal(id, request.toCommand())
        return ResponseEntity.status(HttpStatus.CREATED).body(DealConversionResultResponse.from(result))
    }

    /**
     * Marks a deal as lost with a reason.
     */
    @PostMapping("/deals/{id}/lose")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun loseDeal(
        @PathVariable id: UUID,
        @Valid @RequestBody request: LoseDealRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.loseDeal(id, request.toCommand())
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Reopens a lost deal back to LEAD status.
     */
    @PostMapping("/deals/{id}/reopen")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun reopenDeal(@PathVariable id: UUID): ResponseEntity<DealResponse> {
        val deal = dealService.reopenDeal(id)
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    /**
     * Reassigns a deal to another sales rep.
     * Only PLATFORM_ADMIN can reassign deals.
     */
    @PostMapping("/deals/{id}/reassign")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun reassignDeal(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ReassignDealRequest
    ): ResponseEntity<DealResponse> {
        val deal = dealService.reassignDeal(id, request.toCommand())
        return ResponseEntity.ok(DealResponse.from(deal))
    }

    // ============================================
    // Statistics
    // ============================================

    /**
     * Gets deal pipeline statistics.
     */
    @GetMapping("/deals/stats")
    fun getDealStats(): ResponseEntity<DealStatsResponse> {
        val stats = dealService.getDealStats()
        return ResponseEntity.ok(DealStatsResponse.from(stats))
    }

    /**
     * Gets deal statistics for a specific sales rep.
     */
    @GetMapping("/deals/sales-rep/{salesRepId}/stats")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun getSalesRepDealStats(
        @PathVariable salesRepId: UUID
    ): ResponseEntity<SalesRepDealStatsResponse> {
        val stats = dealService.getDealStatsForSalesRep(salesRepId)
        return ResponseEntity.ok(SalesRepDealStatsResponse.from(stats))
    }

    /**
     * Gets current user's deal statistics.
     */
    @GetMapping("/my-deals/stats")
    @PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP')")
    fun getMyDealStats(): ResponseEntity<SalesRepDealStatsResponse> {
        val currentUserId = securityService.getCurrentUserId()
            ?: throw IllegalStateException("Could not determine current user")
        val stats = dealService.getDealStatsForSalesRep(currentUserId)
        return ResponseEntity.ok(SalesRepDealStatsResponse.from(stats))
    }
}
