package com.liyaqa.billing.domain.ports

import com.liyaqa.billing.domain.model.SavedPaymentMethod
import java.util.Optional
import java.util.UUID

/**
 * Port (interface) for saved payment method persistence operations.
 * This is a domain-level abstraction - implementations are in the infrastructure layer.
 */
interface SavedPaymentMethodRepository {
    fun save(paymentMethod: SavedPaymentMethod): SavedPaymentMethod
    fun findById(id: UUID): Optional<SavedPaymentMethod>
    fun findByMemberId(memberId: UUID): List<SavedPaymentMethod>
    fun findActiveByMemberId(memberId: UUID): List<SavedPaymentMethod>
    fun findDefaultByMemberId(memberId: UUID): Optional<SavedPaymentMethod>
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)

    /**
     * Find a payment method by ID and member ID (for ownership verification)
     */
    fun findByIdAndMemberId(id: UUID, memberId: UUID): Optional<SavedPaymentMethod>

    /**
     * Clear the default flag for all payment methods of a member
     */
    fun clearDefaultForMember(memberId: UUID)

    /**
     * Count active payment methods for a member
     */
    fun countActiveByMemberId(memberId: UUID): Long
}
