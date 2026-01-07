package com.liyaqa.billing.domain.ports

import com.liyaqa.billing.domain.model.Invoice
import com.liyaqa.billing.domain.model.InvoiceStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for Invoice entity.
 * Invoices support both tenant-level and organization-level queries.
 */
interface InvoiceRepository {
    fun save(invoice: Invoice): Invoice
    fun findById(id: UUID): Optional<Invoice>
    fun findByInvoiceNumber(invoiceNumber: String): Optional<Invoice>
    fun findAll(pageable: Pageable): Page<Invoice>

    // Member-specific queries
    fun findByMemberId(memberId: UUID, pageable: Pageable): Page<Invoice>
    fun findByMemberIdAndStatus(memberId: UUID, status: InvoiceStatus, pageable: Pageable): Page<Invoice>

    // Status queries
    fun findByStatus(status: InvoiceStatus, pageable: Pageable): Page<Invoice>
    fun findOverdueInvoices(pageable: Pageable): Page<Invoice>
    fun findIssuedInvoicesPastDueDate(currentDate: LocalDate, pageable: Pageable): Page<Invoice>

    // Subscription queries
    fun findBySubscriptionId(subscriptionId: UUID): Optional<Invoice>

    // Organization-level queries
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice>

    // Count queries
    fun count(): Long
    fun countByStatus(status: InvoiceStatus): Long
    fun countByMemberId(memberId: UUID): Long

    // Delete
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)
}
