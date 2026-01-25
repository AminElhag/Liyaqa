package com.liyaqa.loyalty.api

import com.liyaqa.loyalty.domain.model.*
import com.liyaqa.shared.domain.LocalizedText
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.util.*

// ========== Request DTOs ==========

data class EarnPointsRequest(
    @field:NotNull(message = "Points is required")
    @field:Positive(message = "Points must be positive")
    val points: Long,

    @field:NotNull(message = "Source is required")
    val source: PointsSource,

    val referenceType: String? = null,
    val referenceId: UUID? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

data class RedeemPointsRequest(
    @field:NotNull(message = "Points is required")
    @field:Positive(message = "Points must be positive")
    val points: Long,

    val source: PointsSource = PointsSource.MANUAL,
    val referenceType: String? = null,
    val referenceId: UUID? = null,
    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

data class AdjustPointsRequest(
    @field:NotNull(message = "Points is required")
    val points: Long,

    val descriptionEn: String? = null,
    val descriptionAr: String? = null
)

data class UpdateLoyaltyConfigRequest(
    val enabled: Boolean? = null,

    @field:Min(value = 0, message = "Points per check-in must be non-negative")
    val pointsPerCheckin: Int? = null,

    @field:Min(value = 0, message = "Points per referral must be non-negative")
    val pointsPerReferral: Int? = null,

    @field:Min(value = 0, message = "Points per SAR spent must be non-negative")
    val pointsPerSarSpent: Int? = null,

    @field:Positive(message = "Redemption rate must be positive")
    val redemptionRateSar: BigDecimal? = null,

    @field:Min(value = 0, message = "Bronze threshold must be non-negative")
    val bronzeThreshold: Long? = null,

    @field:Min(value = 0, message = "Silver threshold must be non-negative")
    val silverThreshold: Long? = null,

    @field:Min(value = 0, message = "Gold threshold must be non-negative")
    val goldThreshold: Long? = null,

    @field:Min(value = 0, message = "Platinum threshold must be non-negative")
    val platinumThreshold: Long? = null,

    @field:Min(value = 1, message = "Points expiry months must be at least 1")
    val pointsExpiryMonths: Int? = null
)

// ========== Response DTOs ==========

data class MemberPointsResponse(
    val id: UUID,
    val memberId: UUID,
    val pointsBalance: Long,
    val lifetimeEarned: Long,
    val lifetimeRedeemed: Long,
    val tier: LoyaltyTier,
    val pointsToNextTier: Long?,
    val nextTier: LoyaltyTier?,
    val redemptionValue: BigDecimal,
    val lastActivityAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(memberPoints: MemberPoints, config: LoyaltyConfig): MemberPointsResponse {
            val pointsToNext = config.getPointsToNextTier(memberPoints.lifetimeEarned)
            val nextTier = when (memberPoints.tier) {
                LoyaltyTier.BRONZE -> LoyaltyTier.SILVER
                LoyaltyTier.SILVER -> LoyaltyTier.GOLD
                LoyaltyTier.GOLD -> LoyaltyTier.PLATINUM
                LoyaltyTier.PLATINUM -> null
            }

            return MemberPointsResponse(
                id = memberPoints.id,
                memberId = memberPoints.memberId,
                pointsBalance = memberPoints.pointsBalance,
                lifetimeEarned = memberPoints.lifetimeEarned,
                lifetimeRedeemed = memberPoints.lifetimeRedeemed,
                tier = memberPoints.tier,
                pointsToNextTier = pointsToNext,
                nextTier = nextTier,
                redemptionValue = config.calculateRedemptionValue(memberPoints.pointsBalance),
                lastActivityAt = memberPoints.lastActivityAt,
                createdAt = memberPoints.createdAt,
                updatedAt = memberPoints.updatedAt
            )
        }
    }
}

data class PointsTransactionResponse(
    val id: UUID,
    val memberId: UUID,
    val type: PointsTransactionType,
    val points: Long,
    val source: PointsSource,
    val referenceType: String?,
    val referenceId: UUID?,
    val description: LocalizedTextResponse?,
    val balanceAfter: Long,
    val expiresAt: Instant?,
    val createdAt: Instant
) {
    companion object {
        fun from(transaction: PointsTransaction) = PointsTransactionResponse(
            id = transaction.id,
            memberId = transaction.memberId,
            type = transaction.type,
            points = transaction.points,
            source = transaction.source,
            referenceType = transaction.referenceType,
            referenceId = transaction.referenceId,
            description = if (transaction.description != null || transaction.descriptionAr != null)
                LocalizedTextResponse(transaction.description ?: "", transaction.descriptionAr)
            else null,
            balanceAfter = transaction.balanceAfter,
            expiresAt = transaction.expiresAt,
            createdAt = transaction.createdAt
        )
    }
}

data class LoyaltyConfigResponse(
    val id: UUID,
    val enabled: Boolean,
    val pointsPerCheckin: Int,
    val pointsPerReferral: Int,
    val pointsPerSarSpent: Int,
    val redemptionRateSar: BigDecimal,
    val bronzeThreshold: Long,
    val silverThreshold: Long,
    val goldThreshold: Long,
    val platinumThreshold: Long,
    val pointsExpiryMonths: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(config: LoyaltyConfig) = LoyaltyConfigResponse(
            id = config.id,
            enabled = config.enabled,
            pointsPerCheckin = config.pointsPerCheckin,
            pointsPerReferral = config.pointsPerReferral,
            pointsPerSarSpent = config.pointsPerSarSpent,
            redemptionRateSar = config.redemptionRateSar,
            bronzeThreshold = config.bronzeThreshold,
            silverThreshold = config.silverThreshold,
            goldThreshold = config.goldThreshold,
            platinumThreshold = config.platinumThreshold,
            pointsExpiryMonths = config.pointsExpiryMonths,
            createdAt = config.createdAt,
            updatedAt = config.updatedAt
        )
    }
}

data class LeaderboardEntryResponse(
    val rank: Int,
    val memberId: UUID,
    val pointsBalance: Long,
    val lifetimeEarned: Long,
    val tier: LoyaltyTier
) {
    companion object {
        fun from(memberPoints: MemberPoints, rank: Int) = LeaderboardEntryResponse(
            rank = rank,
            memberId = memberPoints.memberId,
            pointsBalance = memberPoints.pointsBalance,
            lifetimeEarned = memberPoints.lifetimeEarned,
            tier = memberPoints.tier
        )
    }
}

data class LocalizedTextResponse(
    val en: String,
    val ar: String?
) {
    companion object {
        fun from(text: LocalizedText) = LocalizedTextResponse(text.en, text.ar)
        fun fromNullable(text: LocalizedText?) = text?.let { from(it) }
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
