package com.liyaqa.membership.domain.model

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
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "agreements")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Agreement(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "title_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "title_ar"))
    )
    var title: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "content_en", columnDefinition = "TEXT", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "content_ar", columnDefinition = "TEXT"))
    )
    var content: LocalizedText,

    @Column(name = "agreement_type", nullable = false)
    @Enumerated(EnumType.STRING)
    var type: AgreementType,

    @Column(name = "is_mandatory", nullable = false)
    var isMandatory: Boolean = true,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "agreement_version", nullable = false)
    var agreementVersion: Int = 1,

    @Column(name = "effective_date")
    var effectiveDate: LocalDate = LocalDate.now(),

    @Column(name = "sort_order")
    var sortOrder: Int = 0,

    @Column(name = "has_health_questions")
    var hasHealthQuestions: Boolean = false

) : BaseEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    fun incrementVersion() {
        agreementVersion++
    }
}

enum class AgreementType {
    LIABILITY_WAIVER,
    TERMS_CONDITIONS,
    HEALTH_DISCLOSURE,
    PRIVACY_POLICY,
    PHOTO_CONSENT,
    MARKETING_CONSENT,
    RULES_REGULATIONS,
    CUSTOM
}
