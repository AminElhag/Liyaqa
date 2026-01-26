package com.liyaqa.forecasting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.*

@Entity
@Table(name = "forecast_scenarios")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ForecastScenario(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "name_ar", length = 100)
    var nameAr: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "adjustments", nullable = false, columnDefinition = "JSONB")
    var adjustments: String, // JSON: {membership_growth: 0.1, price_change: 50}

    @Column(name = "scenario_forecasts", columnDefinition = "JSONB")
    var scenarioForecasts: String? = null, // Calculated results

    @Column(name = "base_forecast_id")
    var baseForecastId: UUID? = null,

    @Column(name = "is_baseline", nullable = false)
    var isBaseline: Boolean = false,

    @Column(name = "created_by")
    val createdBy: UUID? = null
) : BaseEntity(id) {

    fun updateScenario(
        newName: String,
        newNameAr: String?,
        newDescription: String?,
        newDescriptionAr: String?,
        newAdjustments: String
    ) {
        name = newName
        nameAr = newNameAr
        description = newDescription
        descriptionAr = newDescriptionAr
        adjustments = newAdjustments
        scenarioForecasts = null // Clear cached results
    }

    fun setCalculatedForecasts(forecasts: String) {
        scenarioForecasts = forecasts
    }

    fun markAsBaseline() {
        isBaseline = true
    }
}
