package com.liyaqa.platform.infrastructure.persistence

import com.liyaqa.platform.domain.model.ClientInvoice
import com.liyaqa.platform.domain.model.ClientInvoiceStatus
import com.liyaqa.platform.domain.ports.ClientInvoiceRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataClientInvoiceRepository : JpaRepository<ClientInvoice, UUID> {

    fun findByInvoiceNumber(invoiceNumber: String): Optional<ClientInvoice>

    fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientInvoice>

    fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<ClientInvoice>

    @Query("""
        SELECT ci FROM ClientInvoice ci
        WHERE ci.subscriptionId = :subscriptionId
        AND ci.billingPeriodStart = :billingPeriodStart
        AND ci.billingPeriodEnd = :billingPeriodEnd
    """)
    fun findBySubscriptionIdAndBillingPeriod(
        @Param("subscriptionId") subscriptionId: UUID,
        @Param("billingPeriodStart") billingPeriodStart: LocalDate,
        @Param("billingPeriodEnd") billingPeriodEnd: LocalDate
    ): Optional<ClientInvoice>

    fun findByStatus(status: ClientInvoiceStatus, pageable: Pageable): Page<ClientInvoice>

    @Query("""
        SELECT ci FROM ClientInvoice ci
        WHERE ci.status = 'OVERDUE'
        OR (ci.status = 'ISSUED' AND ci.dueDate < CURRENT_DATE)
    """)
    fun findOverdueInvoices(pageable: Pageable): Page<ClientInvoice>

    @Query("""
        SELECT ci FROM ClientInvoice ci
        WHERE ci.status = 'ISSUED'
        AND ci.dueDate < :currentDate
    """)
    fun findIssuedInvoicesPastDueDate(@Param("currentDate") currentDate: LocalDate): List<ClientInvoice>

    @Query("""
        SELECT ci FROM ClientInvoice ci
        WHERE (:search IS NULL OR ci.invoiceNumber LIKE %:search%)
        AND (:status IS NULL OR ci.status = :status)
        AND (:organizationId IS NULL OR ci.organizationId = :organizationId)
        AND (:dateFrom IS NULL OR ci.issueDate >= :dateFrom)
        AND (:dateTo IS NULL OR ci.issueDate <= :dateTo)
    """)
    fun search(
        @Param("search") search: String?,
        @Param("status") status: ClientInvoiceStatus?,
        @Param("organizationId") organizationId: UUID?,
        @Param("dateFrom") dateFrom: LocalDate?,
        @Param("dateTo") dateTo: LocalDate?,
        pageable: Pageable
    ): Page<ClientInvoice>

    fun countByStatus(status: ClientInvoiceStatus): Long

    fun countByOrganizationId(organizationId: UUID): Long

    // Aggregation queries for dashboard performance
    @Query("""
        SELECT COALESCE(SUM(ci.paidAmount.amount), 0)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
    """)
    fun getTotalPaidRevenue(): java.math.BigDecimal

    @Query("""
        SELECT COALESCE(SUM(ci.paidAmount.amount), 0)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
        AND ci.paidDate >= :startDate
        AND ci.paidDate <= :endDate
    """)
    fun getRevenueByDateRange(
        @Param("startDate") startDate: LocalDate,
        @Param("endDate") endDate: LocalDate
    ): java.math.BigDecimal

    @Query("""
        SELECT COALESCE(SUM(ci.paidAmount.amount), 0)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
        AND ci.paidDate IS NOT NULL
        AND ci.paidDate >= :startOfMonth
        AND ci.paidDate < :startOfNextMonth
    """)
    fun getRevenueByMonth(
        @Param("startOfMonth") startOfMonth: LocalDate,
        @Param("startOfNextMonth") startOfNextMonth: LocalDate
    ): java.math.BigDecimal

    @Query("""
        SELECT COUNT(ci)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
        AND ci.paidDate IS NOT NULL
        AND ci.paidDate >= :startOfMonth
        AND ci.paidDate < :startOfNextMonth
    """)
    fun getInvoiceCountByMonth(
        @Param("startOfMonth") startOfMonth: LocalDate,
        @Param("startOfNextMonth") startOfNextMonth: LocalDate
    ): Long

    @Query("""
        SELECT COALESCE(SUM(ci.totalAmount.amount - COALESCE(ci.paidAmount.amount, 0)), 0)
        FROM ClientInvoice ci
        WHERE ci.status IN ('ISSUED', 'PARTIALLY_PAID')
    """)
    fun getTotalOutstandingAmount(): java.math.BigDecimal

    @Query("""
        SELECT COALESCE(SUM(ci.totalAmount.amount - COALESCE(ci.paidAmount.amount, 0)), 0)
        FROM ClientInvoice ci
        WHERE ci.status = 'OVERDUE'
    """)
    fun getTotalOverdueAmount(): java.math.BigDecimal

    @Query("""
        SELECT ci.organizationId, COALESCE(SUM(ci.paidAmount.amount), 0)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
        GROUP BY ci.organizationId
    """)
    fun getRevenueByOrganizationList(): List<Array<Any>>

    @Query("""
        SELECT ci.organizationId, COUNT(ci)
        FROM ClientInvoice ci
        WHERE ci.status = 'PAID'
        GROUP BY ci.organizationId
    """)
    fun getInvoiceCountByOrganizationList(): List<Array<Any>>
}

