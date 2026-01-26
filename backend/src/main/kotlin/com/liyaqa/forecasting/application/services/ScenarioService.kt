package com.liyaqa.forecasting.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.forecasting.application.commands.*
import com.liyaqa.forecasting.domain.model.ForecastScenario
import com.liyaqa.forecasting.domain.model.ForecastType
import com.liyaqa.forecasting.domain.ports.ForecastRepository
import com.liyaqa.forecasting.domain.ports.ForecastScenarioRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDate
import java.util.*

@Service
@Transactional
class ScenarioService(
    private val scenarioRepository: ForecastScenarioRepository,
    private val forecastRepository: ForecastRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(ScenarioService::class.java)

    fun createScenario(command: CreateScenarioCommand, userId: UUID): ForecastScenario {
        val adjustmentsJson = objectMapper.writeValueAsString(command.adjustments)

        val scenario = ForecastScenario(
            name = command.name,
            nameAr = command.nameAr,
            description = command.description,
            descriptionAr = command.descriptionAr,
            adjustments = adjustmentsJson,
            createdBy = userId
        )

        logger.info("Created forecast scenario: ${scenario.name}")
        return scenarioRepository.save(scenario)
    }

    fun updateScenario(id: UUID, command: UpdateScenarioCommand): ForecastScenario {
        val scenario = scenarioRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scenario not found: $id") }

        val adjustmentsJson = command.adjustments?.let { objectMapper.writeValueAsString(it) }
            ?: scenario.adjustments

        scenario.updateScenario(
            newName = command.name ?: scenario.name,
            newNameAr = command.nameAr ?: scenario.nameAr,
            newDescription = command.description ?: scenario.description,
            newDescriptionAr = command.descriptionAr ?: scenario.descriptionAr,
            newAdjustments = adjustmentsJson
        )

        logger.info("Updated scenario: $id")
        return scenarioRepository.save(scenario)
    }

    fun calculateScenario(command: CalculateScenarioCommand): ForecastScenario {
        val scenario = scenarioRepository.findById(command.scenarioId)
            .orElseThrow { NoSuchElementException("Scenario not found: ${command.scenarioId}") }

        val adjustments = objectMapper.readValue(scenario.adjustments, ScenarioAdjustments::class.java)

        // Get baseline forecasts
        val startDate = LocalDate.now()
        val endDate = startDate.plusMonths(command.forecastMonths.toLong())

        val baselineForecasts = forecastRepository.findByForecastTypeAndPeriod(
            ForecastType.REVENUE,
            startDate,
            endDate
        )

        // Apply adjustments to create scenario forecasts
        val scenarioForecasts = baselineForecasts.map { baseline ->
            var adjustedValue = baseline.predictedValue

            // Apply membership growth rate
            adjustments.membershipGrowthRate?.let { rate ->
                adjustedValue = adjustedValue.multiply(
                    BigDecimal.ONE.add(BigDecimal(rate))
                )
            }

            // Apply price change
            adjustments.priceChangePercent?.let { pct ->
                adjustedValue = adjustedValue.multiply(
                    BigDecimal.ONE.add(BigDecimal(pct / 100))
                )
            }

            // Apply churn reduction (increases retention = more revenue)
            adjustments.churnReductionPercent?.let { pct ->
                adjustedValue = adjustedValue.multiply(
                    BigDecimal.ONE.add(BigDecimal(pct / 200)) // Simplified impact
                )
            }

            ScenarioForecastResult(
                periodStart = baseline.periodStart,
                periodEnd = baseline.periodEnd,
                baselineValue = baseline.predictedValue,
                adjustedValue = adjustedValue.setScale(2, RoundingMode.HALF_UP),
                changePercent = if (baseline.predictedValue > BigDecimal.ZERO) {
                    adjustedValue.subtract(baseline.predictedValue)
                        .divide(baseline.predictedValue, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal(100))
                } else BigDecimal.ZERO
            )
        }

        val resultsJson = objectMapper.writeValueAsString(
            ScenarioResults(
                calculatedAt = java.time.Instant.now().toString(),
                forecastMonths = command.forecastMonths,
                totalBaseline = scenarioForecasts.sumOf { it.baselineValue },
                totalAdjusted = scenarioForecasts.sumOf { it.adjustedValue },
                forecasts = scenarioForecasts
            )
        )

        scenario.setCalculatedForecasts(resultsJson)
        logger.info("Calculated scenario: ${command.scenarioId}")
        return scenarioRepository.save(scenario)
    }

    @Transactional(readOnly = true)
    fun getScenario(id: UUID): ForecastScenario? =
        scenarioRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listScenarios(pageable: Pageable): Page<ForecastScenario> =
        scenarioRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getBaseline(): ForecastScenario? =
        scenarioRepository.findBaseline()

    fun setAsBaseline(id: UUID): ForecastScenario {
        // Clear existing baseline
        scenarioRepository.findBaseline()?.let { existing ->
            existing.isBaseline = false
            scenarioRepository.save(existing)
        }

        val scenario = scenarioRepository.findById(id)
            .orElseThrow { NoSuchElementException("Scenario not found: $id") }

        scenario.markAsBaseline()
        logger.info("Set scenario as baseline: $id")
        return scenarioRepository.save(scenario)
    }

    fun deleteScenario(id: UUID) {
        if (!scenarioRepository.existsById(id)) {
            throw NoSuchElementException("Scenario not found: $id")
        }
        scenarioRepository.deleteById(id)
        logger.info("Deleted scenario: $id")
    }

    fun compareScenarios(scenarioIds: List<UUID>): ScenarioComparison {
        val scenarios = scenarioIds.mapNotNull { scenarioRepository.findById(it).orElse(null) }

        if (scenarios.size < 2) {
            throw IllegalArgumentException("Need at least 2 scenarios to compare")
        }

        val comparisons = scenarios.map { scenario ->
            val results = scenario.scenarioForecasts?.let {
                objectMapper.readValue(it, ScenarioResults::class.java)
            }

            ScenarioComparisonItem(
                id = scenario.id,
                name = scenario.name,
                nameAr = scenario.nameAr,
                isBaseline = scenario.isBaseline,
                totalProjected = results?.totalAdjusted ?: BigDecimal.ZERO,
                changeFromBaseline = results?.let {
                    if (it.totalBaseline > BigDecimal.ZERO) {
                        it.totalAdjusted.subtract(it.totalBaseline)
                            .divide(it.totalBaseline, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal(100))
                    } else BigDecimal.ZERO
                } ?: BigDecimal.ZERO
            )
        }

        return ScenarioComparison(
            scenarios = comparisons,
            bestScenario = comparisons.maxByOrNull { it.totalProjected }?.id,
            worstScenario = comparisons.minByOrNull { it.totalProjected }?.id
        )
    }
}

data class ScenarioForecastResult(
    val periodStart: LocalDate,
    val periodEnd: LocalDate,
    val baselineValue: BigDecimal,
    val adjustedValue: BigDecimal,
    val changePercent: BigDecimal
)

data class ScenarioResults(
    val calculatedAt: String,
    val forecastMonths: Int,
    val totalBaseline: BigDecimal,
    val totalAdjusted: BigDecimal,
    val forecasts: List<ScenarioForecastResult>
)

data class ScenarioComparison(
    val scenarios: List<ScenarioComparisonItem>,
    val bestScenario: UUID?,
    val worstScenario: UUID?
)

data class ScenarioComparisonItem(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val isBaseline: Boolean,
    val totalProjected: BigDecimal,
    val changeFromBaseline: BigDecimal
)
