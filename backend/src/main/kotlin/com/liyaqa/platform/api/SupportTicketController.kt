package com.liyaqa.platform.api

import com.liyaqa.platform.api.dto.AssignTicketRequest
import com.liyaqa.platform.api.dto.ChangeTicketStatusRequest
import com.liyaqa.platform.api.dto.CreateSupportTicketRequest
import com.liyaqa.platform.api.dto.CreateTicketMessageRequest
import com.liyaqa.platform.api.dto.SupportTicketResponse
import com.liyaqa.platform.api.dto.SupportTicketSummaryResponse
import com.liyaqa.platform.api.dto.TicketMessageResponse
import com.liyaqa.platform.api.dto.TicketStatsResponse
import com.liyaqa.platform.api.dto.UpdateSupportTicketRequest
import com.liyaqa.platform.application.services.SupportTicketService
import com.liyaqa.platform.domain.model.TicketCategory
import com.liyaqa.platform.domain.model.TicketPriority
import com.liyaqa.platform.domain.model.TicketStatus
import com.liyaqa.platform.api.dto.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
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
 * REST controller for support ticket management.
 */
@RestController
@RequestMapping("/api/platform/support-tickets")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SALES_REP', 'SUPPORT_REP')")
class SupportTicketController(
    private val supportTicketService: SupportTicketService
) {

    /**
     * Create a new support ticket.
     */
    @PostMapping
    fun createTicket(
        @Valid @RequestBody request: CreateSupportTicketRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<SupportTicketResponse> {
        val createdById = getCurrentUserId(userDetails)
            ?: throw IllegalStateException("User not authenticated")
        val createdByEmail = userDetails?.username

        val ticket = supportTicketService.createTicket(
            request.toCommand(createdById, createdByEmail)
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(SupportTicketResponse.from(ticket))
    }

    /**
     * Get all tickets with optional filters.
     */
    @GetMapping
    fun getAllTickets(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) status: TicketStatus?,
        @RequestParam(required = false) priority: TicketPriority?,
        @RequestParam(required = false) category: TicketCategory?,
        @RequestParam(required = false) organizationId: UUID?,
        @RequestParam(required = false) assignedToId: UUID?,
        @RequestParam(required = false) search: String?
    ): ResponseEntity<PageResponse<SupportTicketSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val ticketsPage = supportTicketService.getAllTickets(
            status = status,
            priority = priority,
            category = category,
            organizationId = organizationId,
            assignedToId = assignedToId,
            search = search,
            pageable = pageable
        )

        return ResponseEntity.ok(
            PageResponse(
                content = ticketsPage.content.map { SupportTicketSummaryResponse.from(it) },
                page = ticketsPage.number,
                size = ticketsPage.size,
                totalElements = ticketsPage.totalElements,
                totalPages = ticketsPage.totalPages,
                first = ticketsPage.isFirst,
                last = ticketsPage.isLast
            )
        )
    }

    /**
     * Get ticket by ID.
     */
    @GetMapping("/{id}")
    fun getTicket(@PathVariable id: UUID): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.getTicket(id)
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Update ticket.
     */
    @PutMapping("/{id}")
    fun updateTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateSupportTicketRequest
    ): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.updateTicket(id, request.toCommand())
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Change ticket status.
     */
    @PostMapping("/{id}/status")
    fun changeStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeTicketStatusRequest
    ): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.changeStatus(id, request.toCommand())
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Assign ticket to a user.
     */
    @PostMapping("/{id}/assign")
    fun assignTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignTicketRequest
    ): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.assignTicket(id, request.toCommand())
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Unassign ticket.
     */
    @PostMapping("/{id}/unassign")
    fun unassignTicket(@PathVariable id: UUID): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.unassignTicket(id)
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Delete ticket.
     * Only PLATFORM_ADMIN can delete tickets.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    fun deleteTicket(@PathVariable id: UUID): ResponseEntity<Unit> {
        supportTicketService.deleteTicket(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get ticket messages.
     */
    @GetMapping("/{id}/messages")
    fun getMessages(@PathVariable id: UUID): ResponseEntity<List<TicketMessageResponse>> {
        val messages = supportTicketService.getMessages(id)
        return ResponseEntity.ok(messages.map { TicketMessageResponse.from(it) })
    }

    /**
     * Add message to ticket.
     */
    @PostMapping("/{id}/messages")
    fun addMessage(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateTicketMessageRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<TicketMessageResponse> {
        val authorId = getCurrentUserId(userDetails)
            ?: throw IllegalStateException("User not authenticated")

        val message = supportTicketService.addMessage(
            id,
            request.toCommand(authorId)
        )
        return ResponseEntity.status(HttpStatus.CREATED).body(TicketMessageResponse.from(message))
    }

    /**
     * Get ticket statistics.
     */
    @GetMapping("/stats")
    fun getStats(): ResponseEntity<TicketStatsResponse> {
        val stats = supportTicketService.getStats()
        return ResponseEntity.ok(TicketStatsResponse.from(stats))
    }

    /**
     * Helper to get current user ID from authentication.
     */
    private fun getCurrentUserId(userDetails: UserDetails?): UUID? {
        return try {
            userDetails?.username?.let { UUID.fromString(it) }
        } catch (e: IllegalArgumentException) {
            null
        }
    }
}
