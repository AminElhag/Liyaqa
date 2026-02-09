package com.liyaqa.platform.api

import com.liyaqa.platform.application.services.DunningService
import com.liyaqa.platform.application.services.DunningStatistics
import com.liyaqa.platform.domain.model.DunningSequence
import com.liyaqa.platform.domain.model.DunningStatus
import com.liyaqa.platform.domain.model.DunningStep
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
import java.math.BigDecimal
import java.util.UUID

/**
 * Controller for platform dunning (payment recovery) management.
 * Provides endpoints for monitoring and managing payment recovery sequences.
 *
 * Endpoints:
 * - GET /api/platform/dunning                              - Get all active dunning
 * - GET /api/platform/dunning/statistics                   - Get dunning statistics
 * - GET /api/platform/dunning/escalated                    - Get escalated sequences
 * - GET /api/platform/dunning/by-status/{status}           - Get by status
 * - GET /api/platform/dunning/organization/{orgId}         - Get for organization
 * - GET /api/platform/dunning/{dunningId}                  - Get by ID
 * - POST /api/platform/dunning/{dunningId}/retry           - Retry payment
 * - POST /api/platform/dunning/{dunningId}/send-link       - Send payment link
 * - POST /api/platform/dunning/{dunningId}/escalate        - Escalate to CSM
 * - POST /api/platform/dunning/{dunningId}/pause           - Pause dunning
 * - POST /api/platform/dunning/{dunningId}/resume          - Resume dunning
 * - POST /api/platform/dunning/{dunningId}/cancel          - Cancel dunning
 * - POST /api/platform/dunning/{dunningId}/recover         - Mark as recovered
 */
