package com.liyaqa.referral.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.util.UUID

/**
 * A unique referral code assigned to a member for tracking referrals.
 */
@Entity
@Table(name = "referral_codes")
class ReferralCode(
    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "code", nullable = false, length = 20)
    val code: String,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "click_count", nullable = false)
    var clickCount: Int = 0,

    @Column(name = "conversion_count", nullable = false)
    var conversionCount: Int = 0,

    id: UUID = UUID.randomUUID()
) : BaseEntity(id) {

    /**
     * Record a click on this referral code.
     */
    fun recordClick() {
        clickCount++
    }

    /**
     * Record a successful conversion from this referral code.
     */
    fun recordConversion() {
        conversionCount++
    }

    /**
     * Activate the referral code.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate the referral code.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Calculate the conversion rate.
     */
    fun conversionRate(): Double {
        return if (clickCount > 0) {
            conversionCount.toDouble() / clickCount.toDouble()
        } else {
            0.0
        }
    }

    companion object {
        /**
         * Generate a unique referral code with the given prefix.
         */
        fun generateCode(prefix: String): String {
            val randomPart = (100000..999999).random()
            return "$prefix$randomPart"
        }
    }
}
