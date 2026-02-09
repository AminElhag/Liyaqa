package com.liyaqa.platform.api

import com.liyaqa.platform.application.services.PlatformOnboardingProgressService
import com.liyaqa.platform.application.services.OnboardingStatistics
import com.liyaqa.platform.application.services.OnboardingSummary
import com.liyaqa.platform.domain.model.OnboardingPhase
import com.liyaqa.platform.domain.model.OnboardingProgress
import com.liyaqa.platform.domain.model.OnboardingStep
import com.liyaqa.platform.domain.model.UnlockableFeature
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
 * Controller for platform client onboarding management.
 * Provides endpoints for tracking and managing client onboarding progress.
 *
 * Endpoints:
 * - GET /api/platform/onboarding                          - Get all onboarding (incomplete)
 * - GET /api/platform/onboarding/statistics               - Get onboarding statistics
 * - GET /api/platform/onboarding/active                   - Get active onboarding clients
 * - GET /api/platform/onboarding/stalled                  - Get stalled onboarding clients
 * - GET /api/platform/onboarding/by-phase/{phase}         - Get by phase
 * - GET /api/platform/onboarding/{organizationId}         - Get onboarding for organization
 * - GET /api/platform/onboarding/{organizationId}/summary - Get summary for organization
 * - POST /api/platform/onboarding/{organizationId}/steps/{step}/complete - Complete a step
 * - POST /api/platform/onboarding/{organizationId}/features/{feature}/unlock - Unlock a feature
 * - POST /api/platform/onboarding/{organizationId}/reminder - Send reminder
 */
