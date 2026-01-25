package com.liyaqa.voucher.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

/**
 * Records a single usage of a voucher.
 */
@Entity
@Table(name = "voucher_usages")
class VoucherUsage(
    @Column(name = "voucher_id", nullable = false)
    val voucherId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "used_for_type", nullable = false, length = 50)
    val usedForType: UsageType,

    @Column(name = "used_for_id")
    val usedForId: UUID? = null,

    @Column(name = "discount_applied", precision = 10, scale = 2)
    val discountApplied: BigDecimal? = null,

    @Column(name = "discount_currency", length = 3)
    val discountCurrency: String = "SAR",

    @Column(name = "invoice_id")
    val invoiceId: UUID? = null,

    @Column(name = "used_at", nullable = false)
    val usedAt: Instant = Instant.now(),

    id: UUID = UUID.randomUUID()
) : BaseEntity(id)
