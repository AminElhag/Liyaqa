package com.liyaqa.membership.domain.model

/**
 * Types of wallet transactions.
 */
enum class WalletTransactionType {
    /** Money added to wallet (payment received) */
    CREDIT,

    /** Money used from wallet (paying invoice or subscription) */
    DEBIT,

    /** Subscription created without payment - charges wallet (creates negative balance) */
    SUBSCRIPTION_CHARGE,

    /** Refund added to wallet */
    REFUND,

    /** Manual adjustment by admin */
    ADJUSTMENT
}
