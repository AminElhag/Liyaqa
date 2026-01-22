package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientInvoiceSequence
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientInvoiceSequence entity.
 * Used to generate unique invoice numbers for client invoices.
 */
interface ClientInvoiceSequenceRepository {
    fun save(sequence: ClientInvoiceSequence): ClientInvoiceSequence
    fun findById(id: UUID): Optional<ClientInvoiceSequence>

    /**
     * Finds the sequence with a pessimistic write lock for thread-safe updates.
     */
    fun findForUpdate(): Optional<ClientInvoiceSequence>
}
