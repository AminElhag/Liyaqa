package com.liyaqa.loyalty.application.commands

import com.liyaqa.loyalty.domain.model.PointsSource
import java.math.BigDecimal
import java.util.*

data class EarnPointsCommand(
    val memberId: UUID,
    val points: Long,
    val source: PointsSource,
    val referenceType: String? = null,
    val referenceId: UUID? = null,
    val description: String? = null,
    val descriptionAr: String? = null
)

data class RedeemPointsCommand(
    val memberId: UUID,
    val points: Long,
    val source: PointsSource = PointsSource.MANUAL,
    val referenceType: String? = null,
    val referenceId: UUID? = null,
    val description: String? = null,
    val descriptionAr: String? = null
)

data class AdjustPointsCommand(
    val memberId: UUID,
    val points: Long,
    val description: String? = null,
    val descriptionAr: String? = null
)

data class UpdateLoyaltyConfigCommand(
    val enabled: Boolean? = null,
    val pointsPerCheckin: Int? = null,
    val pointsPerReferral: Int? = null,
    val pointsPerSarSpent: Int? = null,
    val redemptionRateSar: BigDecimal? = null,
    val bronzeThreshold: Long? = null,
    val silverThreshold: Long? = null,
    val goldThreshold: Long? = null,
    val platinumThreshold: Long? = null,
    val pointsExpiryMonths: Int? = null
)
