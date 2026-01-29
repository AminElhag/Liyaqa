package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Retention offer presented to member during cancellation flow.
 * Tracks offer status and outcome.
 */
@Entity
@Table(name = "retention_offers")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class RetentionOffer(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "contract_id")
    val contractId: UUID? = null,

    // ==========================================
    // OFFER DETAILS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false)
    val offerType: RetentionOfferType,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "title_en")),
        AttributeOverride(name = "ar", column = Column(name = "title_ar"))
    )
    var title: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    // ==========================================
    // VALUE
    // ==========================================

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "value_amount")),
        AttributeOverride(name = "currency", column = Column(name = "value_currency"))
    )
    var value: Money? = null,

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    var discountPercentage: BigDecimal? = null,

    @Column(name = "duration_days")
    var durationDays: Int? = null,

    @Column(name = "duration_months")
    var durationMonths: Int? = null,

    // ==========================================
    // DOWNGRADE OFFER
    // ==========================================

    @Column(name = "alternative_plan_id")
    var alternativePlanId: UUID? = null,

    // ==========================================
    // STATUS
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: RetentionOfferStatus = RetentionOfferStatus.PENDING,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    // ==========================================
    // RESPONSE
    // ==========================================

    @Column(name = "accepted_at")
    var acceptedAt: Instant? = null,

    @Column(name = "declined_at")
    var declinedAt: Instant? = null,

    // ==========================================
    // WHAT WAS APPLIED
    // ==========================================

    @Column(name = "wallet_transaction_id")
    var walletTransactionId: UUID? = null,

    @Column(name = "freeze_history_id")
    var freezeHistoryId: UUID? = null,

    @Column(name = "plan_change_id")
    var planChangeId: UUID? = null,

    // ==========================================
    // DISPLAY ORDER
    // ==========================================

    @Column(name = "priority", nullable = false)
    var priority: Int = 1

) : BaseEntity(id) {

    /**
     * Check if offer is still pending response.
     */
    fun isPending(): Boolean = status == RetentionOfferStatus.PENDING

    /**
     * Check if offer was accepted.
     */
    fun isAccepted(): Boolean = status == RetentionOfferStatus.ACCEPTED

    /**
     * Check if offer was declined.
     */
    fun isDeclined(): Boolean = status == RetentionOfferStatus.DECLINED

    /**
     * Check if offer has expired.
     */
    fun isExpired(): Boolean {
        if (status == RetentionOfferStatus.EXPIRED) return true
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) {
            return true
        }
        return false
    }

    /**
     * Check if offer can still be accepted.
     */
    fun canBeAccepted(): Boolean = isPending() && !isExpired()

    /**
     * Accept the offer.
     */
    fun accept() {
        require(canBeAccepted()) { "Offer cannot be accepted" }
        status = RetentionOfferStatus.ACCEPTED
        acceptedAt = Instant.now()
    }

    /**
     * Decline the offer.
     */
    fun decline() {
        require(isPending()) { "Can only decline pending offers" }
        status = RetentionOfferStatus.DECLINED
        declinedAt = Instant.now()
    }

    /**
     * Mark as expired.
     */
    fun markExpired() {
        if (isPending()) {
            status = RetentionOfferStatus.EXPIRED
        }
    }

    /**
     * Link freeze history (for FREE_FREEZE offers).
     */
    fun linkFreezeHistory(freezeHistoryId: UUID) {
        this.freezeHistoryId = freezeHistoryId
    }

    /**
     * Link wallet transaction (for CREDIT/DISCOUNT offers).
     */
    fun linkWalletTransaction(walletTransactionId: UUID) {
        this.walletTransactionId = walletTransactionId
    }

    /**
     * Link plan change (for DOWNGRADE offers).
     */
    fun linkPlanChange(planChangeId: UUID) {
        this.planChangeId = planChangeId
    }

    /**
     * Check if this is a free freeze offer.
     */
    fun isFreeFreezeOffer(): Boolean = offerType == RetentionOfferType.FREE_FREEZE

    /**
     * Check if this is a discount offer.
     */
    fun isDiscountOffer(): Boolean = offerType == RetentionOfferType.DISCOUNT

    /**
     * Check if this is a credit offer.
     */
    fun isCreditOffer(): Boolean = offerType == RetentionOfferType.CREDIT

    /**
     * Check if this is a downgrade offer.
     */
    fun isDowngradeOffer(): Boolean = offerType == RetentionOfferType.DOWNGRADE

    companion object {
        fun createFreeFreezeOffer(
            memberId: UUID,
            subscriptionId: UUID,
            freezeDays: Int,
            expiresAt: Instant? = null,
            contractId: UUID? = null
        ) = RetentionOffer(
            memberId = memberId,
            subscriptionId = subscriptionId,
            contractId = contractId,
            offerType = RetentionOfferType.FREE_FREEZE,
            title = LocalizedText(
                en = "Take a Break",
                ar = "خذ استراحة"
            ),
            description = LocalizedText(
                en = "Get $freezeDays FREE freeze days to pause your membership",
                ar = "احصل على $freezeDays أيام تجميد مجانية لإيقاف عضويتك مؤقتاً"
            ),
            durationDays = freezeDays,
            expiresAt = expiresAt,
            priority = 1
        )

        fun createDiscountOffer(
            memberId: UUID,
            subscriptionId: UUID,
            discountPercentage: BigDecimal,
            durationMonths: Int,
            expiresAt: Instant? = null,
            contractId: UUID? = null
        ) = RetentionOffer(
            memberId = memberId,
            subscriptionId = subscriptionId,
            contractId = contractId,
            offerType = RetentionOfferType.DISCOUNT,
            title = LocalizedText(
                en = "Loyalty Discount",
                ar = "خصم الولاء"
            ),
            description = LocalizedText(
                en = "$discountPercentage% off your next $durationMonths months",
                ar = "خصم $discountPercentage% على الأشهر الـ $durationMonths القادمة"
            ),
            discountPercentage = discountPercentage,
            durationMonths = durationMonths,
            expiresAt = expiresAt,
            priority = 2
        )

        fun createDowngradeOffer(
            memberId: UUID,
            subscriptionId: UUID,
            alternativePlanId: UUID,
            alternativePlanName: LocalizedText,
            alternativePlanPrice: Money,
            expiresAt: Instant? = null,
            contractId: UUID? = null
        ) = RetentionOffer(
            memberId = memberId,
            subscriptionId = subscriptionId,
            contractId = contractId,
            offerType = RetentionOfferType.DOWNGRADE,
            title = LocalizedText(
                en = "Try ${alternativePlanName.en}",
                ar = "جرب ${alternativePlanName.ar ?: alternativePlanName.en}"
            ),
            description = LocalizedText(
                en = "Switch to ${alternativePlanName.en} at ${alternativePlanPrice.currency} ${alternativePlanPrice.amount}/month",
                ar = "انتقل إلى ${alternativePlanName.ar ?: alternativePlanName.en} بسعر ${alternativePlanPrice.amount} ${alternativePlanPrice.currency}/شهرياً"
            ),
            alternativePlanId = alternativePlanId,
            value = alternativePlanPrice,
            expiresAt = expiresAt,
            priority = 3
        )
    }
}
