package com.liyaqa.forecasting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.*

@Entity
@Table(name = "seasonality_patterns")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class SeasonalityPattern(
    id: UUID = UUID.randomUUID(),

    @Enumerated(EnumType.STRING)
    @Column(name = "pattern_type", nullable = false, length = 20)
    val patternType: PatternType,

    @Column(name = "period_key", nullable = false, length = 20)
    val periodKey: String, // e.g., "MONDAY", "JANUARY", "Q1", "RAMADAN"

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 30)
    val metricType: MetricType,

    @Column(name = "adjustment_factor", nullable = false, precision = 5, scale = 4)
    var adjustmentFactor: BigDecimal,

    @Column(name = "sample_size", nullable = false)
    var sampleSize: Int,

    @Column(name = "confidence_level", precision = 5, scale = 4)
    var confidenceLevel: BigDecimal? = null
) : BaseEntity(id) {

    fun updatePattern(newFactor: BigDecimal, newSampleSize: Int, confidence: BigDecimal?) {
        adjustmentFactor = newFactor
        sampleSize = newSampleSize
        confidenceLevel = confidence
    }

    fun isAboveAverage(): Boolean = adjustmentFactor > BigDecimal.ONE
    fun isBelowAverage(): Boolean = adjustmentFactor < BigDecimal.ONE
}
