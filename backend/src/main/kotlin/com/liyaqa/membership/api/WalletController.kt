package com.liyaqa.membership.api

import com.liyaqa.membership.application.services.WalletService
import com.liyaqa.membership.domain.model.WalletTransactionType
import com.liyaqa.shared.domain.Money
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/members/{memberId}/wallet")
@Tag(name = "Member Wallet", description = "Manage member wallet balance and transactions")
class WalletController(
    private val walletService: WalletService
) {

    @GetMapping
    @PreAuthorize("hasAuthority('wallets_view')")
    @Operation(summary = "Get member wallet", description = "Get wallet balance for a member")
    fun getWallet(
        @PathVariable memberId: UUID
    ): ResponseEntity<WalletResponse> {
        val wallet = walletService.getWallet(memberId)
        return if (wallet != null) {
            ResponseEntity.ok(WalletResponse.from(wallet))
        } else {
            ResponseEntity.ok(WalletResponse.empty(memberId))
        }
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasAuthority('wallets_view')")
    @Operation(summary = "Get wallet transactions", description = "Get transaction history for a member's wallet")
    fun getTransactions(
        @PathVariable memberId: UUID,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(required = false) type: WalletTransactionType?
    ): ResponseEntity<Page<WalletTransactionResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))

        val transactions = if (type != null) {
            walletService.getTransactionsByType(memberId, type, pageable)
        } else {
            walletService.getTransactionHistory(memberId, pageable)
        }

        return ResponseEntity.ok(transactions.map { WalletTransactionResponse.from(it) })
    }

    @PostMapping("/credit")
    @PreAuthorize("hasAuthority('wallets_update')")
    @Operation(summary = "Add credit to wallet", description = "Add credit to a member's wallet (e.g., from payment)")
    fun addCredit(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: AddCreditRequest
    ): ResponseEntity<WalletResponse> {
        val amount = Money.of(request.amount, request.currency)
        val wallet = walletService.addCredit(
            memberId = memberId,
            amount = amount,
            description = request.description,
            paymentMethod = request.paymentMethod
        )
        return ResponseEntity.ok(WalletResponse.from(wallet))
    }

    @PostMapping("/debit")
    @PreAuthorize("hasAuthority('wallets_update')")
    @Operation(summary = "Debit from wallet", description = "Debit an amount from a member's wallet")
    fun debit(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: DebitRequest
    ): ResponseEntity<WalletResponse> {
        val amount = Money.of(request.amount, request.currency)
        val wallet = walletService.debit(
            memberId = memberId,
            amount = amount,
            referenceType = request.referenceType,
            referenceId = request.referenceId,
            description = request.description
        )
        return ResponseEntity.ok(WalletResponse.from(wallet))
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAuthority('wallets_update')")
    @Operation(summary = "Adjust wallet balance", description = "Admin adjustment to wallet balance (can be positive or negative)")
    fun adjustBalance(
        @PathVariable memberId: UUID,
        @Valid @RequestBody request: AdjustBalanceRequest
    ): ResponseEntity<WalletResponse> {
        val amount = Money.of(request.amount, request.currency)
        val wallet = walletService.adjustBalance(
            memberId = memberId,
            amount = amount,
            description = request.description
        )
        return ResponseEntity.ok(WalletResponse.from(wallet))
    }

    @PostMapping("/auto-pay")
    @PreAuthorize("hasAuthority('wallets_update')")
    @Operation(summary = "Trigger auto-pay", description = "Manually trigger auto-payment for pending subscriptions")
    fun triggerAutoPay(
        @PathVariable memberId: UUID
    ): ResponseEntity<Map<String, Any>> {
        val activatedSubscriptions = walletService.autoPayPendingSubscriptions(memberId)
        return ResponseEntity.ok(mapOf(
            "activatedCount" to activatedSubscriptions.size,
            "activatedSubscriptionIds" to activatedSubscriptions.map { it.id }
        ))
    }
}
