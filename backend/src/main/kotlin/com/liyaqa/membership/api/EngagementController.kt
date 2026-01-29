package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.EngagementService
import com.liyaqa.membership.domain.model.RiskLevel
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.shared.api.PageResponse
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import org.springframework.data.web.PageableDefault
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api")
class EngagementController(
    private val engagementService: EngagementService,
    private val memberRepository: MemberRepository
) {

    /**
     * Get engagement score for a member.
     */
    @GetMapping("/members/{memberId}/engagement")
    @PreAuthorize("hasAnyAuthority('members_view', 'engagement_view')")
    fun getEngagementScore(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "false") recalculate: Boolean
    ): ResponseEntity<EngagementScoreResponse> {
        val score = if (recalculate) {
            engagementService.calculateEngagementScore(memberId)
        } else {
            engagementService.getOrCalculateEngagementScore(memberId)
        }

        return ResponseEntity.ok(EngagementScoreResponse.from(score))
    }

    /**
     * Get engagement badge (simplified view) for a member.
     */
    @GetMapping("/members/{memberId}/engagement/badge")
    @PreAuthorize("hasAnyAuthority('members_view', 'engagement_view')")
    fun getEngagementBadge(
        @PathVariable memberId: UUID
    ): ResponseEntity<EngagementBadgeResponse> {
        val score = engagementService.getOrCalculateEngagementScore(memberId)
        return ResponseEntity.ok(EngagementBadgeResponse.from(score))
    }

    /**
     * Recalculate engagement score for a member.
     */
    @PostMapping("/members/{memberId}/engagement/recalculate")
    @PreAuthorize("hasAnyAuthority('members_manage', 'engagement_manage')")
    fun recalculateEngagementScore(
        @PathVariable memberId: UUID
    ): ResponseEntity<EngagementScoreResponse> {
        val score = engagementService.calculateEngagementScore(memberId)
        return ResponseEntity.ok(EngagementScoreResponse.from(score))
    }

    /**
     * Get at-risk members.
     */
    @GetMapping("/members/at-risk")
    @PreAuthorize("hasAnyAuthority('members_view', 'engagement_view', 'dashboard_view')")
    fun getAtRiskMembers(
        @RequestParam riskLevels: List<RiskLevel>?,
        @PageableDefault(size = 20, sort = ["overallScore"], direction = Sort.Direction.ASC) pageable: Pageable
    ): ResponseEntity<PageResponse<AtRiskMemberResponse>> {
        val page = engagementService.getAtRiskMembers(riskLevels, pageable)

        val content = page.content.map { score ->
            val member = memberRepository.findById(score.memberId).orElse(null)
            AtRiskMemberResponse(
                memberId = score.memberId,
                memberName = member?.fullName?.en,
                memberEmail = member?.email,
                overallScore = score.overallScore,
                riskLevel = score.riskLevel,
                riskFactors = score.riskFactors?.map { RiskFactorResponse.from(it) },
                recommendedActions = score.recommendedActions?.map { RecommendedActionResponse.from(it) },
                calculatedAt = score.calculatedAt
            )
        }

        return ResponseEntity.ok(
            PageResponse(
                content = content,
                totalElements = page.totalElements,
                totalPages = page.totalPages,
                page = page.number,
                size = page.size
            )
        )
    }

    /**
     * Get engagement overview statistics.
     */
    @GetMapping("/engagement/overview")
    @PreAuthorize("hasAnyAuthority('dashboard_view', 'analytics_view', 'engagement_view')")
    fun getEngagementOverview(): ResponseEntity<EngagementOverviewResponse> {
        val overview = engagementService.getEngagementOverview()
        return ResponseEntity.ok(EngagementOverviewResponse.from(overview))
    }

    /**
     * Get available risk levels.
     */
    @GetMapping("/engagement/risk-levels")
    @PreAuthorize("isAuthenticated()")
    fun getRiskLevels(): ResponseEntity<List<RiskLevel>> {
        return ResponseEntity.ok(RiskLevel.entries)
    }
}
