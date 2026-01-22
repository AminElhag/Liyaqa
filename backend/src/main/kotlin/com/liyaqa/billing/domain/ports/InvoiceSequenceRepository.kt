package com.liyaqa.billing.domain.ports

import com.liyaqa.billing.domain.model.InvoiceSequence
import java.util.Optional
import java.util.UUID

/**
 * Repository port for InvoiceSequence entity.
 * Manages invoice number sequences per organization.
 */
interface InvoiceSequenceRepository {
    fun save(sequence: InvoiceSequence): InvoiceSequence
    fun findByOrganizationId(organizationId: UUID): Optional<InvoiceSequence>
    fun existsByOrganizationId(organizationId: UUID): Boolean

    /**
     * Finds sequence by organization ID with pessimistic write lock.
     * Use this method when generating invoice numbers to prevent race conditions.
     */
    fun findByOrganizationIdForUpdate(organizationId: UUID): Optional<InvoiceSequence>
}
