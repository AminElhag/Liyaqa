package com.liyaqa.platform.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

/**
 * Sequence generator for client invoice numbers.
 * Uses a singleton pattern (one global sequence for all client invoices).
 *
 * Invoice number format: CINV-{YEAR}-{SEQUENCE}
 * Example: CINV-2026-00001
 */
@Entity
@Table(name = "client_invoice_sequences")
class ClientInvoiceSequence(
    /**
     * Singleton ID for the platform invoice sequence.
     */
    @Id
    @Column(name = "id", nullable = false)
    val id: UUID = SINGLETON_ID,

    /**
     * Year for sequence tracking (resets yearly).
     */
    @Column(name = "current_year", nullable = false)
    var currentYear: Int,

    /**
     * Current sequence number.
     */
    @Column(name = "current_sequence", nullable = false)
    var currentSequence: Long = 0
) {
    /**
     * Gets the next invoice number and increments the sequence.
     * Resets sequence if the year has changed.
     *
     * @param year The year for the invoice
     * @return The formatted invoice number (e.g., CINV-2026-00001)
     */
    fun getNextInvoiceNumber(year: Int): String {
        if (year != currentYear) {
            currentYear = year
            currentSequence = 0
        }
        currentSequence++
        return "CINV-$currentYear-${currentSequence.toString().padStart(5, '0')}"
    }

    companion object {
        /**
         * Well-known UUID for the singleton sequence record.
         */
        val SINGLETON_ID: UUID = UUID.fromString("00000000-0000-0000-0000-000000000002")
    }
}