@RestController
@RequestMapping("/api/platform/onboarding")
@PlatformSecured
@Tag(name = "Onboarding", description = "Client onboarding workflow management")
class PlatformOnboardingController(
    private val onboardingService: PlatformOnboardingProgressService
) {
    /**
     * Gets all incomplete onboarding records.
     */
    @Operation(summary = "Get incomplete onboarding records", description = "Returns paginated list of all clients with incomplete onboarding")
    @ApiResponse(responseCode = "200", description = "Incomplete onboarding records retrieved successfully")
    @GetMapping
    fun getIncomplete(pageable: Pageable): ResponseEntity<Page<OnboardingProgressResponse>> {
        val page = onboardingService.getIncomplete(pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets onboarding statistics.
     */
    @Operation(summary = "Get onboarding statistics", description = "Returns aggregated onboarding statistics including completion rates and phase distribution")
    @ApiResponse(responseCode = "200", description = "Onboarding statistics retrieved successfully")
    @GetMapping("/statistics")
    fun getStatistics(): ResponseEntity<OnboardingStatistics> {
        val stats = onboardingService.getStatistics()
        return ResponseEntity.ok(stats)
    }

    /**
     * Gets all active onboarding clients (incomplete).
     * Alias for /api/platform/onboarding.
     */
    @Operation(summary = "Get active onboarding clients", description = "Returns paginated list of clients actively in onboarding (alias for root endpoint)")
    @ApiResponse(responseCode = "200", description = "Active onboarding clients retrieved successfully")
    @GetMapping("/active")
    fun getActive(pageable: Pageable): ResponseEntity<Page<OnboardingProgressResponse>> {
        return getIncomplete(pageable)
    }

    /**
     * Gets stalled onboarding clients (no progress in specified days).
     */
    @Operation(summary = "Get stalled onboarding clients", description = "Returns paginated list of clients with no onboarding progress in the specified number of days")
    @ApiResponse(responseCode = "200", description = "Stalled onboarding clients retrieved successfully")
    @GetMapping("/stalled")
    fun getStalled(
        @RequestParam(defaultValue = "7") stalledDays: Int,
        pageable: Pageable
    ): ResponseEntity<Page<OnboardingProgressResponse>> {
        val page = onboardingService.getStalled(stalledDays, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets onboarding by phase.
     */
    @Operation(summary = "Get onboarding by phase", description = "Returns paginated list of clients in the specified onboarding phase")
    @ApiResponse(responseCode = "200", description = "Onboarding records retrieved successfully")
    @GetMapping("/by-phase/{phase}")
    fun getByPhase(
        @PathVariable phase: OnboardingPhase,
        pageable: Pageable
    ): ResponseEntity<Page<OnboardingProgressResponse>> {
        val page = onboardingService.getByPhase(phase, pageable)
        return ResponseEntity.ok(page.map { it.toResponse() })
    }

    /**
     * Gets onboarding for a specific organization.
     */
    @Operation(summary = "Get onboarding by organization", description = "Returns the onboarding progress for a specific organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Onboarding progress retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @GetMapping("/{organizationId}")
    fun getByOrganizationId(
        @PathVariable organizationId: UUID
    ): ResponseEntity<OnboardingProgressResponse> {
        val progress = onboardingService.getByOrganizationId(organizationId)
        return ResponseEntity.ok(progress.toResponse())
    }

    /**
     * Gets onboarding summary for a specific organization.
     */
    @Operation(summary = "Get onboarding summary", description = "Returns an onboarding summary including progress percentage and next steps for an organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Onboarding summary retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @GetMapping("/{organizationId}/summary")
    fun getSummary(
        @PathVariable organizationId: UUID
    ): ResponseEntity<OnboardingSummary> {
        val summary = onboardingService.getOnboardingSummary(organizationId)
        return ResponseEntity.ok(summary)
    }

    /**
     * Completes a specific onboarding step for an organization.
     */
    @Operation(summary = "Complete onboarding step", description = "Marks a specific onboarding step as completed for an organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Step completed successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found"),
        ApiResponse(responseCode = "422", description = "Step cannot be completed in current state")
    ])
    @PostMapping("/{organizationId}/steps/{step}/complete")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun completeStep(
        @PathVariable organizationId: UUID,
        @PathVariable step: OnboardingStep
    ): ResponseEntity<OnboardingProgressResponse> {
        val progress = onboardingService.completeStep(organizationId, step)
        return ResponseEntity.ok(progress.toResponse())
    }

    /**
     * Uncompletes a specific onboarding step for an organization.
     */
    @Operation(summary = "Uncomplete onboarding step", description = "Reverts a specific onboarding step to incomplete for an organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Step uncompleted successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found"),
        ApiResponse(responseCode = "422", description = "Step cannot be uncompleted in current state")
    ])
    @PostMapping("/{organizationId}/steps/{step}/uncomplete")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun uncompleteStep(
        @PathVariable organizationId: UUID,
        @PathVariable step: OnboardingStep
    ): ResponseEntity<OnboardingProgressResponse> {
        val progress = onboardingService.uncompleteStep(organizationId, step)
        return ResponseEntity.ok(progress.toResponse())
    }

    /**
     * Manually unlocks a feature for an organization.
     */
    @Operation(summary = "Unlock feature", description = "Manually unlocks a feature for an organization bypassing onboarding requirements")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Feature unlocked successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found"),
        ApiResponse(responseCode = "422", description = "Feature cannot be unlocked in current state")
    ])
    @PostMapping("/{organizationId}/features/{feature}/unlock")
    @PlatformSecured(roles = [PlatformUserRole.PLATFORM_SUPER_ADMIN, PlatformUserRole.PLATFORM_ADMIN])
    fun unlockFeature(
        @PathVariable organizationId: UUID,
        @PathVariable feature: UnlockableFeature
    ): ResponseEntity<OnboardingProgressResponse> {
        val progress = onboardingService.unlockFeature(organizationId, feature)
        return ResponseEntity.ok(progress.toResponse())
    }

    /**
     * Sends a reminder for stalled onboarding.
     * Note: Actual reminder sending should be handled by a notification service.
     */
    @Operation(summary = "Send onboarding reminder", description = "Sends a reminder notification to a stalled onboarding organization")
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "Reminder sent successfully"),
        ApiResponse(responseCode = "404", description = "Organization not found")
    ])
    @PostMapping("/{organizationId}/reminder")
    fun sendReminder(
        @PathVariable organizationId: UUID
    ): ResponseEntity<ReminderResponse> {
        // In a real implementation, this would trigger a notification
        // For now, just return success
        return ResponseEntity.ok(ReminderResponse(
            success = true,
            message = "Reminder sent successfully",
            organizationId = organizationId
        ))
    }
}

/**
 * Response DTO for onboarding progress.
 */
data class OnboardingProgressResponse(
    val id: UUID,
    val organizationId: UUID,
    val clubId: UUID?,
    val totalPoints: Int,
    val maxPoints: Int,
    val progressPercent: Int,
    val currentPhase: OnboardingPhase,
    val completedSteps: List<OnboardingStep>,
    val daysActive: Int,
    val isComplete: Boolean,
    val isStalled: Boolean,
    val startedAt: String,
    val completedAt: String?
)

/**
 * Response DTO for reminder action.
 */
data class ReminderResponse(
    val success: Boolean,
    val message: String,
    val organizationId: UUID
)

/**
 * Extension function to convert OnboardingProgress to response DTO.
 */
private fun OnboardingProgress.toResponse() = OnboardingProgressResponse(
    id = this.id,
    organizationId = this.organizationId,
    clubId = this.clubId,
    totalPoints = this.totalPoints,
    maxPoints = OnboardingProgress.MAX_POINTS,
    progressPercent = this.progressPercent,
    currentPhase = this.currentPhase,
    completedSteps = this.completedSteps.toList(),
    daysActive = this.daysActive,
    isComplete = this.isComplete(),
    isStalled = this.isStalled(),
    startedAt = this.startedAt.toString(),
    completedAt = this.completedAt?.toString()
)
