package com.liyaqa.shop.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
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
import java.util.UUID

/**
 * Entity representing a product category for organizing products.
 * Categories are organized by department and can have custom department names.
 */
@Entity
@Table(name = "product_categories")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ProductCategory(
    id: UUID = UUID.randomUUID(),

    /**
     * Bilingual name of the category.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    /**
     * Optional bilingual description.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    /**
     * Icon name for UI display (e.g., "coffee", "dumbbell", "shirt").
     * Uses Lucide icon names.
     */
    @Column(name = "icon", length = 50)
    var icon: String? = null,

    /**
     * Department this category belongs to.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "department", nullable = false)
    var department: Department = Department.OTHER,

    /**
     * Custom department name when department is OTHER.
     * Allows admins to create custom departments.
     */
    @Column(name = "custom_department", length = 100)
    var customDepartment: String? = null,

    /**
     * Display order for sorting categories.
     */
    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    /**
     * Whether this category is active and visible.
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    /**
     * Activate this category.
     */
    fun activate() {
        isActive = true
    }

    /**
     * Deactivate this category.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Get the effective department name.
     * Returns custom department if department is OTHER and custom is set.
     */
    fun getEffectiveDepartment(): String {
        return if (department == Department.OTHER && !customDepartment.isNullOrBlank()) {
            customDepartment!!
        } else {
            department.name
        }
    }

    /**
     * Update category details.
     */
    fun update(
        name: LocalizedText? = null,
        description: LocalizedText? = null,
        icon: String? = null,
        department: Department? = null,
        customDepartment: String? = null,
        sortOrder: Int? = null
    ) {
        name?.let { this.name = it }
        description?.let { this.description = it }
        icon?.let { this.icon = it }
        department?.let { this.department = it }
        customDepartment?.let { this.customDepartment = it }
        sortOrder?.let { this.sortOrder = it }
    }
}