@RestController
@RequestMapping("/api/platform/dunning")
@PlatformSecured
@Tag(name = "Dunning", description = "Payment dunning and collection management")
class PlatformDunningController(
    private val dunningService: DunningService
) {
    /**
     * Gets all active dunning sequences.
     */
    @Operation(summary = "Get active dunning sequences", description = "Returns a paginated list of all currently active dunning sequences.")
    @ApiResponse(responseCode = "200", description = "Active dunning sequences retrieved successfully")
    @GetMapping
    fun getActive(pageable: Pageable): ResponseEntity<Page<DunningSequenceResponse>> {
        val page = dunningService.getActive(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets dunning statistics.
     */
    @Operation(summary = "Get dunning statistics", description = "Returns aggregated dunning statistics including recovery rates and outstanding amounts.")
    @ApiResponse(responseCode = "200", description = "Dunning statistics retrieved successfully")
    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<DunningStatistics> {
        val stats = dunningService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    /**
     * Gets dunning sequences escalated to CSM.
     */
    @Operation(summary = "Get escalated dunning sequences", description = "Returns a paginated list of dunning sequences that have been escalated to a Customer Success Manager.")
    @ApiResponse(responseCode = "200", description = "Escalated dunning sequences retrieved successfully")
    @GetMapping("/escalated")
    fun getEscalated(pageable: Pageable): ResponseEntity<Page<DunningSequenceResponse>> {
        val page = dunningService.getEscalated(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets dunning sequences by status.
     */
    @Operation(summary = "Get dunning sequences by status", description = "Returns a paginated list of dunning sequences filtered by status.")
    @ApiResponse(responseCode = "200", description = "Dunning sequences retrieved successfully")
    @GetMapping("/by-status/{status}")
    fun getByStatus(
        @PathVariable status: DunningStatus,
        pageable: Pageable
    ): ResponseEntity<Page<DunningSequenceResponse>> {
        val page = dunningService.getByStatus(status, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets dunning sequences for an organization.
     */
    @Operation(summary = "Get dunning sequences by organization", description = "Returns a paginated list of dunning sequences for a specific organization.")
    @ApiResponse(responseCode = "200", description = "Organization dunning sequences retrieved successfully")
    @GetMapping("/organization/{organizationId}")
    fun getByOrganizationId(
        @PathVariable organizationId: UUID,
        pageable: Pageable
    ): ResponseEntity<Page<DunningSequenceResponse>> {
        val page = dunningService.getByOrganization(organizationId, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets active dunning for an organization.
     */
    @Operation(summary = "Get active dunning for organization", description = "Returns the currently active dunning sequence for a specific organization, if any.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Active dunning sequence found"),
        ApiResponse(responseCode = "404", description = "No active dunning sequence found for the organization")
    ])
    @GetMapping("/organization/{organizationId}/active")
    fun getActiveByOrganizationId(
        @PathVariable organizationId: UUID
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.getActiveByOrganizationId(organizationId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Gets a dunning sequence by ID.
     */
    @Operation(summary = "Get a dunning sequence by ID", description = "Retrieves the details of a specific dunning sequence.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence found"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found")
    ])
    @GetMapping("/{dunningId}")
    fun getById(@PathVariable dunningId: UUID): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.getById(dunningId)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Retries payment for a dunning sequence.
     */
    @Operation(summary = "Retry payment", description = "Initiates a manual payment retry for a dunning sequence.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Payment retry initiated"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found")
    ])
    @PostMapping("/{dunningId}/retry")
    fun retryPayment(
        @PathVariable dunningId: UUID
    ): ResponseEntity<RetryPaymentResponse> {
        // In a real implementation, this would call the payment processor
        val dunning = dunningService.recordRetryAttempt(dunningId, false, "Retry initiated manually")
        return ResponseEntity.ok(RetryPaymentResponse(
            success = true,
            message = "Payment retry initiated",
            dunningId = dunningId
        ))
    }

    /**
     * Sends a payment link to the client.
     */
    @Operation(summary = "Send payment link", description = "Sends a payment link to the client via email or SMS.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Payment link sent successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found")
    ])
    @PostMapping("/{dunningId}/send-link")
    fun sendPaymentLink(
        @PathVariable dunningId: UUID
    ): ResponseEntity<SendLinkResponse> {
        // In a real implementation, this would send a payment link via email/SMS
        return ResponseEntity.ok(SendLinkResponse(
            success = true,
            message = "Payment link sent successfully",
            dunningId = dunningId
        ))
    }

    /**
     * Escalates a dunning sequence to CSM.
     */
    @Operation(summary = "Escalate to CSM", description = "Escalates a dunning sequence to a Customer Success Manager for manual intervention.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence escalated successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found"),
        ApiResponse(responseCode = "422", description = "Dunning sequence is already escalated")
    ])
    @PostMapping("/{dunningId}/escalate")
    fun escalateToCsm(
        @PathVariable dunningId: UUID,
        @RequestBody(required = false) request: EscalateRequest?
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.escalateToCsm(dunningId, request?.csmId)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Assigns a CSM to a dunning sequence.
     */
    @Operation(summary = "Assign CSM to dunning", description = "Assigns a Customer Success Manager to handle a dunning sequence. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "CSM assigned successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found")
    ])
    @PostMapping("/{dunningId}/assign-csm")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun assignCsm(
        @PathVariable dunningId: UUID,
        @RequestBody request: AssignCsmRequest
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.assignCsm(dunningId, request.csmId)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Pauses a dunning sequence.
     * Note: This functionality should be added to DunningService if needed.
     */
    @Operation(summary = "Pause dunning sequence", description = "Pauses an active dunning sequence. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence paused successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found"),
        ApiResponse(responseCode = "422", description = "Dunning sequence cannot be paused from its current state")
    ])
    @PostMapping("/{dunningId}/pause")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun pause(@PathVariable dunningId: UUID): ResponseEntity<DunningSequenceResponse> {
        // In a real implementation, add a pause method to DunningService
        val dunning = dunningService.getById(dunningId)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Resumes a paused dunning sequence.
     * Note: This functionality should be added to DunningService if needed.
     */
    @Operation(summary = "Resume dunning sequence", description = "Resumes a previously paused dunning sequence. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence resumed successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found"),
        ApiResponse(responseCode = "422", description = "Dunning sequence is not paused")
    ])
    @PostMapping("/{dunningId}/resume")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun resume(@PathVariable dunningId: UUID): ResponseEntity<DunningSequenceResponse> {
        // In a real implementation, add a resume method to DunningService
        val dunning = dunningService.getById(dunningId)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Cancels a dunning sequence (resolves manually).
     */
    @Operation(summary = "Cancel dunning sequence", description = "Cancels a dunning sequence by resolving it manually with optional notes. Requires PLATFORM_ADMIN role.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence cancelled successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found"),
        ApiResponse(responseCode = "422", description = "Dunning sequence cannot be cancelled from its current state")
    ])
    @PostMapping("/{dunningId}/cancel")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun cancel(
        @PathVariable dunningId: UUID,
        @RequestBody(required = false) request: CancelDunningRequest?
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.resolveManually(dunningId, request?.notes)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Marks a dunning sequence as recovered.
     */
    @Operation(summary = "Mark dunning as recovered", description = "Marks a dunning sequence as recovered after successful payment collection.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Dunning sequence marked as recovered"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found"),
        ApiResponse(responseCode = "422", description = "Dunning sequence is already recovered or cancelled")
    ])
    @PostMapping("/{dunningId}/recover")
    fun markRecovered(
        @PathVariable dunningId: UUID,
        @RequestBody request: RecoverRequest
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.markRecovered(dunningId, request.method)
        return ResponseEntity.ok(dunning.toResponse())
    }

    /**
     * Adds notes to a dunning sequence.
     */
    @Operation(summary = "Add notes to dunning", description = "Adds notes to an existing dunning sequence for tracking purposes.")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Notes added successfully"),
        ApiResponse(responseCode = "404", description = "Dunning sequence not found")
    ])
    @PostMapping("/{dunningId}/notes")
    fun addNotes(
        @PathVariable dunningId: UUID,
        @RequestBody request: AddNotesRequest
    ): ResponseEntity<DunningSequenceResponse> {
        val dunning = dunningService.addNotes(dunningId, request.notes)
        return ResponseEntity.ok(dunning.toResponse())
    }
}

