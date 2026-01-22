package com.liyaqa.membership.api

import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.membership.domain.model.MemberWallet
import com.liyaqa.membership.domain.model.WalletTransaction
import com.liyaqa.membership.domain.model.WalletTransactionType
import com.liyaqa.shared.domain.Money
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Positive
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

// ==================== RESPONSE DTOs ====================

/**
 * Wallet response DTO.
 */
data class WalletResponse(
    val memberId: UUID,
    val balance: Money,
    val lastTransactionAt: Instant?,
    val hasCredit: Boolean,
    val hasDebt: Boolean
) {
    companion object {
        fun from(wallet: MemberWallet): WalletResponse {
            return WalletResponse(
                memberId = wallet.memberId,
                balance = wallet.balance,
                lastTransactionAt = wallet.lastTransactionAt,
                hasCredit = wallet.hasCredit(),
                hasDebt = wallet.hasDebt()
            )
        }

        /**
         * Create a response for a member with no wallet (zero balance).
         */
        fun empty(memberId: UUID, currency: String = "SAR"): WalletResponse {
            return WalletResponse(
                memberId = memberId,
                balance = Money.of(BigDecimal.ZERO, currency),
                lastTransactionAt = null,
                hasCredit = false,
                hasDebt = false
            )
        }
    }
}

/**
 * Wallet transaction response DTO.
 */
data class WalletTransactionResponse(
    val id: UUID,
    val memberId: UUID,
    val type: WalletTransactionType,
    val amount: Money,
    val referenceType: String?,
    val referenceId: UUID?,
    val description: String?,
    val balanceAfter: BigDecimal,
    val createdAt: Instant
) {
    companion object {
        fun from(transaction: WalletTransaction): WalletTransactionResponse {
            return WalletTransactionResponse(
                id = transaction.id,
                memberId = transaction.memberId,
                type = transaction.type,
                amount = transaction.amount,
                referenceType = transaction.referenceType,
                referenceId = transaction.referenceId,
                description = transaction.description,
                balanceAfter = transaction.balanceAfter,
                createdAt = transaction.createdAt
            )
        }
    }
}

// ==================== REQUEST DTOs ====================

/**
 * Request to add credit to a member's wallet.
 */
data class AddCreditRequest(
    @field:NotNull(message = "Amount is required")
    @field:Positive(message = "Amount must be positive")
    val amount: BigDecimal,

    val currency: String = "SAR",

    val description: String? = null,

    val paymentMethod: PaymentMethod? = null
)

/**
 * Request to adjust a member's wallet balance (admin only).
 * Amount can be positive (add) or negative (deduct).
 */
data class AdjustBalanceRequest(
    @field:NotNull(message = "Amount is required")
    val amount: BigDecimal,

    val currency: String = "SAR",

    @field:NotBlank(message = "Description is required for adjustments")
    val description: String
)

/**
 * Request to debit from wallet.
 */
data class DebitRequest(
    @field:NotNull(message = "Amount is required")
    @field:Positive(message = "Amount must be positive")
    val amount: BigDecimal,

    val currency: String = "SAR",

    val referenceType: String? = null,

    val referenceId: UUID? = null,

    val description: String? = null
)
