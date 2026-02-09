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
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import com.liyaqa.platform.domain.model.PlatformUserRole
import com.liyaqa.platform.infrastructure.security.PlatformSecured
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
@PlatformSecured
@Tag(name = "Support Tickets", description = "Support ticket management")
class SupportTicketController(
    private val supportTicketService: SupportTicketService
) {

    /**
     * Create a new support ticket.
     */
    @Operation(summary = "Create support ticket", description = "Creates a new support ticket with the specified details")
    @ApiResponse(responseCode = "201", description = "Ticket created successfully")
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
    @Operation(summary = "List support tickets", description = "Returns paginated list of support tickets with optional status, priority, category, and search filters")
    @ApiResponse(responseCode = "200", description = "Tickets retrieved successfully")
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
    @Operation(summary = "Get support ticket", description = "Returns a specific support ticket by its ID")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Ticket retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
    @GetMapping("/{id}")
    fun getTicket(@PathVariable id: UUID): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.getTicket(id)
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Update ticket.
     */
    @Operation(summary = "Update support ticket", description = "Updates the details of an existing support ticket")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Ticket updated successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
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
    @Operation(summary = "Change ticket status", description = "Changes the status of a support ticket (e.g., open, in-progress, resolved, closed)")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Status changed successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found"),
        ApiResponse(responseCode = "422", description = "Invalid status transition")
    ])
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
    @Operation(summary = "Assign ticket", description = "Assigns a support ticket to a specific platform user")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Ticket assigned successfully"),
        ApiResponse(responseCode = "404", description = "Ticket or assignee not found")
    ])
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
    @Operation(summary = "Unassign ticket", description = "Removes the current assignee from a support ticket")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Ticket unassigned successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
    @PostMapping("/{id}/unassign")
    fun unassignTicket(@PathVariable id: UUID): ResponseEntity<SupportTicketResponse> {
        val ticket = supportTicketService.unassignTicket(id)
        return ResponseEntity.ok(SupportTicketResponse.from(ticket))
    }

    /**
     * Delete ticket.
     * Only PLATFORM_ADMIN can delete tickets.
     */
    @Operation(summary = "Delete support ticket", description = "Permanently deletes a support ticket")
    @ApiResponses(value = [
        ApiResponse(responseCode = "204", description = "Ticket deleted successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
    @DeleteMapping("/{id}")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun deleteTicket(@PathVariable id: UUID): ResponseEntity<Unit> {
        supportTicketService.deleteTicket(id)
        return ResponseEntity.noContent().build()
    }

    /**
     * Get ticket messages.
     */
    @Operation(summary = "Get ticket messages", description = "Returns all messages for a specific support ticket")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Messages retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
    @GetMapping("/{id}/messages")
    fun getMessages(@PathVariable id: UUID): ResponseEntity<List<TicketMessageResponse>> {
        val messages = supportTicketService.getMessages(id)
        return ResponseEntity.ok(messages.map { TicketMessageResponse.from(it) })
    }

    /**
     * Add message to ticket.
     */
    @Operation(summary = "Add ticket message", description = "Adds a new message to a support ticket thread")
    @ApiResponses(value = [
        ApiResponse(responseCode = "201", description = "Message added successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    ])
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
    @Operation(summary = "Get ticket statistics", description = "Returns aggregated support ticket statistics including counts by status and priority")
    @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully")
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
