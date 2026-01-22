package com.liyaqa.membership.application.services

import com.liyaqa.billing.domain.model.PaymentMethod
import com.liyaqa.membership.domain.model.MemberWallet
import com.liyaqa.membership.domain.model.Subscription
import com.liyaqa.membership.domain.model.SubscriptionStatus
import com.liyaqa.membership.domain.model.WalletTransaction
import com.liyaqa.membership.domain.model.WalletTransactionType
import com.liyaqa.membership.domain.ports.MemberRepository
import com.liyaqa.membership.domain.ports.MembershipPlanRepository
import com.liyaqa.membership.domain.ports.MemberWalletRepository
import com.liyaqa.membership.domain.ports.SubscriptionRepository
import com.liyaqa.membership.domain.ports.WalletTransactionRepository
import com.liyaqa.shared.domain.Money
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional
class WalletService(
    private val walletRepository: MemberWalletRepository,
    private val transactionRepository: WalletTransactionRepository,
    private val memberRepository: MemberRepository,
    private val subscriptionRepository: SubscriptionRepository,
    private val membershipPlanRepository: MembershipPlanRepository
) {
    private val logger = LoggerFactory.getLogger(WalletService::class.java)

    /**
     * Get or create a wallet for a member.
     */
    fun getOrCreateWallet(memberId: UUID, currency: String = "SAR"): MemberWallet {
        return walletRepository.findByMemberId(memberId)
            .orElseGet {
                // Verify member exists
                if (!memberRepository.existsById(memberId)) {
                    throw NoSuchElementException("Member not found: $memberId")
                }
                val wallet = MemberWallet(
                    memberId = memberId,
                    balance = Money.of(BigDecimal.ZERO, currency)
                )
                walletRepository.save(wallet)
            }
    }

    /**
     * Get wallet for a member.
     */
    @Transactional(readOnly = true)
    fun getWallet(memberId: UUID): MemberWallet? {
        return walletRepository.findByMemberId(memberId).orElse(null)
    }

    /**
     * Get wallet balance for a member.
     */
    @Transactional(readOnly = true)
    fun getBalance(memberId: UUID): Money {
        return walletRepository.findByMemberId(memberId)
            .map { it.balance }
            .orElse(Money.of(BigDecimal.ZERO, "SAR"))
    }

    /**
     * Add credit to wallet (payment received).
     * After adding credit, triggers auto-payment for any pending subscriptions.
     */
    fun addCredit(
        memberId: UUID,
        amount: Money,
        description: String? = null,
        paymentMethod: PaymentMethod? = null
    ): MemberWallet {
        require(amount.isPositive()) { "Amount must be positive" }

        val wallet = getOrCreateWallet(memberId, amount.currency)
        wallet.credit(amount)
        val savedWallet = walletRepository.save(wallet)

        // Record transaction
        val transaction = WalletTransaction.credit(
            memberId = memberId,
            amount = amount,
            balanceAfter = savedWallet.balance.amount,
            referenceType = paymentMethod?.name?.lowercase() ?: "manual_credit",
            description = description ?: "Credit added"
        )
        transactionRepository.save(transaction)

        logger.info("Added credit of ${amount.amount} ${amount.currency} to member $memberId wallet. New balance: ${savedWallet.balance.amount}")

        // Auto-pay pending subscriptions if balance is positive
        autoPayPendingSubscriptions(memberId)

        return savedWallet
    }

    /**
     * Debit from wallet (e.g., pay for invoice).
     */
    fun debit(
        memberId: UUID,
        amount: Money,
        referenceType: String? = null,
        referenceId: UUID? = null,
        description: String? = null
    ): MemberWallet {
        require(amount.isPositive()) { "Amount must be positive" }

        val wallet = getOrCreateWallet(memberId, amount.currency)
        wallet.debit(amount)
        val savedWallet = walletRepository.save(wallet)

        // Record transaction
        val transaction = WalletTransaction.debit(
            memberId = memberId,
            amount = amount,
            balanceAfter = savedWallet.balance.amount,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description
        )
        transactionRepository.save(transaction)

        logger.info("Debited ${amount.amount} ${amount.currency} from member $memberId wallet. New balance: ${savedWallet.balance.amount}")

        return savedWallet
    }

    /**
     * Charge subscription to wallet.
     * This is called when a subscription is created without payment.
     * Balance will go negative if insufficient funds.
     */
    fun chargeSubscription(
        memberId: UUID,
        subscriptionId: UUID,
        amount: Money
    ): MemberWallet {
        require(amount.isPositive()) { "Amount must be positive" }

        val wallet = getOrCreateWallet(memberId, amount.currency)
        wallet.chargeSubscription(amount)
        val savedWallet = walletRepository.save(wallet)

        // Record transaction
        val transaction = WalletTransaction.subscriptionCharge(
            memberId = memberId,
            amount = amount,
            balanceAfter = savedWallet.balance.amount,
            subscriptionId = subscriptionId,
            description = "Subscription charge"
        )
        transactionRepository.save(transaction)

        logger.info("Charged subscription $subscriptionId for ${amount.amount} ${amount.currency} to member $memberId wallet. New balance: ${savedWallet.balance.amount}")

        return savedWallet
    }

    /**
     * Add refund to wallet.
     */
    fun addRefund(
        memberId: UUID,
        amount: Money,
        referenceType: String? = null,
        referenceId: UUID? = null,
        description: String? = null
    ): MemberWallet {
        require(amount.isPositive()) { "Amount must be positive" }

        val wallet = getOrCreateWallet(memberId, amount.currency)
        wallet.credit(amount)
        val savedWallet = walletRepository.save(wallet)

        // Record transaction
        val transaction = WalletTransaction.refund(
            memberId = memberId,
            amount = amount,
            balanceAfter = savedWallet.balance.amount,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description ?: "Refund"
        )
        transactionRepository.save(transaction)

        logger.info("Added refund of ${amount.amount} ${amount.currency} to member $memberId wallet. New balance: ${savedWallet.balance.amount}")

        return savedWallet
    }

    /**
     * Manual adjustment by admin (can be positive or negative).
     */
    fun adjustBalance(
        memberId: UUID,
        amount: Money,
        description: String
    ): MemberWallet {
        val wallet = getOrCreateWallet(memberId, amount.currency)

        // Amount can be positive (add) or negative (subtract)
        if (amount.isPositive()) {
            wallet.credit(amount)
        } else if (amount.isNegative()) {
            wallet.debit(Money.of(amount.amount.abs(), amount.currency))
        }

        val savedWallet = walletRepository.save(wallet)

        // Record transaction
        val transaction = WalletTransaction.adjustment(
            memberId = memberId,
            amount = amount,
            balanceAfter = savedWallet.balance.amount,
            description = description
        )
        transactionRepository.save(transaction)

        logger.info("Adjusted member $memberId wallet balance by ${amount.amount} ${amount.currency}. New balance: ${savedWallet.balance.amount}. Reason: $description")

        // Auto-pay if adjustment made balance positive
        if (savedWallet.hasCredit()) {
            autoPayPendingSubscriptions(memberId)
        }

        return savedWallet
    }

    /**
     * Auto-pay pending subscriptions from wallet balance.
     * Called automatically after credit is added.
     * @return List of subscriptions that were activated
     */
    fun autoPayPendingSubscriptions(memberId: UUID): List<Subscription> {
        val wallet = walletRepository.findByMemberId(memberId).orElse(null) ?: return emptyList()

        // Only proceed if wallet has positive balance
        if (!wallet.hasCredit()) {
            return emptyList()
        }

        // Find pending payment subscriptions for this member
        val pendingSubscriptions = subscriptionRepository.findByMemberIdAndStatus(
            memberId,
            SubscriptionStatus.PENDING_PAYMENT
        )

        if (pendingSubscriptions.isEmpty()) {
            return emptyList()
        }

        val activatedSubscriptions = mutableListOf<Subscription>()
        var currentBalance = wallet.balance

        for (subscription in pendingSubscriptions) {
            // Get plan recurring total (membership fee + admin fee)
            val plan = membershipPlanRepository.findById(subscription.planId).orElse(null) ?: continue
            val amountNeeded = plan.getRecurringTotal()

            // Check if we have enough balance
            if (currentBalance >= amountNeeded) {
                // Activate subscription
                subscription.confirmPayment(amountNeeded)
                subscriptionRepository.save(subscription)
                activatedSubscriptions.add(subscription)

                // Deduct from balance
                wallet.debit(amountNeeded)
                currentBalance = wallet.balance

                // Record the debit transaction
                val transaction = WalletTransaction.debit(
                    memberId = memberId,
                    amount = amountNeeded,
                    balanceAfter = wallet.balance.amount,
                    referenceType = "subscription",
                    referenceId = subscription.id,
                    description = "Auto-paid subscription from wallet"
                )
                transactionRepository.save(transaction)

                logger.info("Auto-activated subscription ${subscription.id} for member $memberId using wallet balance")
            }
        }

        // Save updated wallet if any subscriptions were activated
        if (activatedSubscriptions.isNotEmpty()) {
            walletRepository.save(wallet)
        }

        return activatedSubscriptions
    }

    /**
     * Get transaction history for a member.
     */
    @Transactional(readOnly = true)
    fun getTransactionHistory(memberId: UUID, pageable: Pageable): Page<WalletTransaction> {
        return transactionRepository.findByMemberId(memberId, pageable)
    }

    /**
     * Get transactions by type for a member.
     */
    @Transactional(readOnly = true)
    fun getTransactionsByType(
        memberId: UUID,
        type: WalletTransactionType,
        pageable: Pageable
    ): Page<WalletTransaction> {
        return transactionRepository.findByMemberIdAndType(memberId, type, pageable)
    }

    /**
     * Get transaction count for a member.
     */
    @Transactional(readOnly = true)
    fun getTransactionCount(memberId: UUID): Long {
        return transactionRepository.countByMemberId(memberId)
    }
}
