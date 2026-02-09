package com.liyaqa.platform.subscription.repository

import com.liyaqa.platform.subscription.model.PaymentRecord
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataPaymentRecordRepository : JpaRepository<PaymentRecord, UUID> {
    fun findByInvoiceId(invoiceId: UUID): List<PaymentRecord>
    fun findByTenantId(tenantId: UUID): List<PaymentRecord>
}

@Repository
class JpaPaymentRecordRepository(
    private val springDataRepository: SpringDataPaymentRecordRepository
) : PaymentRecordRepository {

    override fun save(record: PaymentRecord): PaymentRecord =
        springDataRepository.save(record)

    override fun findByInvoiceId(invoiceId: UUID): List<PaymentRecord> =
        springDataRepository.findByInvoiceId(invoiceId)

    override fun findByTenantId(tenantId: UUID): List<PaymentRecord> =
        springDataRepository.findByTenantId(tenantId)
}
