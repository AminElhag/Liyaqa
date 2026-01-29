package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.UUID

/**
 * Represents a class pack that members can purchase.
 * A class pack provides a set number of class credits that can be used to book classes.
 * Packs can have restrictions on which classes they're valid for and expiration periods.
 */
@Entity
@Table(name = "class_packs")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ClassPack(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Number of class credits in this pack.
     */
    @Column(name = "class_count", nullable = false)
    var classCount: Int,

    /**
     * Price of the pack.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "price_currency", nullable = false))
    )
    var price: Money,

    /**
     * Tax rate percentage (e.g., 15.00 for 15% VAT).
     */
    @Column(name = "tax_rate", nullable = false)
    var taxRate: BigDecimal = BigDecimal("15.00"),

    /**
     * Number of days the pack is valid after purchase.
     * Null means the pack never expires.
     */
    @Column(name = "validity_days")
    var validityDays: Int? = null,

    /**
     * Comma-separated list of ClassType values this pack is valid for.
     * Null means valid for all class types.
     */
    @Column(name = "valid_class_types")
    var validClassTypes: String? = null,

    /**
     * Comma-separated list of specific class IDs this pack is valid for.
     * Null means valid for all classes.
     */
    @Column(name = "valid_class_ids", columnDefinition = "TEXT")
    var validClassIds: String? = null,

    /**
     * Status of the pack (ACTIVE/INACTIVE).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ClassPackStatus = ClassPackStatus.ACTIVE,

    /**
     * Sort order for display.
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    /**
     * Image URL for the pack.
     */
    @Column(name = "image_url")
    var imageUrl: String? = null

) : BaseEntity(id) {

    /**
     * Checks if this pack is active and available for purchase.
     */
    fun isActive(): Boolean = status == ClassPackStatus.ACTIVE

    /**
     * Activates the pack for purchase.
     */
    fun activate() {
        status = ClassPackStatus.ACTIVE
    }

    /**
     * Deactivates the pack (no longer available for purchase).
     */
    fun deactivate() {
        status = ClassPackStatus.INACTIVE
    }

    /**
     * Gets the price with tax included.
     */
    fun getPriceWithTax(): Money {
        val taxAmount = price.amount.multiply(taxRate).divide(BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP)
        return Money(price.amount.add(taxAmount), price.currency)
    }

    /**
     * Gets the list of valid class types, or empty list if all types are valid.
     */
    fun getValidClassTypesList(): List<ClassType> {
        return validClassTypes?.split(",")
            ?.mapNotNull { type ->
                try {
                    ClassType.valueOf(type.trim())
                } catch (e: IllegalArgumentException) {
                    null
                }
            } ?: emptyList()
    }

    /**
     * Gets the list of valid class IDs, or empty list if all classes are valid.
     */
    fun getValidClassIdsList(): List<UUID> {
        return validClassIds?.split(",")
            ?.mapNotNull { id ->
                try {
                    UUID.fromString(id.trim())
                } catch (e: IllegalArgumentException) {
                    null
                }
            } ?: emptyList()
    }

    /**
     * Checks if this pack is valid for a specific class.
     */
    fun isValidForClass(gymClass: GymClass): Boolean {
        // Check class type restriction
        val validTypes = getValidClassTypesList()
        if (validTypes.isNotEmpty() && gymClass.classType !in validTypes) {
            return false
        }

        // Check specific class ID restriction
        val validIds = getValidClassIdsList()
        if (validIds.isNotEmpty() && gymClass.id !in validIds) {
            return false
        }

        return true
    }

    /**
     * Sets valid class types from a list.
     */
    fun setValidClassTypesList(types: List<ClassType>?) {
        validClassTypes = types?.takeIf { it.isNotEmpty() }?.joinToString(",") { it.name }
    }

    /**
     * Sets valid class IDs from a list.
     */
    fun setValidClassIdsList(ids: List<UUID>?) {
        validClassIds = ids?.takeIf { it.isNotEmpty() }?.joinToString(",") { it.toString() }
    }
}
