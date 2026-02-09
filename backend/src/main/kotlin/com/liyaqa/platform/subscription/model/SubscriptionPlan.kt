package com.liyaqa.platform.subscription.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.math.BigDecimal
import java.util.UUID

@Entity
@Table(name = "subscription_plans")
class SubscriptionPlan(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "name_ar")
    var nameAr: String? = null,

    @Column(name = "description")
    var description: String? = null,

    @Column(name = "description_ar")
    var descriptionAr: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false)
    var tier: PlanTier,

    @Column(name = "monthly_price_amount", nullable = false)
    var monthlyPriceAmount: BigDecimal,

    @Column(name = "monthly_price_currency", nullable = false)
    var monthlyPriceCurrency: String = "SAR",

    @Column(name = "annual_price_amount", nullable = false)
    var annualPriceAmount: BigDecimal,

    @Column(name = "annual_price_currency", nullable = false)
    var annualPriceCurrency: String = "SAR",

    @Column(name = "max_clubs", nullable = false)
    var maxClubs: Int = 1,

    @Column(name = "max_locations_per_club", nullable = false)
    var maxLocationsPerClub: Int = 1,

    @Column(name = "max_members", nullable = false)
    var maxMembers: Int = 100,

    @Column(name = "max_staff_users", nullable = false)
    var maxStaffUsers: Int = 5,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features", columnDefinition = "jsonb")
    var features: MutableMap<String, Boolean> = mutableMapOf(),

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0

) : OrganizationLevelEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    fun hasFeature(key: String): Boolean =
        features[key] == true

    fun updateFeatures(newFeatures: Map<String, Boolean>) {
        features.putAll(newFeatures)
    }

    fun updateLimits(
        maxClubs: Int? = null,
        maxLocationsPerClub: Int? = null,
        maxMembers: Int? = null,
        maxStaffUsers: Int? = null
    ) {
        maxClubs?.let { this.maxClubs = it }
        maxLocationsPerClub?.let { this.maxLocationsPerClub = it }
        maxMembers?.let { this.maxMembers = it }
        maxStaffUsers?.let { this.maxStaffUsers = it }
    }

    fun getAllFeatures(): Map<String, Boolean> =
        features.toMap()

    companion object {
        fun create(
            name: String,
            tier: PlanTier,
            monthlyPriceAmount: BigDecimal,
            annualPriceAmount: BigDecimal
        ): SubscriptionPlan = SubscriptionPlan(
            name = name,
            tier = tier,
            monthlyPriceAmount = monthlyPriceAmount,
            annualPriceAmount = annualPriceAmount
        )
    }
}
