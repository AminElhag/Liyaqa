package com.liyaqa.membership.api

import com.liyaqa.auth.domain.ports.UserRepository
import com.liyaqa.membership.application.services.OnboardingService
import com.liyaqa.membership.domain.model.OnboardingStep
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.api.PageResponse
import jakarta.validation.Valid
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
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
@RequestMapping("/api")
class OnboardingController(
    private val onboardingService: OnboardingService,
    private val memberRepository: MemberRepository,
    private val userRepository: UserRepository
) {

    private fun getCurrentUserId(user: UserDetails?): UUID? {
        return user?.let {
            try {
                UUID.fromString(it.username)
            } catch (e: Exception) {
                null
            }
        }
    }

    private fun enrichOnboardingResponse(onboarding: com.liyaqa.membership.domain.model.MemberOnboarding): OnboardingResponse {
        val member = memberRepository.findById(onboarding.memberId).orElse(null)
        val assignee = onboarding.assignedToUserId?.let { userRepository.findById(it).orElse(null) }
        return OnboardingResponse.from(
            onboarding = onboarding,
            memberName = member?.fullName?.en,
            assignedToName = assignee?.displayName?.en
        )
    }

    /**
     * Create an onboarding for a member.
     */
    @PostMapping("/onboardings")
    @PreAuthorize("hasAnyAuthority('onboarding_create', 'members_manage')")
    fun createOnboarding(
        @Valid @RequestBody request: CreateOnboardingRequest
    ): ResponseEntity<OnboardingResponse> {
        val onboarding = onboardingService.createOnboarding(request.memberId, request.assignedToUserId)
        return ResponseEntity.status(HttpStatus.CREATED).body(enrichOnboardingResponse(onboarding))
    }

    /**
     * Get onboarding for a member.
     */
    @GetMapping("/members/{memberId}/onboarding")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'members_view')")
    fun getMemberOnboarding(
        @PathVariable memberId: UUID
    ): ResponseEntity<OnboardingResponse> {
        val onboarding = onboardingService.getOnboarding(memberId)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(enrichOnboardingResponse(onboarding))
    }

    /**
     * Get onboarding checklist for a member.
     */
    @GetMapping("/members/{memberId}/onboarding/checklist")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'members_view')")
    fun getMemberOnboardingChecklist(
        @PathVariable memberId: UUID
    ): ResponseEntity<OnboardingChecklistResponse> {
        val onboarding = onboardingService.getOnboarding(memberId)
            ?: return ResponseEntity.notFound().build()
        val member = memberRepository.findById(memberId).orElse(null)
        return ResponseEntity.ok(OnboardingChecklistResponse.from(onboarding, member?.fullName?.en))
    }

    /**
     * Check if a member is in onboarding.
     */
    @GetMapping("/members/{memberId}/onboarding/status")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'members_view')")
    fun isInOnboarding(
        @PathVariable memberId: UUID
    ): ResponseEntity<Map<String, Any>> {
        val isInOnboarding = onboardingService.isInOnboarding(memberId)
        val onboarding = onboardingService.getOnboarding(memberId)
        return ResponseEntity.ok(mapOf(
            "isInOnboarding" to isInOnboarding,
            "hasOnboarding" to (onboarding != null),
            "isComplete" to (onboarding?.isComplete() ?: false),
            "completionPercentage" to (onboarding?.getCompletionPercentage() ?: 0)
        ))
    }

    /**
     * Complete an onboarding step.
     */
    @PostMapping("/members/{memberId}/onboarding/steps/complete")
    @PreAuthorize("hasAnyAuthority('onboarding_manage', 'members_manage')")
    fun completeStep(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: CompleteStepRequest,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<OnboardingResponse> {
        val userId = getCurrentUserId(user)
        val onboarding = onboardingService.completeStep(memberId, request.step, userId, request.notes)
        return ResponseEntity.ok(enrichOnboardingResponse(onboarding))
    }

    /**
     * Skip an onboarding step.
     */
    @PostMapping("/members/{memberId}/onboarding/steps/skip")
    @PreAuthorize("hasAnyAuthority('onboarding_manage', 'members_manage')")
    fun skipStep(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: SkipStepRequest
    ): ResponseEntity<OnboardingResponse> {
        val onboarding = onboardingService.skipStep(memberId, request.step, request.reason)
        return ResponseEntity.ok(enrichOnboardingResponse(onboarding))
    }

    /**
     * Assign onboarding to a staff member.
     */
    @PostMapping("/members/{memberId}/onboarding/assign")
    @PreAuthorize("hasAnyAuthority('onboarding_manage', 'members_manage')")
    fun assignOnboarding(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: AssignOnboardingRequest
    ): ResponseEntity<OnboardingResponse> {
        val onboarding = onboardingService.assignOnboarding(memberId, request.assigneeUserId)
        return ResponseEntity.ok(enrichOnboardingResponse(onboarding))
    }

    /**
     * Update onboarding notes.
     */
    @PutMapping("/members/{memberId}/onboarding/notes")
    @PreAuthorize("hasAnyAuthority('onboarding_manage', 'members_manage')")
    fun updateNotes(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: UpdateOnboardingNotesRequest
    ): ResponseEntity<OnboardingResponse> {
        val onboarding = onboardingService.updateNotes(memberId, request.notes)
        return ResponseEntity.ok(enrichOnboardingResponse(onboarding))
    }

    /**
     * Get incomplete onboardings.
     */
    @GetMapping("/onboardings/incomplete")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'dashboard_view')")
    fun getIncompleteOnboardings(
        @PageableDefault(size = 20, sort = ["startedAt"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<OnboardingResponse>> {
        val page = onboardingService.getIncompleteOnboardings(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichOnboardingResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get my incomplete onboardings (assigned to me).
     */
    @GetMapping("/onboardings/my-incomplete")
    @PreAuthorize("isAuthenticated()")
    fun getMyIncompleteOnboardings(
        @PageableDefault(size = 20, sort = ["startedAt"], direction = Sort.Direction.DESC) pageable: Pageable,
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<PageResponse<OnboardingResponse>> {
        val userId = getCurrentUserId(user) ?: throw IllegalStateException("User not authenticated")
        val page = onboardingService.getMyIncompleteOnboardings(userId, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichOnboardingResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get overdue onboardings.
     */
    @GetMapping("/onboardings/overdue")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'dashboard_view')")
    fun getOverdueOnboardings(
        @PageableDefault(size = 20, sort = ["startedAt"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<PageResponse<OnboardingResponse>> {
        val page = onboardingService.getOverdueOnboardings(pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichOnboardingResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get recently started onboardings.
     */
    @GetMapping("/onboardings/recent")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'dashboard_view')")
    fun getRecentOnboardings(
        @RequestParam(defaultValue = "7") days: Long,
        @PageableDefault(size = 20, sort = ["startedAt"], direction = Sort.Direction.DESC) pageable: Pageable
    ): ResponseEntity<PageResponse<OnboardingResponse>> {
        val page = onboardingService.getRecentOnboardings(days, pageable)

        return ResponseEntity.ok(
            PageResponse(
                content = page.content.map { enrichOnboardingResponse(it) },
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get onboarding statistics.
     */
    @GetMapping("/onboardings/stats")
    @PreAuthorize("hasAnyAuthority('onboarding_view', 'dashboard_view')")
    fun getOnboardingStats(
        @AuthenticationPrincipal user: UserDetails?
    ): ResponseEntity<OnboardingStatsResponse> {
        val userId = getCurrentUserId(user)
        val stats = onboardingService.getOnboardingStats(userId)
        return ResponseEntity.ok(OnboardingStatsResponse.from(stats))
    }

    /**
     * Get available onboarding steps.
     */
    @GetMapping("/onboardings/steps")
    @PreAuthorize("isAuthenticated()")
    fun getOnboardingSteps(): ResponseEntity<List<OnboardingStep>> {
        return ResponseEntity.ok(OnboardingStep.entries)
    }
}
