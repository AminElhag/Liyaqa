package com.liyaqa.forecasting.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.forecasting.application.commands.*
import com.liyaqa.forecasting.application.services.BudgetSummary
import com.liyaqa.forecasting.application.services.ScenarioComparison
import com.liyaqa.forecasting.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*

// ========== Request DTOs ==========

data class CreateForecastModelRequest(
    @field:NotNull(message = "Model type is required")
    val modelType: ModelType,

    @field:NotNull(message = "Algorithm is required")
    val algorithm: Algorithm,

    val hyperparameters: Map<String, Any>? = null
)

data class UpdateForecastModelRequest(
    val accuracyMape: BigDecimal? = null,
    val accuracyRmse: BigDecimal? = null,
    val featureImportance: Map<String, Double>? = null,
    val isActive: Boolean? = null
)

data class GenerateForecastRequest(
    @field:NotNull(message = "Forecast type is required")
    val forecastType: ForecastType,

    @field:NotNull(message = "Start date is required")
    val startDate: LocalDate,

    @field:NotNull(message = "End date is required")
    val endDate: LocalDate,

    val granularity: ForecastGranularity = ForecastGranularity.DAILY
)

data class RecordActualValueRequest(
    @field:NotNull(message = "Actual value is required")
    @field:DecimalMin(value = "0", message = "Actual value must be non-negative")
    val actualValue: BigDecimal
)

data class CreateBudgetRequest(
    @field:NotNull(message = "Fiscal year is required")
    @field:Min(2020) @field:Max(2100)
    val fiscalYear: Int,

    @field:NotNull(message = "Fiscal month is required")
    @field:Min(1) @field:Max(12)
    val fiscalMonth: Int,

    @field:NotNull(message = "Metric type is required")
    val metricType: MetricType,

    @field:NotNull(message = "Budgeted value is required")
    @field:DecimalMin(value = "0", message = "Budgeted value must be non-negative")
    val budgetedValue: BigDecimal,

    val notes: String? = null
)

data class UpdateBudgetRequest(
    @field:DecimalMin(value = "0", message = "Budgeted value must be non-negative")
    val budgetedValue: BigDecimal? = null,
    val notes: String? = null
)

data class RecordBudgetActualRequest(
    @field:NotNull(message = "Fiscal year is required")
    val fiscalYear: Int,

    @field:NotNull(message = "Fiscal month is required")
    val fiscalMonth: Int,

    @field:NotNull(message = "Metric type is required")
    val metricType: MetricType,

    @field:NotNull(message = "Actual value is required")
    val actualValue: BigDecimal
)

data class BulkCreateBudgetsRequest(
    @field:NotNull(message = "Fiscal year is required")
    @field:Min(2020) @field:Max(2100)
    val fiscalYear: Int,

    @field:NotEmpty(message = "At least one budget item is required")
    val budgets: List<MonthlyBudgetItemRequest>
)

data class MonthlyBudgetItemRequest(
    @field:Min(1) @field:Max(12)
    val fiscalMonth: Int,
    val metricType: MetricType,
    val budgetedValue: BigDecimal,
    val notes: String? = null
)

data class CreateScenarioRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(max = 100)
    val name: String,

    @field:Size(max = 100)
    val nameAr: String? = null,

    val description: String? = null,
    val descriptionAr: String? = null,

    @field:NotNull(message = "Adjustments are required")
    val adjustments: ScenarioAdjustmentsRequest
)

data class UpdateScenarioRequest(
    @field:Size(max = 100)
    val name: String? = null,

    @field:Size(max = 100)
    val nameAr: String? = null,

    val description: String? = null,
    val descriptionAr: String? = null,
    val adjustments: ScenarioAdjustmentsRequest? = null
)

data class ScenarioAdjustmentsRequest(
    val membershipGrowthRate: Double? = null,
    val priceChangePercent: Double? = null,
    val churnReductionPercent: Double? = null,
    val newLocationCount: Int? = null,
    val marketingSpendChange: Double? = null,
    val customFactors: Map<String, Double>? = null
)

