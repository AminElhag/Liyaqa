package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.Money
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

@Entity
@Table(name = "freeze_packages")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FreezePackage(
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

    @Column(name = "freeze_days", nullable = false)
    var freezeDays: Int,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "amount", column = Column(name = "price_amount", nullable = false)),
        AttributeOverride(name = "currency", column = Column(name = "price_currency"))
    )
    var price: Money,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "sort_order")
    var sortOrder: Int = 0,

    @Column(name = "extends_contract", nullable = false)
    var extendsContract: Boolean = true,

    @Column(name = "requires_documentation")
    var requiresDocumentation: Boolean = false

) : BaseEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }
}
