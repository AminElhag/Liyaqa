package com.liyaqa.churn.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.*

@Entity
@Table(name = "intervention_templates")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class InterventionTemplate(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "name_ar", length = 100)
    var nameAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "intervention_type", nullable = false, length = 50)
    val interventionType: InterventionType,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "message_template", columnDefinition = "TEXT")
    var messageTemplate: String? = null,

    @Column(name = "message_template_ar", columnDefinition = "TEXT")
    var messageTemplateAr: String? = null,

    @Column(name = "offer_details", columnDefinition = "JSONB")
    var offerDetails: String? = null,

    @Column(name = "target_risk_levels", columnDefinition = "JSONB")
    var targetRiskLevels: String? = null, // ["HIGH", "CRITICAL"]

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
) : BaseEntity(id) {

    fun update(
        name: String,
        nameAr: String?,
        description: String?,
        descriptionAr: String?,
        messageTemplate: String?,
        messageTemplateAr: String?
    ) {
        this.name = name
        this.nameAr = nameAr
        this.description = description
        this.descriptionAr = descriptionAr
        this.messageTemplate = messageTemplate
        this.messageTemplateAr = messageTemplateAr
    }

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }
}