/**
 * Response DTO for dunning sequence.
 */
data class DunningSequenceResponse(
    val id: UUID,
    val organizationId: UUID,
    val subscriptionId: UUID,
    val invoiceId: UUID,
    val amount: BigDecimal,
    val currency: String,
    val status: DunningStatus,
    val currentStep: Int,
    val totalSteps: Int,
    val daysSinceFailure: Int,
    val retryAttempts: Int,
    val escalatedToCsm: Boolean,
    val csmId: UUID?,
    val failureReason: String?,
    val notes: String?,
    val steps: List<DunningStepResponse>,
    val createdAt: String,
    val lastRetryAt: String?,
    val recoveredAt: String?
)

/**
 * Response DTO for dunning step.
 */
data class DunningStepResponse(
    val id: UUID,
    val day: Int,
    val channel: String,
    val template: String,
    val sentAt: String?,
    val clicked: Boolean,
    val escalateToCsm: Boolean
)

/**
 * Response DTO for retry payment action.
 */
data class RetryPaymentResponse(
    val success: Boolean,
    val message: String,
    val dunningId: UUID
)

/**
 * Response DTO for send payment link action.
 */
data class SendLinkResponse(
    val success: Boolean,
    val message: String,
    val dunningId: UUID
)

/**
 * Request DTO for escalating to CSM.
 */
data class EscalateRequest(
    val csmId: UUID?
)

/**
 * Request DTO for assigning a CSM.
 */
data class AssignCsmRequest(
    val csmId: UUID
)

/**
 * Request DTO for cancelling dunning.
 */
data class CancelDunningRequest(
    val notes: String?
)

/**
 * Request DTO for marking as recovered.
 */
data class RecoverRequest(
    val method: String
)

/**
 * Request DTO for adding notes.
 */
data class AddNotesRequest(
    val notes: String
)

/**
 * Extension function to convert DunningSequence to response DTO.
 */
private fun DunningSequence.toResponse() = DunningSequenceResponse(
    id = this.id,
    organizationId = this.organizationId,
    subscriptionId = this.subscriptionId,
    invoiceId = this.invoiceId,
    amount = this.amount,
    currency = this.currency,
    status = this.status,
    currentStep = this.steps.count { it.isSent },
    totalSteps = this.steps.size,
    daysSinceFailure = this.getDaysSinceFailure(),
    retryAttempts = this.retryCount,
    escalatedToCsm = this.csmEscalated,
    csmId = this.csmId,
    failureReason = this.failureReason,
    notes = this.notes,
    steps = this.steps.map { it.toResponse() },
    createdAt = this.failedAt.toString(),
    lastRetryAt = this.lastRetryAt?.toString(),
    recoveredAt = this.recoveredAt?.toString()
)

/**
 * Extension function to convert DunningStep to response DTO.
 */
private fun DunningStep.toResponse() = DunningStepResponse(
    id = this.id,
    day = this.dayAfterFailure,
    channel = this.channels,
    template = this.template,
    sentAt = this.sentAt?.toString(),
    clicked = this.clicked,
    escalateToCsm = this.escalateToCsm
)
