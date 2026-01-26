package com.liyaqa.forecasting.infrastructure.persistence

import com.liyaqa.forecasting.domain.model.MetricType
import com.liyaqa.forecasting.domain.model.PatternType
import com.liyaqa.forecasting.domain.model.SeasonalityPattern
import com.liyaqa.forecasting.domain.ports.SeasonalityPatternRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataSeasonalityPatternRepository : JpaRepository<SeasonalityPattern, UUID> {
    fun findByPatternType(patternType: PatternType): List<SeasonalityPattern>
    fun findByMetricType(metricType: MetricType): List<SeasonalityPattern>
    fun findByPatternTypeAndMetricType(patternType: PatternType, metricType: MetricType): List<SeasonalityPattern>
    fun findByPeriodKey(periodKey: String): List<SeasonalityPattern>
}

@Repository
class JpaSeasonalityPatternRepository(
    private val springDataRepository: SpringDataSeasonalityPatternRepository
) : SeasonalityPatternRepository {

    override fun save(pattern: SeasonalityPattern): SeasonalityPattern =
        springDataRepository.save(pattern)

    override fun saveAll(patterns: List<SeasonalityPattern>): List<SeasonalityPattern> =
        springDataRepository.saveAll(patterns)

    override fun findById(id: UUID): Optional<SeasonalityPattern> =
        springDataRepository.findById(id)

    override fun findAll(): List<SeasonalityPattern> =
        springDataRepository.findAll()

    override fun findByPatternType(patternType: PatternType): List<SeasonalityPattern> =
        springDataRepository.findByPatternType(patternType)

    override fun findByMetricType(metricType: MetricType): List<SeasonalityPattern> =
        springDataRepository.findByMetricType(metricType)

    override fun findByPatternTypeAndMetricType(
        patternType: PatternType,
        metricType: MetricType
    ): List<SeasonalityPattern> =
        springDataRepository.findByPatternTypeAndMetricType(patternType, metricType)

    override fun findByPeriodKey(periodKey: String): List<SeasonalityPattern> =
        springDataRepository.findByPeriodKey(periodKey)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun deleteAll() =
        springDataRepository.deleteAll()
}
