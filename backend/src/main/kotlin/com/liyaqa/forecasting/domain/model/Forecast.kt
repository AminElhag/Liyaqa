package com.liyaqa.forecasting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*

@Entity
@Table(name = "forecasts")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Forecast(
    id: UUID = UUID.randomUUID(),

    @Column(name = "model_id", nullable = false)
    val modelId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "forecast_type", nullable = false, length = 30)
    val forecastType: ForecastType,

    @Column(name = "period_start", nullable = false)
    val periodStart: LocalDate,

    @Column(name = "period_end", nullable = false)
    val periodEnd: LocalDate,

    @Column(name = "predicted_value", nullable = false, precision = 15, scale = 2)
    val predictedValue: BigDecimal,

    @Column(name = "lower_bound", precision = 15, scale = 2)
    val lowerBound: BigDecimal? = null,

    @Column(name = "upper_bound", precision = 15, scale = 2)
    val upperBound: BigDecimal? = null,

    @Column(name = "actual_value", precision = 15, scale = 2)
    var actualValue: BigDecimal? = null,

    @Column(name = "confidence_score", precision = 5, scale = 4)
    val confidenceScore: BigDecimal? = null,

    @Column(name = "generated_at", nullable = false)
    val generatedAt: Instant = Instant.now()
) : BaseEntity(id) {

    fun recordActualValue(actual: BigDecimal) {
        actualValue = actual
    }

    fun getVariance(): BigDecimal? {
        return actualValue?.subtract(predictedValue)
    }

    fun getVariancePercentage(): BigDecimal? {
        if (actualValue == null || predictedValue == BigDecimal.ZERO) return null
        return actualValue!!.subtract(predictedValue)
            .divide(predictedValue, 4, java.math.RoundingMode.HALF_UP)
            .multiply(BigDecimal(100))
    }
}
