package com.liyaqa.scheduling.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.util.UUID

/**
 * Per-category credit distribution within a class pack.
 * E.g., a 10-class pack might allocate 5 Yoga + 3 Pilates + 2 Swimming.
 */
@Entity
@Table(name = "class_pack_category_allocations")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ClassPackCategoryAllocation(
    id: UUID = UUID.randomUUID(),

    @Column(name = "class_pack_id", nullable = false)
    val classPackId: UUID,

    @Column(name = "category_id", nullable = false)
    val categoryId: UUID,

    @Column(name = "credit_count", nullable = false)
    var creditCount: Int

) : BaseEntity(id) {

    init {
        require(creditCount >= 1) { "Credit count must be at least 1" }
    }
}
