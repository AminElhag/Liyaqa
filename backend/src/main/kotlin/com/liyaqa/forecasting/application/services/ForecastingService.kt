package com.liyaqa.forecasting.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.forecasting.application.commands.*
import com.liyaqa.forecasting.domain.model.*
import com.liyaqa.forecasting.domain.ports.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.*

@Service
@Transactional
class ForecastingService(
    private val forecastModelRepository: ForecastModelRepository,
    private val forecastRepository: ForecastRepository,
    private val seasonalityPatternRepository: SeasonalityPatternRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(ForecastingService::class.java)

    // ========== Forecast Model Operations ==========

    fun createForecastModel(command: CreateForecastModelCommand): ForecastModel {
        val hyperparamsJson = command.hyperparameters?.let { objectMapper.writeValueAsString(it) }

        val model = ForecastModel(
            modelType = command.modelType,
            algorithm = command.algorithm,
            trainingDate = Instant.now(),
            hyperparameters = hyperparamsJson
        )

        logger.info("Created forecast model: ${model.id} (${model.modelType}/${model.algorithm})")
        return forecastModelRepository.save(model)
    }

    fun activateForecastModel(id: UUID): ForecastModel {
        val model = forecastModelRepository.findById(id)
            .orElseThrow { NoSuchElementException("Forecast model not found: $id") }

        // Deactivate other models of the same type
        val currentActive = forecastModelRepository.findActiveByModelType(model.modelType)
        currentActive?.let {
            it.deactivate()
            forecastModelRepository.save(it)
        }

        model.activate()
        logger.info("Activated forecast model: ${model.id}")
        return forecastModelRepository.save(model)
    }

    fun updateForecastModel(id: UUID, command: UpdateForecastModelCommand): ForecastModel {
        val model = forecastModelRepository.findById(id)
            .orElseThrow { NoSuchElementException("Forecast model not found: $id") }

        if (command.accuracyMape != null && command.accuracyRmse != null) {
            model.updateAccuracy(command.accuracyMape, command.accuracyRmse)
        }

        command.featureImportance?.let {
            model.featureImportance = objectMapper.writeValueAsString(it)
        }

        command.isActive?.let {
            if (it) model.activate() else model.deactivate()
        }

        return forecastModelRepository.save(model)
    }

    @Transactional(readOnly = true)
    fun getForecastModel(id: UUID): ForecastModel? =
        forecastModelRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listForecastModels(pageable: Pageable): Page<ForecastModel> =
        forecastModelRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getActiveModels(): List<ForecastModel> =
        forecastModelRepository.findAllActive()

    // ========== Forecast Generation ==========

    fun generateForecast(command: GenerateForecastCommand): List<Forecast> {
        val activeModel = forecastModelRepository.findActiveByModelType(
            when (command.forecastType) {
                ForecastType.REVENUE, ForecastType.MEMBERSHIP_REVENUE,
                ForecastType.PT_REVENUE, ForecastType.RETAIL_REVENUE -> ModelType.REVENUE
                ForecastType.MEMBERSHIP_COUNT, ForecastType.SIGN_UPS -> ModelType.MEMBERSHIP_COUNT
                ForecastType.ATTENDANCE -> ModelType.ATTENDANCE
                ForecastType.CHURN_RATE -> ModelType.CHURN
            }
        ) ?: throw IllegalStateException("No active model for forecast type: ${command.forecastType}")

        val forecasts = mutableListOf<Forecast>()
        var currentDate = command.startDate

        while (!currentDate.isAfter(command.endDate)) {
            val periodEnd = when (command.granularity) {
                ForecastGranularity.DAILY -> currentDate
                ForecastGranularity.WEEKLY -> currentDate.plusWeeks(1).minusDays(1)
                ForecastGranularity.MONTHLY -> currentDate.plusMonths(1).minusDays(1)
            }

            // Generate prediction using simple moving average (placeholder for ML)
            val prediction = generatePrediction(command.forecastType, currentDate, periodEnd)

            val forecast = Forecast(
                modelId = activeModel.id,
                forecastType = command.forecastType,
                periodStart = currentDate,
                periodEnd = minOf(periodEnd, command.endDate),
                predictedValue = prediction.value,
                lowerBound = prediction.lowerBound,
                upperBound = prediction.upperBound,
                confidenceScore = prediction.confidence
            )

            forecasts.add(forecast)

            currentDate = when (command.granularity) {
                ForecastGranularity.DAILY -> currentDate.plusDays(1)
                ForecastGranularity.WEEKLY -> currentDate.plusWeeks(1)
                ForecastGranularity.MONTHLY -> currentDate.plusMonths(1)
            }
        }

        logger.info("Generated ${forecasts.size} forecasts for ${command.forecastType}")
        return forecastRepository.saveAll(forecasts)
    }

    private fun generatePrediction(
        type: ForecastType,
        startDate: LocalDate,
        endDate: LocalDate
    ): PredictionResult {
        // Placeholder prediction logic - would be replaced by actual ML model
        val basePrediction = when (type) {
            ForecastType.REVENUE -> BigDecimal("50000")
            ForecastType.MEMBERSHIP_COUNT -> BigDecimal("500")
            ForecastType.ATTENDANCE -> BigDecimal("1500")
            ForecastType.CHURN_RATE -> BigDecimal("0.05")
            ForecastType.SIGN_UPS -> BigDecimal("30")
            ForecastType.MEMBERSHIP_REVENUE -> BigDecimal("40000")
            ForecastType.PT_REVENUE -> BigDecimal("8000")
            ForecastType.RETAIL_REVENUE -> BigDecimal("2000")
        }

        // Apply seasonality adjustment
        val seasonality = getSeasonalityFactor(type, startDate)
        val adjustedValue = basePrediction.multiply(seasonality)

        // Calculate confidence interval (simple 10% range)
        val margin = adjustedValue.multiply(BigDecimal("0.10"))

        return PredictionResult(
            value = adjustedValue.setScale(2, RoundingMode.HALF_UP),
            lowerBound = adjustedValue.subtract(margin).setScale(2, RoundingMode.HALF_UP),
            upperBound = adjustedValue.add(margin).setScale(2, RoundingMode.HALF_UP),
            confidence = BigDecimal("0.85")
        )
    }

    private fun getSeasonalityFactor(type: ForecastType, date: LocalDate): BigDecimal {
        val metricType = when (type) {
            ForecastType.REVENUE, ForecastType.MEMBERSHIP_REVENUE,
            ForecastType.PT_REVENUE, ForecastType.RETAIL_REVENUE -> MetricType.REVENUE
            ForecastType.ATTENDANCE -> MetricType.ATTENDANCE
            else -> MetricType.SIGN_UPS
        }

        // Check for monthly seasonality
        val monthPatterns = seasonalityPatternRepository.findByPatternTypeAndMetricType(
            PatternType.MONTHLY,
            metricType
        )

        val monthName = date.month.name
        val monthPattern = monthPatterns.find { it.periodKey == monthName }

        return monthPattern?.adjustmentFactor ?: BigDecimal.ONE
    }

    @Transactional(readOnly = true)
    fun getForecasts(
        type: ForecastType,
        startDate: LocalDate,
        endDate: LocalDate
    ): List<Forecast> = forecastRepository.findByForecastTypeAndPeriod(type, startDate, endDate)

    @Transactional(readOnly = true)
    fun getLatestForecasts(type: ForecastType, limit: Int): List<Forecast> =
        forecastRepository.findLatestByType(type, limit)

    fun recordActualValue(command: RecordActualValueCommand): Forecast {
        val forecast = forecastRepository.findById(command.forecastId)
            .orElseThrow { NoSuchElementException("Forecast not found: ${command.forecastId}") }

        forecast.recordActualValue(command.actualValue)
        logger.info("Recorded actual value for forecast: ${command.forecastId}")
        return forecastRepository.save(forecast)
    }

    // ========== Seasonality ==========

    @Transactional(readOnly = true)
    fun getSeasonalityPatterns(): List<SeasonalityPattern> =
        seasonalityPatternRepository.findAll()

    @Transactional(readOnly = true)
    fun getSeasonalityByType(patternType: PatternType): List<SeasonalityPattern> =
        seasonalityPatternRepository.findByPatternType(patternType)

    private data class PredictionResult(
        val value: BigDecimal,
        val lowerBound: BigDecimal,
        val upperBound: BigDecimal,
        val confidence: BigDecimal
    )
}
