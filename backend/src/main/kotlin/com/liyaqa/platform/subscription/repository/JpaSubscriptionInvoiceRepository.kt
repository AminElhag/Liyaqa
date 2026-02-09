package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SpringDataSubscriptionInvoiceRepository : JpaRepository<Invoice, UUID> {
    fun findByTenantId(tenantId: UUID): List<Invoice>
    fun findBySubscriptionId(subscriptionId: UUID): List<Invoice>
    fun findByStatus(status: InvoiceStatus): List<Invoice>
    fun findByStatusAndDueDateBefore(status: InvoiceStatus, date: LocalDate): List<Invoice>
    fun findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(tenantId: UUID, start: LocalDate, end: LocalDate): Optional<Invoice>
    fun findByStatusIn(statuses: List<InvoiceStatus>): List<Invoice>

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM SubscriptionInvoice i WHERE i.status = :status AND i.issuedAt BETWEEN :from AND :to")
    fun sumTotalByStatusAndIssuedAtBetween(
        @Param("status") status: InvoiceStatus,
        @Param("from") from: LocalDate,
        @Param("to") to: LocalDate
    ): BigDecimal
}

@Repository
class JpaSubscriptionInvoiceRepository(
    private val springDataRepository: SpringDataSubscriptionInvoiceRepository
) : SubscriptionInvoiceRepository {

    override fun save(invoice: Invoice): Invoice =
        springDataRepository.save(invoice)

    override fun findById(id: UUID): Optional<Invoice> =
        springDataRepository.findById(id)

    override fun findByTenantId(tenantId: UUID): List<Invoice> =
        springDataRepository.findByTenantId(tenantId)

    override fun findBySubscriptionId(subscriptionId: UUID): List<Invoice> =
        springDataRepository.findBySubscriptionId(subscriptionId)

    override fun findByStatus(status: InvoiceStatus): List<Invoice> =
        springDataRepository.findByStatus(status)

    override fun findByStatusAndDueDateBefore(status: InvoiceStatus, date: LocalDate): List<Invoice> =
        springDataRepository.findByStatusAndDueDateBefore(status, date)

    override fun findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(tenantId: UUID, start: LocalDate, end: LocalDate): Optional<Invoice> =
        springDataRepository.findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(tenantId, start, end)

    override fun sumTotalByStatusAndIssuedAtBetween(status: InvoiceStatus, from: LocalDate, to: LocalDate): BigDecimal =
        springDataRepository.sumTotalByStatusAndIssuedAtBetween(status, from, to)

    override fun findByStatusIn(statuses: List<InvoiceStatus>): List<Invoice> =
        springDataRepository.findByStatusIn(statuses)
}
