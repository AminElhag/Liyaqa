package com.liyaqa.platform.support.controller

import com.liyaqa.platform.domain.model.PlatformPermission
import com.liyaqa.platform.infrastructure.security.PlatformSecured
import com.liyaqa.platform.support.dto.AddMessageRequest
import com.liyaqa.platform.support.dto.AssignTicketRequest
import com.liyaqa.platform.support.dto.CannedResponseResponse
import com.liyaqa.platform.support.dto.ChangePriorityRequest
import com.liyaqa.platform.support.dto.ChangeStatusRequest
import com.liyaqa.platform.support.dto.CreateCannedResponseRequest
import com.liyaqa.platform.support.dto.CreateTicketRequest
import com.liyaqa.platform.support.dto.EscalateRequest
import com.liyaqa.platform.support.dto.RateTicketRequest
import com.liyaqa.platform.support.dto.TicketDetailResponse
import com.liyaqa.platform.support.dto.TicketMessageResponse
import com.liyaqa.platform.support.dto.TicketResponse
import com.liyaqa.platform.support.dto.TicketSummaryResponse
import com.liyaqa.platform.support.dto.UpdateCannedResponseRequest
import com.liyaqa.platform.support.dto.UpdateTicketRequest
import com.liyaqa.platform.support.model.CreatedByUserType
import com.liyaqa.platform.support.model.TicketCategory
import com.liyaqa.platform.support.model.TicketPriority
import com.liyaqa.platform.support.model.TicketStatus
import com.liyaqa.platform.support.service.TicketService
import com.liyaqa.shared.api.PageResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
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
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/platform/tickets")
@PlatformSecured
@Tag(name = "Support Tickets", description = "Support ticket CRUD operations")
class TicketController(
    private val ticketService: TicketService
) {

    @PostMapping
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_CREATE])
    @Operation(summary = "Create a support ticket", description = "Creates a new support ticket on behalf of a tenant or internally")
    @ApiResponse(responseCode = "201", description = "Support ticket created successfully")
    fun createTicket(
        @Valid @RequestBody request: CreateTicketRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<TicketResponse> {
        val userId = getCurrentUserId(userDetails)
        val cmd = request.toCommand(userId, CreatedByUserType.PLATFORM_AGENT)
        val ticket = ticketService.createTicket(cmd)
        return ResponseEntity.status(HttpStatus.CREATED).body(TicketResponse.from(ticket))
    }

    @GetMapping
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_VIEW])
    @Operation(summary = "List support tickets", description = "Returns a paginated list of support tickets with optional filters for status, priority, category, and more")
    @ApiResponse(responseCode = "200", description = "Paginated list of support tickets")
    fun listTickets(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "DESC") sortDirection: String,
        @RequestParam(required = false) status: TicketStatus?,
        @RequestParam(required = false) priority: TicketPriority?,
        @RequestParam(required = false) category: TicketCategory?,
        @RequestParam(required = false) assignedTo: UUID?,
        @RequestParam(required = false) tenantId: UUID?,
        @RequestParam(required = false) dateFrom: Instant?,
        @RequestParam(required = false) dateTo: Instant?,
        @RequestParam(required = false) slaBreached: Boolean?,
        @RequestParam(required = false) search: String?
    ): ResponseEntity<PageResponse<TicketSummaryResponse>> {
        val sort = Sort.by(Sort.Direction.valueOf(sortDirection.uppercase()), sortBy)
        val pageable = PageRequest.of(page, size, sort)

        val ticketsPage = ticketService.listTickets(
            status = status,
            priority = priority,
            category = category,
            assignedToId = assignedTo,
            tenantId = tenantId,
            slaBreached = slaBreached,
            dateFrom = dateFrom,
            dateTo = dateTo,
            search = search,
            pageable = pageable
        )

        return ResponseEntity.ok(
            PageResponse.from(ticketsPage) { TicketSummaryResponse.from(it) }
        )
    }

    @GetMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_VIEW])
    @Operation(summary = "Get a support ticket by ID", description = "Returns full ticket details including messages and activity history")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket detail"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    )
    fun getTicket(@PathVariable id: UUID): ResponseEntity<TicketDetailResponse> {
        val detail = ticketService.getTicket(id)
        return ResponseEntity.ok(detail)
    }

    @PutMapping("/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Update a support ticket", description = "Updates the ticket's subject, description, category, or other editable fields")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket updated successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    )
    fun updateTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateTicketRequest
    ): ResponseEntity<TicketResponse> {
        val ticket = ticketService.updateTicket(id, request.toCommand())
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    @PutMapping("/{id}/assign")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_ASSIGN])
    @Operation(summary = "Assign a ticket to an agent", description = "Assigns or reassigns a support ticket to a platform agent")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket assigned successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    )
    fun assignTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignTicketRequest
    ): ResponseEntity<TicketResponse> {
        val ticket = ticketService.assignTicket(id, request.toCommand())
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    @PutMapping("/{id}/status")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Change ticket status", description = "Transitions the ticket to a new status (e.g., open, in-progress, resolved, closed)")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket status changed successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found"),
        ApiResponse(responseCode = "422", description = "Invalid status transition")
    )
    fun changeStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeStatusRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<TicketResponse> {
        val userId = getCurrentUserId(userDetails)
        val ticket = ticketService.changeStatus(id, request.toCommand(), userId)
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    @PutMapping("/{id}/priority")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Change ticket priority", description = "Updates the priority level of a support ticket")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket priority changed successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    )
    fun changePriority(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangePriorityRequest
    ): ResponseEntity<TicketResponse> {
        val ticket = ticketService.changePriority(id, request.toCommand())
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    @PutMapping("/{id}/escalate")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Escalate a ticket", description = "Escalates a support ticket to a higher tier with an escalation reason")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Ticket escalated successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found"),
        ApiResponse(responseCode = "422", description = "Ticket cannot be escalated further")
    )
    fun escalateTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: EscalateRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<TicketResponse> {
        val userId = getCurrentUserId(userDetails)
        val ticket = ticketService.escalateTicket(id, request.toCommand(), userId)
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    @PostMapping("/{id}/messages")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_CREATE])
    @Operation(summary = "Add a message to a ticket", description = "Posts a new message to the ticket's conversation thread")
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Message added successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found")
    )
    fun addMessage(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddMessageRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<TicketMessageResponse> {
        val userId = getCurrentUserId(userDetails)
        val cmd = request.toCommand(userId, CreatedByUserType.PLATFORM_AGENT)
        val message = ticketService.addMessage(id, cmd)
        return ResponseEntity.status(HttpStatus.CREATED).body(TicketMessageResponse.from(message))
    }

    @PostMapping("/{id}/rate")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Rate a ticket", description = "Submits a satisfaction rating for a resolved or closed ticket")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Rating submitted successfully"),
        ApiResponse(responseCode = "404", description = "Ticket not found"),
        ApiResponse(responseCode = "422", description = "Ticket is not in a ratable state")
    )
    fun rateTicket(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RateTicketRequest
    ): ResponseEntity<TicketResponse> {
        val ticket = ticketService.rateTicket(id, request.toCommand())
        return ResponseEntity.ok(TicketResponse.from(ticket))
    }

    // --- Canned Responses ---

    @GetMapping("/canned-responses")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_VIEW])
    @Operation(summary = "List canned responses", description = "Returns all canned responses, optionally filtered by ticket category")
    @ApiResponse(responseCode = "200", description = "List of canned responses")
    fun listCannedResponses(
        @RequestParam(required = false) category: TicketCategory?
    ): ResponseEntity<List<CannedResponseResponse>> {
        val responses = ticketService.listCannedResponses(category)
        return ResponseEntity.ok(responses.map { CannedResponseResponse.from(it) })
    }

    @PostMapping("/canned-responses")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_CREATE])
    @Operation(summary = "Create a canned response", description = "Creates a new reusable canned response template for ticket replies")
    @ApiResponse(responseCode = "201", description = "Canned response created successfully")
    fun createCannedResponse(
        @Valid @RequestBody request: CreateCannedResponseRequest,
        @AuthenticationPrincipal userDetails: UserDetails?
    ): ResponseEntity<CannedResponseResponse> {
        val userId = getCurrentUserId(userDetails)
        val response = ticketService.createCannedResponse(request.toCommand(userId))
        return ResponseEntity.status(HttpStatus.CREATED).body(CannedResponseResponse.from(response))
    }

    @PutMapping("/canned-responses/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_EDIT])
    @Operation(summary = "Update a canned response", description = "Updates an existing canned response template")
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Canned response updated successfully"),
        ApiResponse(responseCode = "404", description = "Canned response not found")
    )
    fun updateCannedResponse(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateCannedResponseRequest
    ): ResponseEntity<CannedResponseResponse> {
        val response = ticketService.updateCannedResponse(id, request.toCommand())
        return ResponseEntity.ok(CannedResponseResponse.from(response))
    }

    @DeleteMapping("/canned-responses/{id}")
    @PlatformSecured(permissions = [PlatformPermission.TICKETS_DELETE])
    @Operation(summary = "Delete a canned response", description = "Permanently removes a canned response template")
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Canned response deleted successfully"),
        ApiResponse(responseCode = "404", description = "Canned response not found")
    )
    fun deleteCannedResponse(@PathVariable id: UUID): ResponseEntity<Unit> {
        ticketService.deleteCannedResponse(id)
        return ResponseEntity.noContent().build()
    }

    private fun getCurrentUserId(userDetails: UserDetails?): UUID {
        return try {
            UUID.fromString(userDetails?.username)
        } catch (e: Exception) {
            throw IllegalStateException("User not authenticated")
        }
    }
}
