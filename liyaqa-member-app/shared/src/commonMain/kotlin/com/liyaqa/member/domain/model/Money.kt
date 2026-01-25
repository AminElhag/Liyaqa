package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Represents a monetary amount with currency.
 */
@Serializable
data class Money(
    val amount: Double,
    val currency: String = "SAR"
) {
    fun format(): String {
        val formatted = ((amount * 100).toLong() / 100.0).toString()
        val parts = formatted.split(".")
        val decimal = parts.getOrElse(1) { "00" }.padEnd(2, '0').take(2)
        return "$currency ${parts[0]}.$decimal"
    }

    fun formatCompact(): String = when {
        amount >= 1_000_000 -> {
            val value = amount / 1_000_000
            val formatted = ((value * 10).toLong() / 10.0).toString()
            "$currency ${formatted}M"
        }
        amount >= 1_000 -> {
            val value = amount / 1_000
            val formatted = ((value * 10).toLong() / 10.0).toString()
            "$currency ${formatted}K"
        }
        else -> format()
    }

    operator fun plus(other: Money): Money {
        require(currency == other.currency) { "Cannot add different currencies" }
        return Money(amount + other.amount, currency)
    }

    operator fun minus(other: Money): Money {
        require(currency == other.currency) { "Cannot subtract different currencies" }
        return Money(amount - other.amount, currency)
    }

    operator fun times(factor: Double): Money = Money(amount * factor, currency)

    operator fun compareTo(other: Money): Int {
        require(currency == other.currency) { "Cannot compare different currencies" }
        return amount.compareTo(other.amount)
    }

    val isPositive: Boolean get() = amount > 0
    val isNegative: Boolean get() = amount < 0
    val isZero: Boolean get() = amount == 0.0

    companion object {
        fun zero(currency: String = "SAR") = Money(0.0, currency)
        fun of(amount: Double, currency: String = "SAR") = Money(amount, currency)
    }
}
