package com.liyaqa.billing.api

import com.liyaqa.billing.application.services.PaymentMethodService
import com.liyaqa.billing.domain.model.PaymentMethodType
import com.liyaqa.billing.domain.model.PaymentProviderType
import com.liyaqa.billing.domain.model.SavedPaymentMethod
import com.liyaqa.shared.auth.CurrentUserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

/**
 * REST Controller for member self-service payment method management.
 */
@RestController
@RequestMapping("/api/me/payment-methods")
@Tag(name = "Member Payment Methods", description = "Self-service payment method management")
class PaymentMethodController(
    private val paymentMethodService: PaymentMethodService,
    private val currentUserService: CurrentUserService
) {

    @GetMapping
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Get my saved payment methods")
    fun getMyPaymentMethods(): ResponseEntity<List<PaymentMethodResponse>> {
        val memberId = currentUserService.requireCurrentMemberId()
        val methods = paymentMethodService.getMemberPaymentMethods(memberId)
        return ResponseEntity.ok(methods.map { PaymentMethodResponse.from(it) })
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Get a specific payment method")
    fun getPaymentMethod(@PathVariable id: UUID): ResponseEntity<PaymentMethodResponse> {
        val memberId = currentUserService.requireCurrentMemberId()
        val method = paymentMethodService.getPaymentMethod(id, memberId)
        return ResponseEntity.ok(PaymentMethodResponse.from(method))
    }

    @GetMapping("/default")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Get my default payment method")
    fun getDefaultPaymentMethod(): ResponseEntity<PaymentMethodResponse?> {
        val memberId = currentUserService.requireCurrentMemberId()
        val method = paymentMethodService.getDefaultPaymentMethod(memberId)
        return ResponseEntity.ok(method?.let { PaymentMethodResponse.from(it) })
    }

    @PostMapping
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Add a new payment method")
    fun addPaymentMethod(
        @Valid @RequestBody request: AddPaymentMethodRequest
    ): ResponseEntity<PaymentMethodResponse> {
        val memberId = currentUserService.requireCurrentMemberId()

        val method = paymentMethodService.addPaymentMethod(
            memberId = memberId,
            paymentType = request.paymentType,
            providerType = request.providerType,
            providerToken = request.providerToken,
            providerCustomerId = request.providerCustomerId,
            cardLastFour = request.cardLastFour,
            cardBrand = request.cardBrand,
            cardExpMonth = request.cardExpMonth,
            cardExpYear = request.cardExpYear,
            nickname = request.nickname,
            setAsDefault = request.setAsDefault ?: false,
            billingName = request.billingName,
            billingCountry = request.billingCountry,
            billingCity = request.billingCity
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(PaymentMethodResponse.from(method))
    }

    @PutMapping("/{id}/default")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Set a payment method as default")
    fun setAsDefault(@PathVariable id: UUID): ResponseEntity<PaymentMethodResponse> {
        val memberId = currentUserService.requireCurrentMemberId()
        val method = paymentMethodService.setAsDefault(id, memberId)
        return ResponseEntity.ok(PaymentMethodResponse.from(method))
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Update payment method (nickname)")
    fun updatePaymentMethod(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePaymentMethodRequest
    ): ResponseEntity<PaymentMethodResponse> {
        val memberId = currentUserService.requireCurrentMemberId()
        val method = paymentMethodService.updateNickname(id, memberId, request.nickname)
        return ResponseEntity.ok(PaymentMethodResponse.from(method))
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Remove a payment method")
    fun removePaymentMethod(@PathVariable id: UUID): ResponseEntity<Void> {
        val memberId = currentUserService.requireCurrentMemberId()
        paymentMethodService.removePaymentMethod(id, memberId)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/has-saved")
    @PreAuthorize("hasRole('MEMBER')")
    @Operation(summary = "Check if member has any saved payment methods")
    fun hasSavedPaymentMethods(): ResponseEntity<Map<String, Boolean>> {
        val memberId = currentUserService.requireCurrentMemberId()
        val hasSaved = paymentMethodService.hasSavedPaymentMethods(memberId)
        return ResponseEntity.ok(mapOf("hasSavedPaymentMethods" to hasSaved))
    }
}

// ===== DTOs =====

data class AddPaymentMethodRequest(
    val paymentType: PaymentMethodType,
    val providerType: PaymentProviderType,
    val providerToken: String? = null,
    val providerCustomerId: String? = null,
    val cardLastFour: String? = null,
    val cardBrand: String? = null,
    val cardExpMonth: Int? = null,
    val cardExpYear: Int? = null,
    val nickname: String? = null,
    val setAsDefault: Boolean? = false,
    val billingName: String? = null,
    val billingCountry: String? = null,
    val billingCity: String? = null
)

data class UpdatePaymentMethodRequest(
    val nickname: String? = null
)

data class PaymentMethodResponse(
    val id: String,
    val paymentType: PaymentMethodType,
    val providerType: PaymentProviderType,
    val cardLastFour: String?,
    val cardBrand: String?,
    val cardExpMonth: Int?,
    val cardExpYear: Int?,
    val nickname: String?,
    val displayName: String,
    val isDefault: Boolean,
    val isExpired: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(method: SavedPaymentMethod) = PaymentMethodResponse(
            id = method.id.toString(),
            paymentType = method.paymentType,
            providerType = method.providerType,
            cardLastFour = method.cardLastFour,
            cardBrand = method.cardBrand,
            cardExpMonth = method.cardExpMonth,
            cardExpYear = method.cardExpYear,
            nickname = method.nickname,
            displayName = method.getDisplayName(),
            isDefault = method.isDefault,
            isExpired = method.isExpired(),
            createdAt = method.createdAt
        )
    }
}
