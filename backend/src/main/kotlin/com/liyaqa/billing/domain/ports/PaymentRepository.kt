package com.liyaqa.billing.domain.ports

import com.liyaqa.billing.domain.model.Payment
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PaymentRepository : JpaRepository<Payment, UUID> {

    fun findByInvoiceId(invoiceId: UUID): List<Payment>

    fun findByInvoiceIdOrderByPaidAtDesc(invoiceId: UUID): List<Payment>
}
