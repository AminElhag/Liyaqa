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
    fun findIssuedInvoicesDueOn(dueDate: LocalDate, pageable: Pageable): Page<Invoice>

    // Subscription queries (returns most recent invoice for subscription)
    fun findFirstBySubscriptionIdOrderByCreatedAtDesc(subscriptionId: UUID): Optional<Invoice>
    fun findBySubscriptionIdAndStatusIn(subscriptionId: UUID, statuses: List<InvoiceStatus>): List<Invoice>

    // Organization-level queries
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<Invoice>

    // Count queries
    fun count(): Long
    fun countByStatus(status: InvoiceStatus): Long
    fun countByMemberId(memberId: UUID): Long

    // Revenue queries
    fun sumPaidAmountBetween(startDate: LocalDate, endDate: LocalDate): Long

    // Delete
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)

    /**
     * Search invoices with various filters.
     * @param search Search term for invoice number (partial match)
     * @param status Filter by invoice status
     * @param memberId Filter by member
     * @param dateFrom Filter invoices created on or after this date
     * @param dateTo Filter invoices created on or before this date
     */
    fun search(
        search: String?,
        status: InvoiceStatus?,
        memberId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<Invoice>

    // ==================== Saudi Payment Methods ====================

    /**
     * Find invoice by STC Pay transaction ID.
     */
    fun findByStcpayTransactionId(transactionId: String): Invoice?

    /**
     * Find invoice by SADAD bill number.
     */
    fun findBySadadBillNumber(billNumber: String): Invoice?

    /**
     * Find invoice by Tamara order ID.
     */
    fun findByTamaraOrderId(orderId: String): Invoice?

    // ==================== LTV Analysis ====================

    /**
     * Get member LTV data for reporting.
     * Returns a list of maps containing:
     * - memberId: UUID
     * - memberName: String
     * - totalRevenue: BigDecimal
     * - lifespanMonths: Int
     * - transactionCount: Int
     */
    fun getMemberLtvData(asOfDate: LocalDate): List<Map<String, Any>>
}
