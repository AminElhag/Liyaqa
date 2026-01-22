package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.TenantContext
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.PrePersist
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Immutable audit log of wallet transactions.
 * Records all changes to wallet balance for accountability and history.
 */
@Entity
@Table(name = "wallet_transactions")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class WalletTransaction(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false, updatable = false)
    var tenantId: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, updatable = false)
    val type: WalletTransactionType,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "amount", nullable = false, updatable = false)),
        AttributeOverride(name = "currency", column = Column(name = "currency", nullable = false, updatable = false))
    )
    val amount: Money,

    @Column(name = "reference_type", updatable = false)
    val referenceType: String? = null,

    @Column(name = "reference_id", updatable = false)
    val referenceId: UUID? = null,

    @Column(name = "description", updatable = false, columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "balance_after", nullable = false, updatable = false)
    val balanceAfter: BigDecimal,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
) {

    @PrePersist
    fun prePersist() {
        val tenant = TenantContext.getCurrentTenantOrNull()
        if (tenant != null) {
            this.tenantId = tenant.value
        }
        this.createdAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is WalletTransaction) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()

    companion object {
        /**
         * Create a credit transaction.
         */
        fun credit(
            memberId: UUID,
            amount: Money,
            balanceAfter: BigDecimal,
            referenceType: String? = "manual_credit",
            referenceId: UUID? = null,
            description: String? = null
        ) = WalletTransaction(
            memberId = memberId,
            type = WalletTransactionType.CREDIT,
            amount = amount,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description,
            balanceAfter = balanceAfter
        )

        /**
         * Create a debit transaction.
         */
        fun debit(
            memberId: UUID,
            amount: Money,
            balanceAfter: BigDecimal,
            referenceType: String? = null,
            referenceId: UUID? = null,
            description: String? = null
        ) = WalletTransaction(
            memberId = memberId,
            type = WalletTransactionType.DEBIT,
            amount = amount,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description,
            balanceAfter = balanceAfter
        )

        /**
         * Create a subscription charge transaction.
         */
        fun subscriptionCharge(
            memberId: UUID,
            amount: Money,
            balanceAfter: BigDecimal,
            subscriptionId: UUID,
            description: String? = null
        ) = WalletTransaction(
            memberId = memberId,
            type = WalletTransactionType.SUBSCRIPTION_CHARGE,
            amount = amount,
            referenceType = "subscription",
            referenceId = subscriptionId,
            description = description,
            balanceAfter = balanceAfter
        )

        /**
         * Create a refund transaction.
         */
        fun refund(
            memberId: UUID,
            amount: Money,
            balanceAfter: BigDecimal,
            referenceType: String? = null,
            referenceId: UUID? = null,
            description: String? = null
        ) = WalletTransaction(
            memberId = memberId,
            type = WalletTransactionType.REFUND,
            amount = amount,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description,
            balanceAfter = balanceAfter
        )

        /**
         * Create an adjustment transaction.
         */
        fun adjustment(
            memberId: UUID,
            amount: Money,
            balanceAfter: BigDecimal,
            description: String
        ) = WalletTransaction(
            memberId = memberId,
            type = WalletTransactionType.ADJUSTMENT,
            amount = amount,
            referenceType = "manual_adjustment",
            referenceId = null,
            description = description,
            balanceAfter = balanceAfter
        )
    }
}
