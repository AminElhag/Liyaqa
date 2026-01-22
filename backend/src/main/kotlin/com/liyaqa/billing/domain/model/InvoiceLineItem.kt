package com.liyaqa.billing.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Embedded
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Represents a single line item on an invoice.
 * Embeddable entity that is stored as part of the Invoice.
 * Supports per-item tax rates for multi-fee invoicing.
 */
@Embeddable
data class InvoiceLineItem(
    @Column(name = "line_item_id", nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "line_description_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "line_description_ar"))
    )
    val description: LocalizedText,

    @Column(name = "line_quantity", nullable = false)
    val quantity: Int = 1,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "line_unit_price", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "line_unit_currency", nullable = false))
    )
    val unitPrice: Money,

    @Enumerated(EnumType.STRING)
    @Column(name = "line_item_type", nullable = false)
    val itemType: LineItemType = LineItemType.OTHER,

    @Column(name = "line_sort_order", nullable = false)
    val sortOrder: Int = 0,

    /**
     * Per-item tax rate as a percentage (e.g., 15.00 for 15%).
     * Defaults to 15% (Saudi Arabia VAT rate).
     */
    @Column(name = "line_tax_rate", nullable = false)
    val taxRate: BigDecimal = BigDecimal("15.00")
) {
    /**
     * Calculates the line total before tax (quantity * unit price).
     */
    fun lineTotal(): Money {
        return unitPrice * quantity
    }

    /**
     * Calculates the tax amount for this line item.
     */
    fun lineTaxAmount(): Money {
        val total = lineTotal()
        val taxAmount = total.amount.multiply(taxRate).divide(BigDecimal("100"), 2, RoundingMode.HALF_UP)
        return Money.of(taxAmount, total.currency)
    }

    /**
     * Calculates the gross total including tax.
     */
    fun lineGrossTotal(): Money {
        return lineTotal() + lineTaxAmount()
    }
}
