package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

/**
 * Tracks a member's class pack balance.
 * When a member purchases a class pack, a balance record is created.
 * Credits are deducted when booking classes.
 */
@Entity
@Table(name = "member_class_pack_balances")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberClassPackBalance(
    id: UUID = UUID.randomUUID(),

    /**
     * The member who owns this balance.
     */
    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    /**
     * The class pack this balance is for.
     */
    @Column(name = "class_pack_id", nullable = false)
    val classPackId: UUID,

    /**
     * The order ID if purchased through the shop.
     */
    @Column(name = "order_id")
    val orderId: UUID? = null,

    /**
     * Total number of classes purchased in this pack.
     */
    @Column(name = "classes_purchased", nullable = false)
    val classesPurchased: Int,

    /**
     * Number of classes remaining (starts at classesPurchased, decrements on use).
     */
    @Column(name = "classes_remaining", nullable = false)
    var classesRemaining: Int,

    /**
     * When this pack was purchased.
     */
    @Column(name = "purchased_at", nullable = false)
    val purchasedAt: Instant = Instant.now(),

    /**
     * When this balance expires. Null means never expires.
     */
    @Column(name = "expires_at")
    val expiresAt: Instant? = null,

    /**
     * Status of this balance.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClassPackBalanceStatus = ClassPackBalanceStatus.ACTIVE

) : BaseEntity(id) {

    /**
     * Uses one class credit from this balance.
     * @throws IllegalStateException if no credits remaining or balance is not active
     */
    fun useClass() {
        require(canUseCredit()) { "Cannot use credit: balance is not valid" }
        classesRemaining--
        if (classesRemaining <= 0) {
            status = ClassPackBalanceStatus.DEPLETED
        }
    }

    /**
     * Refunds one class credit back to this balance.
     * Used when a booking is cancelled.
     */
    fun refundClass() {
        require(classesRemaining < classesPurchased) { "Cannot refund: no classes used" }
        classesRemaining++
        // If balance was depleted, reactivate it
        if (status == ClassPackBalanceStatus.DEPLETED && classesRemaining > 0) {
            status = ClassPackBalanceStatus.ACTIVE
        }
    }

    /**
     * Checks if this balance can be used (has credits, is active, not expired).
     */
    fun canUseCredit(): Boolean {
        if (status != ClassPackBalanceStatus.ACTIVE) return false
        if (classesRemaining <= 0) return false
        if (isExpired()) return false
        return true
    }

    /**
     * Checks if this balance is valid (active and not expired).
     */
    fun isValid(): Boolean = status == ClassPackBalanceStatus.ACTIVE && !isExpired()

    /**
     * Checks if this balance has expired based on expiresAt.
     */
    fun isExpired(): Boolean {
        val expiry = expiresAt ?: return false
        return Instant.now().isAfter(expiry)
    }

    /**
     * Marks this balance as expired.
     */
    fun markExpired() {
        if (status == ClassPackBalanceStatus.ACTIVE) {
            status = ClassPackBalanceStatus.EXPIRED
        }
    }

    /**
     * Cancels this balance (e.g., for refund).
     */
    fun cancel() {
        status = ClassPackBalanceStatus.CANCELLED
    }

    /**
     * Gets the number of classes used.
     */
    fun classesUsed(): Int = classesPurchased - classesRemaining

    companion object {
        /**
         * Creates a new balance from a class pack purchase.
         */
        fun fromPurchase(
            memberId: UUID,
            classPack: ClassPack,
            orderId: UUID? = null
        ): MemberClassPackBalance {
            val expiresAt = classPack.validityDays?.let { days ->
                Instant.now().plusSeconds(days.toLong() * 24 * 60 * 60)
            }

            return MemberClassPackBalance(
                memberId = memberId,
                classPackId = classPack.id,
                orderId = orderId,
                classesPurchased = classPack.classCount,
                classesRemaining = classPack.classCount,
                expiresAt = expiresAt
            )
        }

        /**
         * Creates a complimentary balance (granted by admin).
         */
        fun grantComplimentary(
            memberId: UUID,
            classPack: ClassPack
        ): MemberClassPackBalance {
            return fromPurchase(memberId, classPack, null)
        }
    }
}