@Repository
class JpaClientInvoiceRepository(
    private val springDataRepository: SpringDataClientInvoiceRepository
) : ClientInvoiceRepository {

    override fun save(invoice: ClientInvoice): ClientInvoice =
        springDataRepository.save(invoice)

    override fun findById(id: UUID): Optional<ClientInvoice> =
        springDataRepository.findById(id)

    override fun findByInvoiceNumber(invoiceNumber: String): Optional<ClientInvoice> =
        springDataRepository.findByInvoiceNumber(invoiceNumber)

    override fun findAll(pageable: Pageable): Page<ClientInvoice> =
        springDataRepository.findAll(pageable)

    override fun findByOrganizationId(organizationId: UUID, pageable: Pageable): Page<ClientInvoice> =
        springDataRepository.findByOrganizationId(organizationId, pageable)

    override fun findBySubscriptionId(subscriptionId: UUID, pageable: Pageable): Page<ClientInvoice> =
        springDataRepository.findBySubscriptionId(subscriptionId, pageable)

    override fun findBySubscriptionIdAndBillingPeriod(
        subscriptionId: UUID,
        billingPeriodStart: LocalDate,
        billingPeriodEnd: LocalDate
    ): Optional<ClientInvoice> =
        springDataRepository.findBySubscriptionIdAndBillingPeriod(subscriptionId, billingPeriodStart, billingPeriodEnd)

    override fun findByStatus(status: ClientInvoiceStatus, pageable: Pageable): Page<ClientInvoice> =
        springDataRepository.findByStatus(status, pageable)

    override fun findOverdueInvoices(pageable: Pageable): Page<ClientInvoice> =
        springDataRepository.findOverdueInvoices(pageable)

    override fun findIssuedInvoicesPastDueDate(currentDate: LocalDate): List<ClientInvoice> =
        springDataRepository.findIssuedInvoicesPastDueDate(currentDate)

    override fun search(
        search: String?,
        status: ClientInvoiceStatus?,
        organizationId: UUID?,
        dateFrom: LocalDate?,
        dateTo: LocalDate?,
        pageable: Pageable
    ): Page<ClientInvoice> =
        springDataRepository.search(search, status, organizationId, dateFrom, dateTo, pageable)

    override fun count(): Long =
        springDataRepository.count()

    override fun countByStatus(status: ClientInvoiceStatus): Long =
        springDataRepository.countByStatus(status)

    override fun countByOrganizationId(organizationId: UUID): Long =
        springDataRepository.countByOrganizationId(organizationId)

    override fun existsById(id: UUID): Boolean =
        springDataRepository.existsById(id)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    // Aggregation queries implementations
    override fun getTotalPaidRevenue(): BigDecimal =
        springDataRepository.getTotalPaidRevenue()

    override fun getRevenueByDateRange(startDate: LocalDate, endDate: LocalDate): BigDecimal =
        springDataRepository.getRevenueByDateRange(startDate, endDate)

    override fun getRevenueByMonth(startOfMonth: LocalDate, startOfNextMonth: LocalDate): BigDecimal =
        springDataRepository.getRevenueByMonth(startOfMonth, startOfNextMonth)

    override fun getInvoiceCountByMonth(startOfMonth: LocalDate, startOfNextMonth: LocalDate): Long =
        springDataRepository.getInvoiceCountByMonth(startOfMonth, startOfNextMonth)

    override fun getTotalOutstandingAmount(): BigDecimal =
        springDataRepository.getTotalOutstandingAmount()

    override fun getTotalOverdueAmount(): BigDecimal =
        springDataRepository.getTotalOverdueAmount()

    override fun getRevenueByOrganization(): Map<UUID, BigDecimal> {
        return springDataRepository.getRevenueByOrganizationList()
            .associate { row ->
                (row[0] as UUID) to (row[1] as BigDecimal)
            }
    }

    override fun getInvoiceCountByOrganization(): Map<UUID, Long> {
        return springDataRepository.getInvoiceCountByOrganizationList()
            .associate { row ->
                (row[0] as UUID) to (row[1] as Long)
            }
    }
}
