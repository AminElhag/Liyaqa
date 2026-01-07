package com.liyaqa.billing.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

/**
 * Tracks invoice number sequence per organization.
 * Used to generate unique invoice numbers in format: INV-YYYY-NNNNN
 */
@Entity
@Table(name = "invoice_sequences")
class InvoiceSequence(
    @Id
    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @Column(name = "current_year", nullable = false)
    var currentYear: Int,

    @Column(name = "current_sequence", nullable = false)
    var currentSequence: Long = 0
) {
    /**
     * Gets the next invoice number and increments the sequence.
     * Resets sequence if year has changed.
     */
    fun getNextInvoiceNumber(year: Int): String {
        if (year != currentYear) {
            currentYear = year
            currentSequence = 0
        }
        currentSequence++
        return "INV-$currentYear-${currentSequence.toString().padStart(5, '0')}"
    }
}
