package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "payment_records")
class PaymentRecord(
    id: UUID = UUID.randomUUID(),

    @Column(name = "invoice_id", nullable = false)
    val invoiceId: UUID,

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    val amount: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    val method: PaymentMethod,

    @Column(name = "reference_number")
    val referenceNumber: String? = null,

    @Column(name = "processed_at", nullable = false)
    val processedAt: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    val status: PaymentStatus = PaymentStatus.SUCCESS

) : OrganizationLevelEntity(id) {

    companion object {
        fun create(
            invoiceId: UUID,
            tenantId: UUID,
            amount: BigDecimal,
            method: PaymentMethod,
            referenceNumber: String? = null
        ): PaymentRecord = PaymentRecord(
            invoiceId = invoiceId,
            tenantId = tenantId,
            amount = amount,
            method = method,
            referenceNumber = referenceNumber
        )
    }
}
