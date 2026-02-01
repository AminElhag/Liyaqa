package com.liyaqa.loyalty.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "member_points")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberPoints(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true, updatable = false)
    val memberId: UUID,

    @Column(name = "points_balance", nullable = false)
    var pointsBalance: Long = 0,

    @Column(name = "lifetime_earned", nullable = false)
    var lifetimeEarned: Long = 0,

    @Column(name = "lifetime_redeemed", nullable = false)
    var lifetimeRedeemed: Long = 0,

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false, length = 20)
    var tier: LoyaltyTier = LoyaltyTier.BRONZE,

    @Column(name = "last_activity_at")
    var lastActivityAt: Instant? = null
) : BaseEntity(id) {

    fun earnPoints(points: Long): Long {
        require(points > 0) { "Points to earn must be positive" }
        pointsBalance += points
        lifetimeEarned += points
        lastActivityAt = Instant.now()
        return pointsBalance
    }

    fun redeemPoints(points: Long): Long {
        require(points > 0) { "Points to redeem must be positive" }
        require(pointsBalance >= points) { "Insufficient points balance" }
        pointsBalance -= points
        lifetimeRedeemed += points
        lastActivityAt = Instant.now()
        return pointsBalance
    }

    fun expirePoints(points: Long): Long {
        require(points > 0) { "Points to expire must be positive" }
        val toExpire = minOf(points, pointsBalance)
        pointsBalance -= toExpire
        lastActivityAt = Instant.now()
        return pointsBalance
    }

    fun adjustPoints(points: Long): Long {
        pointsBalance += points
        if (points > 0) lifetimeEarned += points
        lastActivityAt = Instant.now()
        return pointsBalance
    }

    fun updateTier(config: LoyaltyConfig) {
        tier = when {
            lifetimeEarned >= config.platinumThreshold -> LoyaltyTier.PLATINUM
            lifetimeEarned >= config.goldThreshold -> LoyaltyTier.GOLD
            lifetimeEarned >= config.silverThreshold -> LoyaltyTier.SILVER
            else -> LoyaltyTier.BRONZE
        }
    }
}
