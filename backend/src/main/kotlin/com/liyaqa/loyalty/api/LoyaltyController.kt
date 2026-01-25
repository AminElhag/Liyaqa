package com.liyaqa.loyalty.api

import com.liyaqa.loyalty.application.commands.*
import com.liyaqa.loyalty.application.services.LoyaltyService
import com.liyaqa.loyalty.domain.model.LoyaltyTier
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api")
@Tag(name = "Loyalty", description = "Loyalty points management")
class LoyaltyController(
    private val loyaltyService: LoyaltyService
) {
    // ========== Configuration Endpoints ==========

    @GetMapping("/loyalty/config")
    @PreAuthorize("hasAuthority('loyalty_config_view')")
    @Operation(summary = "Get loyalty configuration")
    fun getConfig(): ResponseEntity<LoyaltyConfigResponse> {
        val config = loyaltyService.getOrCreateConfig()
        return ResponseEntity.ok(LoyaltyConfigResponse.from(config))
    }

    @PutMapping("/loyalty/config")
    @PreAuthorize("hasAuthority('loyalty_config_update')")
    @Operation(summary = "Update loyalty configuration")
    fun updateConfig(
        @Valid @RequestBody request: UpdateLoyaltyConfigRequest
    ): ResponseEntity<LoyaltyConfigResponse> {
        val command = UpdateLoyaltyConfigCommand(
            enabled = request.enabled,
            pointsPerCheckin = request.pointsPerCheckin,
            pointsPerReferral = request.pointsPerReferral,
            pointsPerSarSpent = request.pointsPerSarSpent,
            redemptionRateSar = request.redemptionRateSar,
            bronzeThreshold = request.bronzeThreshold,
            silverThreshold = request.silverThreshold,
            goldThreshold = request.goldThreshold,
            platinumThreshold = request.platinumThreshold,
            pointsExpiryMonths = request.pointsExpiryMonths
        )
        val config = loyaltyService.updateConfig(command)
        return ResponseEntity.ok(LoyaltyConfigResponse.from(config))
    }

    // ========== Member Points Endpoints ==========

    @GetMapping("/members/{memberId}/points")
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Get member points balance")
    fun getMemberPoints(@PathVariable memberId: UUID): ResponseEntity<MemberPointsResponse> {
        val memberPoints = loyaltyService.getMemberPoints(memberId)
            ?: return ResponseEntity.notFound().build()

        val config = loyaltyService.getOrCreateConfig()
        return ResponseEntity.ok(MemberPointsResponse.from(memberPoints, config))
    }

    @GetMapping("/members/{memberId}/points/transactions")
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Get member points transaction history")
    fun getMemberPointsTransactions(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<PointsTransactionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val transactionsPage = loyaltyService.getMemberPointsTransactions(memberId, pageable)

        val response = PageResponse(
            content = transactionsPage.content.map { PointsTransactionResponse.from(it) },
            page = transactionsPage.number,
            size = transactionsPage.size,
            totalElements = transactionsPage.totalElements,
            totalPages = transactionsPage.totalPages,
            first = transactionsPage.isFirst,
            last = transactionsPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @PostMapping("/members/{memberId}/points/earn")
    @PreAuthorize("hasAuthority('loyalty_points_manage')")
    @Operation(summary = "Earn points for a member (admin)")
    fun earnPoints(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: EarnPointsRequest
    ): ResponseEntity<MemberPointsResponse> {
        val command = EarnPointsCommand(
            memberId = memberId,
            points = request.points,
            source = request.source,
            referenceType = request.referenceType,
            referenceId = request.referenceId,
            description = request.descriptionEn,
            descriptionAr = request.descriptionAr
        )
        val memberPoints = loyaltyService.earnPoints(command)
        val config = loyaltyService.getOrCreateConfig()
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(MemberPointsResponse.from(memberPoints, config))
    }

    @PostMapping("/members/{memberId}/points/redeem")
    @PreAuthorize("hasAuthority('loyalty_points_manage')")
    @Operation(summary = "Redeem points for a member")
    fun redeemPoints(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: RedeemPointsRequest
    ): ResponseEntity<MemberPointsResponse> {
        val command = RedeemPointsCommand(
            memberId = memberId,
            points = request.points,
            source = request.source,
            referenceType = request.referenceType,
            referenceId = request.referenceId,
            description = request.descriptionEn,
            descriptionAr = request.descriptionAr
        )
        val memberPoints = loyaltyService.redeemPoints(command)
        val config = loyaltyService.getOrCreateConfig()
        return ResponseEntity.ok(MemberPointsResponse.from(memberPoints, config))
    }

    @PostMapping("/members/{memberId}/points/adjust")
    @PreAuthorize("hasAuthority('loyalty_points_manage')")
    @Operation(summary = "Adjust points for a member (positive or negative)")
    fun adjustPoints(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: AdjustPointsRequest
    ): ResponseEntity<MemberPointsResponse> {
        val command = AdjustPointsCommand(
            memberId = memberId,
            points = request.points,
            description = request.descriptionEn,
            descriptionAr = request.descriptionAr
        )
        val memberPoints = loyaltyService.adjustPoints(command)
        val config = loyaltyService.getOrCreateConfig()
        return ResponseEntity.ok(MemberPointsResponse.from(memberPoints, config))
    }

    // ========== Leaderboard Endpoints ==========

    @GetMapping("/loyalty/leaderboard")
    @PreAuthorize("hasAuthority('loyalty_leaderboard_view')")
    @Operation(summary = "Get points leaderboard")
    fun getLeaderboard(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<LeaderboardEntryResponse>> {
        val leaderboard = loyaltyService.getLeaderboard(limit)
        val entries = leaderboard.content.mapIndexed { index, mp ->
            LeaderboardEntryResponse.from(mp, index + 1)
        }
        return ResponseEntity.ok(entries)
    }

    @GetMapping("/loyalty/members")
    @PreAuthorize("hasAuthority('members_view')")
    @Operation(summary = "Get members by loyalty tier")
    fun getMembersByTier(
        @RequestParam tier: LoyaltyTier,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<MemberPointsResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "pointsBalance"))
        val membersPage = loyaltyService.getMembersByTier(tier, pageable)
        val config = loyaltyService.getOrCreateConfig()

        val response = PageResponse(
            content = membersPage.content.map { MemberPointsResponse.from(it, config) },
            page = membersPage.number,
            size = membersPage.size,
            totalElements = membersPage.totalElements,
            totalPages = membersPage.totalPages,
            first = membersPage.isFirst,
            last = membersPage.isLast
        )
        return ResponseEntity.ok(response)
    }
}
