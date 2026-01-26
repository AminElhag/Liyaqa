package com.liyaqa.forecasting.domain.ports

import com.liyaqa.forecasting.domain.model.MetricType
import com.liyaqa.forecasting.domain.model.PatternType
import com.liyaqa.forecasting.domain.model.SeasonalityPattern
import java.util.*

interface SeasonalityPatternRepository {
    fun save(pattern: SeasonalityPattern): SeasonalityPattern
    fun saveAll(patterns: List<SeasonalityPattern>): List<SeasonalityPattern>
    fun findById(id: UUID): Optional<SeasonalityPattern>
    fun findAll(): List<SeasonalityPattern>
    fun findByPatternType(patternType: PatternType): List<SeasonalityPattern>
    fun findByMetricType(metricType: MetricType): List<SeasonalityPattern>
    fun findByPatternTypeAndMetricType(patternType: PatternType, metricType: MetricType): List<SeasonalityPattern>
    fun findByPeriodKey(periodKey: String): List<SeasonalityPattern>
    fun deleteById(id: UUID)
    fun deleteAll()
}
