package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.PaymentRecord
import java.util.UUID

interface PaymentRecordRepository {
    fun save(record: PaymentRecord): PaymentRecord
    fun findByInvoiceId(invoiceId: UUID): List<PaymentRecord>
    fun findByTenantId(tenantId: UUID): List<PaymentRecord>
}