data class CalculateScenarioRequest(
    @field:Min(1) @field:Max(60)
    val forecastMonths: Int = 12
)

data class CompareScenarioRequest(
    @field:Size(min = 2, max = 10, message = "2-10 scenarios required for comparison")
    val scenarioIds: List<UUID>
)

// ========== Response DTOs ==========

data class ForecastModelResponse(
    val id: UUID,
    val modelType: ModelType,
    val algorithm: Algorithm,
    val trainingDate: Instant,
    val accuracyMape: BigDecimal?,
    val accuracyRmse: BigDecimal?,
    val featureImportance: Map<String, Double>?,
    val hyperparameters: Map<String, Any>?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(model: ForecastModel, objectMapper: ObjectMapper): ForecastModelResponse {
            val features = model.featureImportance?.let {
                try {
                    @Suppress("UNCHECKED_CAST")
                    objectMapper.readValue(it, Map::class.java) as Map<String, Double>
                } catch (e: Exception) { null }
            }
            val hyperparams = model.hyperparameters?.let {
                try {
                    @Suppress("UNCHECKED_CAST")
                    objectMapper.readValue(it, Map::class.java) as Map<String, Any>
                } catch (e: Exception) { null }
            }

            return ForecastModelResponse(
                id = model.id,
                modelType = model.modelType,
                algorithm = model.algorithm,
                trainingDate = model.trainingDate,
                accuracyMape = model.accuracyMape,
                accuracyRmse = model.accuracyRmse,
                featureImportance = features,
                hyperparameters = hyperparams,
                isActive = model.isActive,
                createdAt = model.createdAt,
                updatedAt = model.updatedAt
            )
        }
    }
}

data class ForecastResponse(
    val id: UUID,
    val modelId: UUID,
    val forecastType: ForecastType,
    val periodStart: LocalDate,
    val periodEnd: LocalDate,
    val predictedValue: BigDecimal,
    val lowerBound: BigDecimal?,
    val upperBound: BigDecimal?,
    val actualValue: BigDecimal?,
    val confidenceScore: BigDecimal?,
    val variance: BigDecimal?,
    val variancePercentage: BigDecimal?,
    val generatedAt: Instant
) {
    companion object {
        fun from(forecast: Forecast): ForecastResponse = ForecastResponse(
            id = forecast.id,
            modelId = forecast.modelId,
            forecastType = forecast.forecastType,
            periodStart = forecast.periodStart,
            periodEnd = forecast.periodEnd,
            predictedValue = forecast.predictedValue,
            lowerBound = forecast.lowerBound,
            upperBound = forecast.upperBound,
            actualValue = forecast.actualValue,
            confidenceScore = forecast.confidenceScore,
            variance = forecast.getVariance(),
            variancePercentage = forecast.getVariancePercentage(),
            generatedAt = forecast.generatedAt
        )
    }
}

data class SeasonalityPatternResponse(
    val id: UUID,
    val patternType: PatternType,
    val periodKey: String,
    val metricType: MetricType,
    val adjustmentFactor: BigDecimal,
    val sampleSize: Int,
    val confidenceLevel: BigDecimal?,
    val isAboveAverage: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(pattern: SeasonalityPattern): SeasonalityPatternResponse = SeasonalityPatternResponse(
            id = pattern.id,
            patternType = pattern.patternType,
            periodKey = pattern.periodKey,
            metricType = pattern.metricType,
            adjustmentFactor = pattern.adjustmentFactor,
            sampleSize = pattern.sampleSize,
            confidenceLevel = pattern.confidenceLevel,
            isAboveAverage = pattern.isAboveAverage(),
            createdAt = pattern.createdAt
        )
    }
}

