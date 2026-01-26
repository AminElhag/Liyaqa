package com.liyaqa.forecasting.application.commands

import com.liyaqa.forecasting.domain.model.*
import java.math.BigDecimal
import java.time.LocalDate

// ========== Forecast Model Commands ==========

data class CreateForecastModelCommand(
    val modelType: ModelType,
    val algorithm: Algorithm,
    val hyperparameters: Map<String, Any>? = null
)

data class UpdateForecastModelCommand(
    val accuracyMape: BigDecimal? = null,
    val accuracyRmse: BigDecimal? = null,
    val featureImportance: Map<String, Double>? = null,
    val isActive: Boolean? = null
)

// ========== Forecast Commands ==========

data class GenerateForecastCommand(
    val forecastType: ForecastType,
    val startDate: LocalDate,
    val endDate: LocalDate,
    val granularity: ForecastGranularity = ForecastGranularity.DAILY
)

enum class ForecastGranularity {
    DAILY, WEEKLY, MONTHLY
}

data class RecordActualValueCommand(
    val forecastId: java.util.UUID,
    val actualValue: BigDecimal
)

// ========== Budget Commands ==========

data class CreateBudgetCommand(
    val fiscalYear: Int,
    val fiscalMonth: Int,
    val metricType: MetricType,
    val budgetedValue: BigDecimal,
    val notes: String? = null
)

data class UpdateBudgetCommand(
    val budgetedValue: BigDecimal? = null,
    val notes: String? = null
)

data class RecordBudgetActualCommand(
    val fiscalYear: Int,
    val fiscalMonth: Int,
    val metricType: MetricType,
    val actualValue: BigDecimal
)

data class BulkCreateBudgetsCommand(
    val fiscalYear: Int,
    val budgets: List<MonthlyBudgetItem>
)

data class MonthlyBudgetItem(
    val fiscalMonth: Int,
    val metricType: MetricType,
    val budgetedValue: BigDecimal,
    val notes: String? = null
)

// ========== Scenario Commands ==========

data class CreateScenarioCommand(
    val name: String,
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val adjustments: ScenarioAdjustments
)

data class UpdateScenarioCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val adjustments: ScenarioAdjustments? = null
)

data class ScenarioAdjustments(
    val membershipGrowthRate: Double? = null, // e.g., 0.10 for 10% growth
    val priceChangePercent: Double? = null, // e.g., 5.0 for 5% price increase
    val churnReductionPercent: Double? = null, // e.g., 2.0 for 2% churn reduction
    val newLocationCount: Int? = null,
    val marketingSpendChange: Double? = null, // e.g., 1000.0 for SAR 1000 increase
    val customFactors: Map<String, Double>? = null
)

data class CalculateScenarioCommand(
    val scenarioId: java.util.UUID,
    val forecastMonths: Int = 12
)
