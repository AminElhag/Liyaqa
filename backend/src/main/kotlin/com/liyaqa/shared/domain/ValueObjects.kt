package com.liyaqa.shared.domain

import jakarta.persistence.Embeddable
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.Currency

/**
 * Value object representing monetary amounts.
 * Immutable and provides safe arithmetic operations.
 */
@Embeddable
data class Money(
    val amount: BigDecimal,
    val currency: String = "USD"
) : Comparable<Money> {

    init {
        require(amount.scale() <= 2) { "Money amount cannot have more than 2 decimal places" }
    }

    companion object {
        val ZERO = Money(BigDecimal.ZERO)

        fun of(amount: Double, currency: String = "USD"): Money =
            Money(BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP), currency)

        fun of(amount: BigDecimal, currency: String = "USD"): Money =
            Money(amount.setScale(2, RoundingMode.HALF_UP), currency)
    }

    operator fun plus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount.add(other.amount), currency)
    }

    operator fun minus(other: Money): Money {
        requireSameCurrency(other)
        return Money(amount.subtract(other.amount), currency)
    }

    operator fun times(multiplier: Int): Money =
        Money(amount.multiply(BigDecimal.valueOf(multiplier.toLong())), currency)

    operator fun times(multiplier: BigDecimal): Money =
        Money(amount.multiply(multiplier).setScale(2, RoundingMode.HALF_UP), currency)

    fun isPositive(): Boolean = amount > BigDecimal.ZERO
    fun isNegative(): Boolean = amount < BigDecimal.ZERO
    fun isZero(): Boolean = amount.compareTo(BigDecimal.ZERO) == 0

    override fun compareTo(other: Money): Int {
        requireSameCurrency(other)
        return amount.compareTo(other.amount)
    }

    private fun requireSameCurrency(other: Money) {
        require(currency == other.currency) {
            "Cannot operate on different currencies: $currency vs ${other.currency}"
        }
    }

    override fun toString(): String = "$currency $amount"
}

/**
 * Value object representing an email address.
 */
@JvmInline
value class Email(val value: String) {
    init {
        require(value.matches(EMAIL_REGEX)) { "Invalid email format: $value" }
    }

    companion object {
        private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    }

    override fun toString(): String = value
}

/**
 * Value object representing a phone number.
 */
@JvmInline
value class PhoneNumber(val value: String) {
    init {
        require(value.matches(PHONE_REGEX)) { "Invalid phone number format: $value" }
    }

    companion object {
        private val PHONE_REGEX = Regex("^\\+?[1-9]\\d{1,14}$")
    }

    override fun toString(): String = value
}
