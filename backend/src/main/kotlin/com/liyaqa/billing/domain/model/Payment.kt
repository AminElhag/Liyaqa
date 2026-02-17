package com.liyaqa.billing.domain.model

import com.liyaqa.shared.domain.Money
import com.liyaqa.shared.domain.OrganizationAwareEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.time.LocalDateTime
import java.util.UUID

/**
 * Represents a single payment recorded against an invoice.
 * Supports multi-payment scenarios (partial payments, split payments).
 */
@Entity
@Table(name = "invoice_payments")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Payment(
    id: UUID = UUID.randomUUID(),

    @Column(name = "invoice_id", nullable = false)
    val invoiceId: UUID,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "currency", nullable = false))
    )
    val amount: Money,

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    val paymentMethod: PaymentMethod,

    @Column(name = "payment_reference")
    val paymentReference: String? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    val notes: String? = null,

    @Column(name = "paid_at", nullable = false)
    val paidAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "created_by")
    val createdBy: UUID? = null,

    @Column(name = "gateway_transaction_id")
    val gatewayTransactionId: String? = null

) : OrganizationAwareEntity(id)
