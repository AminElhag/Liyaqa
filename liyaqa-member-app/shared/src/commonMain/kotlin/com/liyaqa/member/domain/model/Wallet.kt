package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Member wallet balance
 */
@Serializable
data class WalletBalance(
    val memberId: String,
    val balance: Money,
    val lastTransactionAt: String? = null
) {
    val hasCredit: Boolean get() = balance.amount > 0
    val hasDebt: Boolean get() = balance.amount < 0
    val isEmpty: Boolean get() = balance.amount == 0.0
}

/**
 * Wallet transaction
 */
@Serializable
data class WalletTransaction(
    val id: String,
    val type: WalletTransactionType,
    val amount: Money,
    val description: LocalizedText? = null,
    val referenceType: String? = null,
    val referenceId: String? = null,
    val balanceAfter: Money,
    val createdAt: String
) {
    val isCredit: Boolean get() = type in listOf(
        WalletTransactionType.CREDIT,
        WalletTransactionType.REFUND,
        WalletTransactionType.REWARD,
        WalletTransactionType.GIFT_CARD
    )

    val isDebit: Boolean get() = type == WalletTransactionType.DEBIT

    val signedAmount: Double get() = if (isCredit) amount.amount else -amount.amount
}
