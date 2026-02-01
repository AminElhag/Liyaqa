package com.liyaqa.loyalty.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.*

@Entity
@Table(name = "loyalty_config")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class LoyaltyConfig(
    id: UUID = UUID.randomUUID(),

    @Column(name = "enabled", nullable = false)
    var enabled: Boolean = true,

    @Column(name = "points_per_checkin", nullable = false)
    var pointsPerCheckin: Int = 10,

    @Column(name = "points_per_referral", nullable = false)
    var pointsPerReferral: Int = 100,

    @Column(name = "points_per_sar_spent", nullable = false)
    var pointsPerSarSpent: Int = 1,

    @Column(name = "redemption_rate_sar", nullable = false, precision = 5, scale = 2)
    var redemptionRateSar: BigDecimal = BigDecimal("0.01"),

    @Column(name = "bronze_threshold", nullable = false)
    var bronzeThreshold: Long = 0,

    @Column(name = "silver_threshold", nullable = false)
    var silverThreshold: Long = 500,

    @Column(name = "gold_threshold", nullable = false)
    var goldThreshold: Long = 2000,

    @Column(name = "platinum_threshold", nullable = false)
    var platinumThreshold: Long = 5000,

    @Column(name = "points_expiry_months", nullable = false)
    var pointsExpiryMonths: Int = 12
) : BaseEntity(id) {

    fun calculatePointsForSpend(amountSar: BigDecimal): Long {
        return amountSar.multiply(BigDecimal(pointsPerSarSpent)).toLong()
    }

    fun calculateRedemptionValue(points: Long): BigDecimal {
        return BigDecimal(points).multiply(redemptionRateSar)
    }

    fun getTierForPoints(lifetimePoints: Long): LoyaltyTier {
        return when {
            lifetimePoints >= platinumThreshold -> LoyaltyTier.PLATINUM
            lifetimePoints >= goldThreshold -> LoyaltyTier.GOLD
            lifetimePoints >= silverThreshold -> LoyaltyTier.SILVER
            else -> LoyaltyTier.BRONZE
        }
    }

    fun getPointsToNextTier(lifetimePoints: Long): Long? {
        return when {
            lifetimePoints >= platinumThreshold -> null
            lifetimePoints >= goldThreshold -> platinumThreshold - lifetimePoints
            lifetimePoints >= silverThreshold -> goldThreshold - lifetimePoints
            else -> silverThreshold - lifetimePoints
        }
    }

    companion object {
        fun createDefault() = LoyaltyConfig()
    }
}
