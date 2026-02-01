package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Member wallet for tracking balance (credit/debt).
 * Balance can be:
 *   - Positive: member has prepaid credit
 *   - Zero: no credit, no debt
 *   - Negative: member owes money (has pending subscriptions)
 */
@Entity
@Table(name = "member_wallets")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberWallet(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, unique = true, updatable = false)
    val memberId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "balance", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "balance_currency", nullable = false))
    )
    var balance: Money = Money.of(BigDecimal.ZERO, "SAR"),

    @Column(name = "last_transaction_at")
    var lastTransactionAt: Instant? = null

) : BaseEntity(id) {

    /**
     * Add credit to wallet (payment received).
     */
    fun credit(amount: Money) {
        require(amount.isPositive()) { "Credit amount must be positive" }
        balance = balance + amount
        lastTransactionAt = Instant.now()
    }

    /**
     * Debit from wallet (pay for something).
     * Can make balance negative if insufficient funds.
     */
    fun debit(amount: Money) {
        require(amount.isPositive()) { "Debit amount must be positive" }
        balance = balance - amount
        lastTransactionAt = Instant.now()
    }

    /**
     * Charge for subscription (creates negative balance if insufficient funds).
     * Same as debit but semantically different for clarity.
     */
    fun chargeSubscription(amount: Money) {
        require(amount.isPositive()) { "Charge amount must be positive" }
        balance = balance - amount
        lastTransactionAt = Instant.now()
    }

    /**
     * Check if wallet has sufficient balance for an amount.
     */
    fun hasSufficientBalance(amount: Money): Boolean {
        return balance >= amount
    }

    /**
     * Check if wallet balance is positive (has credit).
     */
    fun hasCredit(): Boolean = balance.isPositive()

    /**
     * Check if wallet balance is negative (has debt).
     */
    fun hasDebt(): Boolean = balance.isNegative()

    /**
     * Get the absolute debt amount (returns 0 if no debt).
     */
    fun getDebtAmount(): Money {
        return if (balance.isNegative()) {
            Money.of(balance.amount.abs(), balance.currency)
        } else {
            Money.of(BigDecimal.ZERO, balance.currency)
        }
    }
}