data class BudgetResponse(
    val id: UUID,
    val fiscalYear: Int,
    val fiscalMonth: Int,
    val metricType: MetricType,
    val budgetedValue: BigDecimal,
    val actualValue: BigDecimal?,
    val variance: BigDecimal?,
    val variancePercentage: BigDecimal?,
    val isOnTarget: Boolean,
    val isOverBudget: Boolean,
    val notes: String?,
    val createdBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(budget: Budget): BudgetResponse = BudgetResponse(
            id = budget.id,
            fiscalYear = budget.fiscalYear,
            fiscalMonth = budget.fiscalMonth,
            metricType = budget.metricType,
            budgetedValue = budget.budgetedValue,
            actualValue = budget.actualValue,
            variance = budget.variance,
            variancePercentage = budget.variancePercentage,
            isOnTarget = budget.isOnTarget(),
            isOverBudget = budget.isOverBudget(),
            notes = budget.notes,
            createdBy = budget.createdBy,
            createdAt = budget.createdAt,
            updatedAt = budget.updatedAt
        )
    }
}

data class BudgetSummaryResponse(
    val year: Int,
    val totalBudgeted: BigDecimal,
    val totalActual: BigDecimal,
    val totalVariance: BigDecimal,
    val budgetCount: Int,
    val onTargetCount: Int,
    val overBudgetCount: Int,
    val byMetricType: Map<MetricType, MetricBudgetSummaryResponse>
) {
    companion object {
        fun from(summary: BudgetSummary): BudgetSummaryResponse = BudgetSummaryResponse(
            year = summary.year,
            totalBudgeted = summary.totalBudgeted,
            totalActual = summary.totalActual,
            totalVariance = summary.totalVariance,
            budgetCount = summary.budgetCount,
            onTargetCount = summary.onTargetCount,
            overBudgetCount = summary.overBudgetCount,
            byMetricType = summary.byMetricType.mapValues { (_, v) ->
                MetricBudgetSummaryResponse(v.budgeted, v.actual, v.variance)
            }
        )
    }
}

data class MetricBudgetSummaryResponse(
    val budgeted: BigDecimal,
    val actual: BigDecimal,
    val variance: BigDecimal
)

data class ForecastScenarioResponse(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val description: String?,
    val descriptionAr: String?,
    val adjustments: ScenarioAdjustmentsRequest?,
    val scenarioForecasts: Any?, // Parsed JSON
    val isBaseline: Boolean,
    val createdBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(scenario: ForecastScenario, objectMapper: ObjectMapper): ForecastScenarioResponse {
            val adjustments = try {
                objectMapper.readValue(scenario.adjustments, ScenarioAdjustmentsRequest::class.java)
            } catch (e: Exception) { null }

            val forecasts = scenario.scenarioForecasts?.let {
                try {
                    objectMapper.readValue(it, Any::class.java)
                } catch (e: Exception) { null }
            }

            return ForecastScenarioResponse(
                id = scenario.id,
                name = scenario.name,
                nameAr = scenario.nameAr,
                description = scenario.description,
                descriptionAr = scenario.descriptionAr,
                adjustments = adjustments,
                scenarioForecasts = forecasts,
                isBaseline = scenario.isBaseline,
                createdBy = scenario.createdBy,
                createdAt = scenario.createdAt,
                updatedAt = scenario.updatedAt
            )
        }
    }
}

data class ScenarioComparisonResponse(
    val scenarios: List<ScenarioComparisonItemResponse>,
    val bestScenarioId: UUID?,
    val worstScenarioId: UUID?
) {
    companion object {
        fun from(comparison: ScenarioComparison): ScenarioComparisonResponse = ScenarioComparisonResponse(
            scenarios = comparison.scenarios.map {
                ScenarioComparisonItemResponse(
                    id = it.id,
                    name = it.name,
                    nameAr = it.nameAr,
                    isBaseline = it.isBaseline,
                    totalProjected = it.totalProjected,
                    changeFromBaseline = it.changeFromBaseline
                )
            },
            bestScenarioId = comparison.bestScenario,
            worstScenarioId = comparison.worstScenario
        )
    }
}

data class ScenarioComparisonItemResponse(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val isBaseline: Boolean,
    val totalProjected: BigDecimal,
    val changeFromBaseline: BigDecimal
)

// Page response wrapper
data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
