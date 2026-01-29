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
import java.math.BigDecimal
import java.util.UUID

/**
 * Membership category defines the type of membership (individual, family, corporate, etc.)
 * with associated eligibility rules and default discounts.
 */
@Entity
@Table(name = "membership_categories")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MembershipCategory(
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

    @Enumerated(EnumType.STRING)
    @Column(name = "category_type", nullable = false)
    var categoryType: MembershipCategoryType,

    @Column(name = "minimum_age")
    var minimumAge: Int? = null,

    @Column(name = "maximum_age")
    var maximumAge: Int? = null,

    @Column(name = "requires_verification", nullable = false)
    var requiresVerification: Boolean = false,

    @Column(name = "verification_document_type")
    var verificationDocumentType: String? = null,

    @Column(name = "max_family_members")
    var maxFamilyMembers: Int? = null,

    @Column(name = "default_discount_percentage", precision = 5, scale = 2)
    var defaultDiscountPercentage: BigDecimal = BigDecimal.ZERO,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true

) : BaseEntity(id) {

    /**
     * Check if a member's age is eligible for this category.
     */
    fun isAgeEligible(memberAge: Int): Boolean {
        val meetsMinimum = minimumAge == null || memberAge >= minimumAge!!
        val meetsMaximum = maximumAge == null || memberAge <= maximumAge!!
        return meetsMinimum && meetsMaximum
    }

    /**
     * Check if this category has any age restrictions.
     */
    fun hasAgeRestriction(): Boolean = minimumAge != null || maximumAge != null

    /**
     * Check if this category requires document verification.
     */
    fun needsVerification(): Boolean = requiresVerification && verificationDocumentType != null

    /**
     * Check if this is a family category.
     */
    fun isFamilyCategory(): Boolean = categoryType == MembershipCategoryType.FAMILY

    /**
     * Check if this is a corporate category.
     */
    fun isCorporateCategory(): Boolean = categoryType == MembershipCategoryType.CORPORATE

    /**
     * Deactivate the category.
     */
    fun deactivate() {
        isActive = false
    }

    /**
     * Activate the category.
     */
    fun activate() {
        isActive = true
    }
}
