package com.liyaqa.platform.domain.ports

import com.liyaqa.platform.domain.model.ClientInvoice
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

/**
 * Repository port for ClientInvoice entity.
 * ClientInvoices are platform-level (not tenant-scoped) and represent
 * B2B billing for client organizations.
 */
interface ClientInvoiceRepository {
    fun save(invoice: ClientInvoice): ClientInvoice
    fun findById(id: UUID): Optional<ClientInvoice>
    fun findByInvoiceNumber(invoiceNumber: String): Optional<ClientInvoice>
    fun findAll(pageable: Pageable): Page<ClientInvoice>

    // Organization queries
    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientInvoice>

    // Subscription queries
    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<ClientInvoice>
    fun findBySubscriptionIdAndBillingPeriod(
        subscriptionId: UUID,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate
    ): Optional<ClientInvoice>

    // Status queries
    fun findByStatus(status: ClientInvoiceStatus, pageable: Pageable): Page<ClientInvoice>
    fun findOverdueInvoices(pageable: Pageable): Page<ClientInvoice>
    fun findIssuedInvoicesPastDueDate(currentDate: LocalDate): List<ClientInvoice>

    // Search with filters
    fun search(
        search: String?,
        status: ClientInvoiceStatus?,
        organizationId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<ClientInvoice>

    // Count queries
    fun count(): Long
    fun countByStatus(status: ClientInvoiceStatus): Long
    fun countByOrganizationId(organizationId: UUID): Long

    // Existence and delete
    fun existsById(id: UUID): Boolean
    fun deleteById(id: UUID)

    // Aggregation queries for dashboard performance
    fun getTotalPaidRevenue(): BigDecimal
    fun getRevenueByDateRange(startDate: LocalDate, endDate: LocalDate): BigDecimal
    fun getRevenueByMonth(month: Int, year: Int): BigDecimal
    fun getInvoiceCountByMonth(month: Int, year: Int): Long
    fun getTotalOutstandingAmount(): BigDecimal
    fun getTotalOverdueAmount(): BigDecimal
    fun getRevenueByOrganization(): Map<UUID, BigDecimal>
    fun getInvoiceCountByOrganization(): Map<UUID, Long>
}
