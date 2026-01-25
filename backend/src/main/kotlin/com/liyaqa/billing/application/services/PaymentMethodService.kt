package com.liyaqa.billing.application.services

import com.liyaqa.billing.domain.model.PaymentMethodType
import com.liyaqa.billing.domain.model.PaymentProviderType
import com.liyaqa.billing.domain.model.SavedPaymentMethod
import com.liyaqa.billing.domain.ports.SavedPaymentMethodRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * Service for managing saved payment methods.
 */
@Service
@Transactional
class PaymentMethodService(
    private val repository: SavedPaymentMethodRepository
) {
    private val logger = LoggerFactory.getLogger(PaymentMethodService::class.java)

    /**
     * Add a new saved payment method.
     */
    fun addPaymentMethod(
        memberId: UUID,
        paymentType: PaymentMethodType,
        providerType: PaymentProviderType,
        providerToken: String?,
        providerCustomerId: String?,
        cardLastFour: String?,
        cardBrand: String?,
        cardExpMonth: Int?,
        cardExpYear: Int?,
        nickname: String?,
        setAsDefault: Boolean = false,
        billingName: String? = null,
        billingCountry: String? = null,
        billingCity: String? = null
    ): SavedPaymentMethod {
        // If this should be default, clear other defaults
        if (setAsDefault) {
            repository.clearDefaultForMember(memberId)
        }

        // If this is the first payment method, make it default
        val isFirstMethod = repository.countActiveByMemberId(memberId) == 0L

        val paymentMethod = SavedPaymentMethod(
            memberId = memberId,
            paymentType = paymentType,
            providerType = providerType,
            providerToken = providerToken,
            providerCustomerId = providerCustomerId,
            cardLastFour = cardLastFour,
            cardBrand = cardBrand,
            cardExpMonth = cardExpMonth,
            cardExpYear = cardExpYear,
            nickname = nickname,
            isDefault = setAsDefault || isFirstMethod,
            billingName = billingName,
            billingCountry = billingCountry,
            billingCity = billingCity
        )

        logger.info("Added payment method for member $memberId: ${paymentMethod.id}")
        return repository.save(paymentMethod)
    }

    /**
     * Get all active payment methods for a member.
     */
    @Transactional(readOnly = true)
    fun getMemberPaymentMethods(memberId: UUID): List<SavedPaymentMethod> {
        return repository.findActiveByMemberId(memberId)
    }

    /**
     * Get a specific payment method (with ownership check).
     */
    @Transactional(readOnly = true)
    fun getPaymentMethod(id: UUID, memberId: UUID): SavedPaymentMethod {
        return repository.findByIdAndMemberId(id, memberId)
            .orElseThrow { NoSuchElementException("Payment method not found: $id") }
    }

    /**
     * Get the default payment method for a member.
     */
    @Transactional(readOnly = true)
    fun getDefaultPaymentMethod(memberId: UUID): SavedPaymentMethod? {
        return repository.findDefaultByMemberId(memberId).orElse(null)
    }

    /**
     * Set a payment method as the default.
     */
    fun setAsDefault(id: UUID, memberId: UUID): SavedPaymentMethod {
        val paymentMethod = getPaymentMethod(id, memberId)

        // Clear other defaults
        repository.clearDefaultForMember(memberId)

        // Set this as default
        paymentMethod.setAsDefault()
        logger.info("Set payment method $id as default for member $memberId")

        return repository.save(paymentMethod)
    }

    /**
     * Update payment method nickname.
     */
    fun updateNickname(id: UUID, memberId: UUID, nickname: String?): SavedPaymentMethod {
        val paymentMethod = getPaymentMethod(id, memberId)
        paymentMethod.updateNickname(nickname)
        logger.info("Updated nickname for payment method $id")
        return repository.save(paymentMethod)
    }

    /**
     * Remove (deactivate) a payment method.
     */
    fun removePaymentMethod(id: UUID, memberId: UUID) {
        val paymentMethod = getPaymentMethod(id, memberId)

        // If this was the default, we need to handle that
        val wasDefault = paymentMethod.isDefault

        paymentMethod.deactivate()
        repository.save(paymentMethod)

        // If this was default, set another as default
        if (wasDefault) {
            val remainingMethods = repository.findActiveByMemberId(memberId)
            if (remainingMethods.isNotEmpty()) {
                remainingMethods.first().setAsDefault()
                repository.save(remainingMethods.first())
                logger.info("Set ${remainingMethods.first().id} as new default after removing $id")
            }
        }

        logger.info("Removed payment method $id for member $memberId")
    }

    /**
     * Check if a member has any saved payment methods.
     */
    @Transactional(readOnly = true)
    fun hasSavedPaymentMethods(memberId: UUID): Boolean {
        return repository.countActiveByMemberId(memberId) > 0
    }
}
