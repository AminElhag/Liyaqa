package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.Invoice
import com.liyaqa.platform.subscription.model.InvoiceStatus
import java.math.BigDecimal
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface SubscriptionInvoiceRepository {
    fun save(invoice: Invoice): Invoice
    fun findById(id: UUID): Optional<Invoice>
    fun findByTenantId(tenantId: UUID): List<Invoice>
    fun findBySubscriptionId(subscriptionId: UUID): List<Invoice>
    fun findByStatus(status: InvoiceStatus): List<Invoice>
    fun findByStatusAndDueDateBefore(status: InvoiceStatus, date: LocalDate): List<Invoice>
    fun findByTenantIdAndBillingPeriodStartAndBillingPeriodEnd(tenantId: UUID, start: LocalDate, end: LocalDate): Optional<Invoice>
    fun sumTotalByStatusAndIssuedAtBetween(status: InvoiceStatus, from: LocalDate, to: LocalDate): BigDecimal
    fun findByStatusIn(statuses: List<InvoiceStatus>): List<Invoice>
}
