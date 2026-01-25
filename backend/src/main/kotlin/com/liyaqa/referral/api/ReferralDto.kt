package com.liyaqa.referral.api

import com.liyaqa.referral.application.commands.UpdateReferralConfigCommand
import com.liyaqa.referral.application.services.ReferralStats
import com.liyaqa.referral.domain.model.Referral
import com.liyaqa.referral.domain.model.ReferralCode
import com.liyaqa.referral.domain.model.ReferralConfig
import com.liyaqa.referral.domain.model.ReferralReward
import com.liyaqa.referral.domain.model.ReferralStatus
import com.liyaqa.referral.domain.model.RewardStatus
import com.liyaqa.referral.domain.model.RewardType
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ============ Request DTOs ============

data class UpdateReferralConfigRequest(
    @field:NotNull(message = "isEnabled is required")
    val isEnabled: Boolean,

    @field:Size(min = 1, max = 10, message = "Code prefix must be 1-10 characters")
    val codePrefix: String = "REF",

    @field:NotNull(message = "Reward type is required")
    val referrerRewardType: RewardType,

    @field:DecimalMin(value = "0.0", inclusive = false, message = "Reward amount must be positive")
    val referrerRewardAmount: BigDecimal? = null,

    @field:Size(min = 3, max = 3, message = "Currency must be 3 characters")
    val referrerRewardCurrency: String = "SAR",

    @field:Min(value = 1, message = "Free days must be at least 1")
    val referrerFreeDays: Int? = null,

    @field:Min(value = 1, message = "Minimum subscription days must be at least 1")
    val minSubscriptionDays: Int = 30,

    @field:Min(value = 1, message = "Max referrals must be at least 1")
    val maxReferralsPerMember: Int? = null
) {
    fun toCommand() = UpdateReferralConfigCommand(
        isEnabled = isEnabled,
        codePrefix = codePrefix,
        referrerRewardType = referrerRewardType,
        referrerRewardAmount = referrerRewardAmount,
        referrerRewardCurrency = referrerRewardCurrency,
        referrerFreeDays = referrerFreeDays,
        minSubscriptionDays = minSubscriptionDays,
        maxReferralsPerMember = maxReferralsPerMember
    )
}

data class ValidateCodeRequest(
    val code: String
)

// ============ Response DTOs ============

data class ReferralConfigResponse(
    val id: UUID,
    val isEnabled: Boolean,
    val codePrefix: String,
    val referrerRewardType: RewardType,
    val referrerRewardAmount: BigDecimal?,
    val referrerRewardCurrency: String,
    val referrerFreeDays: Int?,
    val minSubscriptionDays: Int,
    val maxReferralsPerMember: Int?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(config: ReferralConfig) = ReferralConfigResponse(
            id = config.id,
            isEnabled = config.isEnabled,
            codePrefix = config.codePrefix,
            referrerRewardType = config.referrerRewardType,
            referrerRewardAmount = config.referrerRewardAmount,
            referrerRewardCurrency = config.referrerRewardCurrency,
            referrerFreeDays = config.referrerFreeDays,
            minSubscriptionDays = config.minSubscriptionDays,
            maxReferralsPerMember = config.maxReferralsPerMember,
            createdAt = config.createdAt,
            updatedAt = config.updatedAt
        )
    }
}

data class ReferralCodeResponse(
    val id: UUID,
    val memberId: UUID,
    val code: String,
    val isActive: Boolean,
    val clickCount: Int,
    val conversionCount: Int,
    val createdAt: Instant
) {
    companion object {
        fun from(code: ReferralCode) = ReferralCodeResponse(
            id = code.id,
            memberId = code.memberId,
            code = code.code,
            isActive = code.isActive,
            clickCount = code.clickCount,
            conversionCount = code.conversionCount,
            createdAt = code.createdAt
        )
    }
}

data class ReferralResponse(
    val id: UUID,
    val referralCodeId: UUID,
    val referrerMemberId: UUID,
    val refereeMemberId: UUID?,
    val status: ReferralStatus,
    val clickedAt: Instant?,
    val convertedAt: Instant?,
    val subscriptionId: UUID?,
    val createdAt: Instant
) {
    companion object {
        fun from(referral: Referral) = ReferralResponse(
            id = referral.id,
            referralCodeId = referral.referralCodeId,
            referrerMemberId = referral.referrerMemberId,
            refereeMemberId = referral.refereeMemberId,
            status = referral.status,
            clickedAt = referral.clickedAt,
            convertedAt = referral.convertedAt,
            subscriptionId = referral.subscriptionId,
            createdAt = referral.createdAt
        )
    }
}

data class ReferralRewardResponse(
    val id: UUID,
    val referralId: UUID,
    val memberId: UUID,
    val rewardType: RewardType,
    val amount: BigDecimal?,
    val currency: String,
    val status: RewardStatus,
    val distributedAt: Instant?,
    val walletTransactionId: UUID?,
    val createdAt: Instant
) {
    companion object {
        fun from(reward: ReferralReward) = ReferralRewardResponse(
            id = reward.id,
            referralId = reward.referralId,
            memberId = reward.memberId,
            rewardType = reward.rewardType,
            amount = reward.amount,
            currency = reward.currency,
            status = reward.status,
            distributedAt = reward.distributedAt,
            walletTransactionId = reward.walletTransactionId,
            createdAt = reward.createdAt
        )
    }
}

data class ReferralStatsResponse(
    val code: String?,
    val clickCount: Int,
    val totalReferrals: Long,
    val conversions: Long,
    val conversionRate: Double
) {
    companion object {
        fun from(stats: ReferralStats) = ReferralStatsResponse(
            code = stats.code,
            clickCount = stats.clickCount,
            totalReferrals = stats.totalReferrals,
            conversions = stats.conversions,
            conversionRate = stats.conversionRate
        )
    }
}

data class ReferralAnalyticsResponse(
    val totalClicks: Long,
    val totalSignups: Long,
    val totalConversions: Long,
    val overallConversionRate: Double,
    val totalRewardsDistributed: BigDecimal,
    val pendingRewards: Int,
    val topReferrers: List<ReferralCodeResponse>
)

data class ReferralCodeValidationResponse(
    val valid: Boolean,
    val code: String?,
    val referrerName: String?
)

data class ReferralTrackResponse(
    val referralId: UUID?,
    val success: Boolean,
    val message: String?
)
