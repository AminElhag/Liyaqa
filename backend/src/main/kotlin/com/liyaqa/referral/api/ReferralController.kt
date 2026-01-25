package com.liyaqa.referral.api

import com.liyaqa.referral.application.services.ReferralCodeService
import com.liyaqa.referral.application.services.ReferralConfigService
import com.liyaqa.referral.application.services.ReferralRewardService
import com.liyaqa.referral.application.services.ReferralTrackingService
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardStatus
import com.liyaqa.referral.domain.ports.ReferralRepository
import com.liyaqa.referral.domain.ports.ReferralRewardRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal
import java.util.UUID

@RestController
@RequestMapping("/api/referral")
@Tag(name = "Referral", description = "Referral program management")
class ReferralController(
    private val configService: ReferralConfigService,
    private val codeService: ReferralCodeService,
    private val trackingService: ReferralTrackingService,
    private val rewardService: ReferralRewardService,
    private val referralRepository: ReferralRepository,
    private val rewardRepository: ReferralRewardRepository
) {

    // ============ Config Endpoints ============

    @GetMapping("/config")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get referral program configuration")
    fun getConfig(): ResponseEntity<ReferralConfigResponse> {
        val config = configService.getConfig()
        return ResponseEntity.ok(ReferralConfigResponse.from(config))
    }

    @PutMapping("/config")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Update referral program configuration")
    fun updateConfig(
        @Valid @RequestBody request: UpdateReferralConfigRequest
    ): ResponseEntity<ReferralConfigResponse> {
        val config = configService.updateConfig(request.toCommand())
        return ResponseEntity.ok(ReferralConfigResponse.from(config))
    }

    @PostMapping("/config/enable")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Enable referral program")
    fun enableProgram(): ResponseEntity<ReferralConfigResponse> {
        val config = configService.enable()
        return ResponseEntity.ok(ReferralConfigResponse.from(config))
    }

    @PostMapping("/config/disable")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Disable referral program")
    fun disableProgram(): ResponseEntity<ReferralConfigResponse> {
        val config = configService.disable()
        return ResponseEntity.ok(ReferralConfigResponse.from(config))
    }

    // ============ Code Management ============

    @GetMapping("/codes")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "List all referral codes")
    fun listCodes(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt") sortBy: String,
        @RequestParam(defaultValue = "desc") sortDir: String
    ): ResponseEntity<Page<ReferralCodeResponse>> {
        val sort = if (sortDir.equals("asc", ignoreCase = true)) {
            Sort.by(sortBy).ascending()
        } else {
            Sort.by(sortBy).descending()
        }
        val pageable = PageRequest.of(page, size, sort)
        val codes = codeService.listCodes(pageable)
        return ResponseEntity.ok(codes.map { ReferralCodeResponse.from(it) })
    }

    @GetMapping("/codes/{id}")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get referral code by ID")
    fun getCode(@PathVariable id: UUID): ResponseEntity<ReferralCodeResponse> {
        val code = codeService.getByMemberId(id)
            ?: throw NoSuchElementException("Referral code not found for member: $id")
        return ResponseEntity.ok(ReferralCodeResponse.from(code))
    }

    @PostMapping("/codes/{id}/activate")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Activate a referral code")
    fun activateCode(@PathVariable id: UUID): ResponseEntity<ReferralCodeResponse> {
        val code = codeService.activateCode(id)
        return ResponseEntity.ok(ReferralCodeResponse.from(code))
    }

    @PostMapping("/codes/{id}/deactivate")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Deactivate a referral code")
    fun deactivateCode(@PathVariable id: UUID): ResponseEntity<ReferralCodeResponse> {
        val code = codeService.deactivateCode(id)
        return ResponseEntity.ok(ReferralCodeResponse.from(code))
    }

    // ============ Referrals ============

    @GetMapping("/referrals")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "List all referrals")
    fun listReferrals(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) status: ReferralStatus?
    ): ResponseEntity<Page<ReferralResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val referrals = if (status != null) {
            trackingService.getReferralsByStatus(status, pageable)
        } else {
            referralRepository.findAll(pageable)
        }
        return ResponseEntity.ok(referrals.map { ReferralResponse.from(it) })
    }

    @GetMapping("/referrals/{id}")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get referral by ID")
    fun getReferral(@PathVariable id: UUID): ResponseEntity<ReferralResponse> {
        val referral = referralRepository.findById(id)
            .orElseThrow { NoSuchElementException("Referral not found: $id") }
        return ResponseEntity.ok(ReferralResponse.from(referral))
    }

    @GetMapping("/referrals/{id}/rewards")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get rewards for a referral")
    fun getReferralRewards(@PathVariable id: UUID): ResponseEntity<List<ReferralRewardResponse>> {
        val rewards = rewardService.getReferralRewards(id)
        return ResponseEntity.ok(rewards.map { ReferralRewardResponse.from(it) })
    }

    // ============ Rewards ============

    @GetMapping("/rewards")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "List all rewards")
    fun listRewards(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) status: RewardStatus?
    ): ResponseEntity<Page<ReferralRewardResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val rewards = if (status != null) {
            rewardRepository.findByStatus(status, pageable)
        } else {
            rewardRepository.findAll(pageable)
        }
        return ResponseEntity.ok(rewards.map { ReferralRewardResponse.from(it) })
    }

    @PostMapping("/rewards/{id}/distribute")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Manually distribute a pending reward")
    fun distributeReward(@PathVariable id: UUID): ResponseEntity<ReferralRewardResponse> {
        val reward = rewardService.distributeReward(id)
        return ResponseEntity.ok(ReferralRewardResponse.from(reward))
    }

    @PostMapping("/rewards/{id}/cancel")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Cancel a pending reward")
    fun cancelReward(@PathVariable id: UUID): ResponseEntity<ReferralRewardResponse> {
        val reward = rewardService.cancelReward(id)
        return ResponseEntity.ok(ReferralRewardResponse.from(reward))
    }

    @PostMapping("/rewards/process-pending")
    @PreAuthorize("hasAuthority('referrals_manage')")
    @Operation(summary = "Process all pending rewards")
    fun processPendingRewards(
        @RequestParam(defaultValue = "100") batchSize: Int
    ): ResponseEntity<Map<String, Int>> {
        val count = rewardService.processPendingRewards(batchSize)
        return ResponseEntity.ok(mapOf("processed" to count))
    }

    // ============ Analytics ============

    @GetMapping("/analytics")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get referral program analytics")
    fun getAnalytics(): ResponseEntity<ReferralAnalyticsResponse> {
        val totalClicks = referralRepository.countByStatus(ReferralStatus.CLICKED)
        val totalSignups = referralRepository.countByStatus(ReferralStatus.SIGNED_UP)
        val totalConversions = referralRepository.countByStatus(ReferralStatus.CONVERTED)
        val allReferrals = totalClicks + totalSignups + totalConversions
        val conversionRate = if (allReferrals > 0) {
            totalConversions.toDouble() / allReferrals.toDouble()
        } else 0.0

        val totalDistributed = rewardRepository.sumDistributedAmount() ?: BigDecimal.ZERO
        val pendingRewards = rewardRepository.countByStatus(RewardStatus.PENDING).toInt()
        val topReferrers = codeService.getTopReferrers(10)

        return ResponseEntity.ok(ReferralAnalyticsResponse(
            totalClicks = totalClicks,
            totalSignups = totalSignups,
            totalConversions = totalConversions,
            overallConversionRate = conversionRate,
            totalRewardsDistributed = totalDistributed,
            pendingRewards = pendingRewards,
            topReferrers = topReferrers.map { ReferralCodeResponse.from(it) }
        ))
    }

    @GetMapping("/leaderboard")
    @PreAuthorize("hasAuthority('referrals_view')")
    @Operation(summary = "Get top referrers leaderboard")
    fun getLeaderboard(
        @RequestParam(defaultValue = "10") limit: Int
    ): ResponseEntity<List<ReferralCodeResponse>> {
        val topReferrers = codeService.getTopReferrers(limit)
        return ResponseEntity.ok(topReferrers.map { ReferralCodeResponse.from(it) })
    }

    // ============ Member Endpoints ============

    @GetMapping("/my-code")
    @PreAuthorize("hasAuthority('member')")
    @Operation(summary = "Get or create my referral code")
    fun getMyCode(
        @RequestParam memberId: UUID
    ): ResponseEntity<ReferralCodeResponse> {
        val code = codeService.getOrCreateCode(memberId)
        return ResponseEntity.ok(ReferralCodeResponse.from(code))
    }

    @GetMapping("/my-referrals")
    @PreAuthorize("hasAuthority('member')")
    @Operation(summary = "Get my referral history")
    fun getMyReferrals(
        @RequestParam memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<ReferralResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val referrals = trackingService.getReferralsByReferrer(memberId, pageable)
        return ResponseEntity.ok(referrals.map { ReferralResponse.from(it) })
    }

    @GetMapping("/my-stats")
    @PreAuthorize("hasAuthority('member')")
    @Operation(summary = "Get my referral statistics")
    fun getMyStats(
        @RequestParam memberId: UUID
    ): ResponseEntity<ReferralStatsResponse> {
        val stats = trackingService.getMemberStats(memberId)
        return ResponseEntity.ok(ReferralStatsResponse.from(stats))
    }

    @GetMapping("/my-rewards")
    @PreAuthorize("hasAuthority('member')")
    @Operation(summary = "Get my referral rewards")
    fun getMyRewards(
        @RequestParam memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<Page<ReferralRewardResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by("createdAt").descending())
        val rewards = rewardService.getMemberRewards(memberId, pageable)
        return ResponseEntity.ok(rewards.map { ReferralRewardResponse.from(it) })
    }
}
