package com.liyaqa.referral.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Tracks a referral from click to conversion.
 */
@Entity
@Table(name = "referrals")
class Referral(
    @Column(name = "referral_code_id", nullable = false)
    val referralCodeId: UUID,

    @Column(name = "referrer_member_id", nullable = false)
    val referrerMemberId: UUID,

    @Column(name = "referee_member_id")
    var refereeMemberId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: ReferralStatus = ReferralStatus.CLICKED,

    @Column(name = "clicked_at")
    var clickedAt: Instant? = Instant.now(),

    @Column(name = "converted_at")
    var convertedAt: Instant? = null,

    @Column(name = "subscription_id")
    var subscriptionId: UUID? = null,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Mark that the referred person signed up.
     */
    fun markSignedUp(refereeMemberId: UUID) {
        this.refereeMemberId = refereeMemberId
        this.status = ReferralStatus.SIGNED_UP
    }

    /**
     * Mark the referral as converted (subscription purchased).
     */
    fun markConverted(subscriptionId: UUID) {
        this.status = ReferralStatus.CONVERTED
        this.subscriptionId = subscriptionId
        this.convertedAt = Instant.now()
    }

    /**
     * Mark the referral as expired.
     */
    fun markExpired() {
        this.status = ReferralStatus.EXPIRED
    }

    /**
     * Check if the referral can still be converted.
     */
    fun canConvert(): Boolean {
        return status == ReferralStatus.CLICKED || status == ReferralStatus.SIGNED_UP
    }

    /**
     * Check if the referral is converted.
     */
    fun isConverted(): Boolean {
        return status == ReferralStatus.CONVERTED
    }
}
