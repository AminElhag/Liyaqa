package com.liyaqa.forecasting.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.forecasting.application.commands.*
import com.liyaqa.forecasting.application.services.*
import com.liyaqa.forecasting.domain.model.ForecastType
import com.liyaqa.forecasting.domain.model.MetricType
import com.liyaqa.forecasting.domain.model.PatternType
import com.liyaqa.shared.infrastructure.security.CurrentUser
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.*

@RestController
@RequestMapping("/api/forecasting")
@Tag(name = "Forecasting", description = "Sales forecasting, budgets, and scenario planning")
class ForecastingController(
    private val forecastingService: ForecastingService,
    private val budgetService: BudgetService,
    private val scenarioService: ScenarioService,
    private val objectMapper: ObjectMapper
) {
    // ========== Forecast Models ==========

    @PostMapping("/models")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Create a new forecast model")
    fun createForecastModel(
        @Valid @RequestBody request: CreateForecastModelRequest
    ): ResponseEntity<ForecastModelResponse> {
        val command = CreateForecastModelCommand(
            modelType = request.modelType,
            algorithm = request.algorithm,
            hyperparameters = request.hyperparameters
        )
        val model = forecastingService.createForecastModel(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ForecastModelResponse.from(model, objectMapper))
    }

    @GetMapping("/models")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "List forecast models")
    fun listForecastModels(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ForecastModelResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val modelsPage = forecastingService.listForecastModels(pageable)
        val response = PageResponse(
            content = modelsPage.content.map { ForecastModelResponse.from(it, objectMapper) },
            page = modelsPage.number,
            size = modelsPage.size,
            totalElements = modelsPage.totalElements,
            totalPages = modelsPage.totalPages,
            first = modelsPage.isFirst,
            last = modelsPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/models/{id}")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get a forecast model")
    fun getForecastModel(@PathVariable id: UUID): ResponseEntity<ForecastModelResponse> {
        val model = forecastingService.getForecastModel(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ForecastModelResponse.from(model, objectMapper))
    }

    @PostMapping("/models/{id}/activate")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Activate a forecast model")
    fun activateForecastModel(@PathVariable id: UUID): ResponseEntity<ForecastModelResponse> {
        val model = forecastingService.activateForecastModel(id)
        return ResponseEntity.ok(ForecastModelResponse.from(model, objectMapper))
    }

    @GetMapping("/models/active")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get active models")
    fun getActiveModels(): ResponseEntity<List<ForecastModelResponse>> {
        val models = forecastingService.getActiveModels()
        return ResponseEntity.ok(models.map { ForecastModelResponse.from(it, objectMapper) })
    }

    // ========== Forecasts ==========

    @PostMapping("/generate")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Generate forecasts")
    fun generateForecast(
        @Valid @RequestBody request: GenerateForecastRequest
    ): ResponseEntity<List<ForecastResponse>> {
        val command = GenerateForecastCommand(
            forecastType = request.forecastType,
            startDate = request.startDate,
            endDate = request.endDate,
            granularity = request.granularity
        )
        val forecasts = forecastingService.generateForecast(command)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(forecasts.map { ForecastResponse.from(it) })
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get revenue forecasts")
    fun getRevenueForecasts(
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<List<ForecastResponse>> {
        val endDate = LocalDate.now().plusDays(days.toLong())
        val forecasts = forecastingService.getForecasts(
            ForecastType.REVENUE,
            LocalDate.now(),
            endDate
        )
        return ResponseEntity.ok(forecasts.map { ForecastResponse.from(it) })
    }

    @GetMapping("/membership")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get membership forecasts")
    fun getMembershipForecasts(
        @RequestParam(defaultValue = "30") days: Int
    ): ResponseEntity<List<ForecastResponse>> {
        val endDate = LocalDate.now().plusDays(days.toLong())
        val forecasts = forecastingService.getForecasts(
            ForecastType.MEMBERSHIP_COUNT,
            LocalDate.now(),
            endDate
        )
        return ResponseEntity.ok(forecasts.map { ForecastResponse.from(it) })
    }

    @PostMapping("/forecasts/{id}/actual")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Record actual value for a forecast")
    fun recordActualValue(
        @PathVariable id: UUID,
        @Valid @RequestBody request: RecordActualValueRequest
    ): ResponseEntity<ForecastResponse> {
        val command = RecordActualValueCommand(
            forecastId = id,
            actualValue = request.actualValue
        )
        val forecast = forecastingService.recordActualValue(command)
        return ResponseEntity.ok(ForecastResponse.from(forecast))
    }

    // ========== Seasonality ==========

    @GetMapping("/seasonality")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get seasonality patterns")
    fun getSeasonalityPatterns(
        @RequestParam(required = false) patternType: PatternType?
    ): ResponseEntity<List<SeasonalityPatternResponse>> {
        val patterns = if (patternType != null) {
            forecastingService.getSeasonalityByType(patternType)
        } else {
            forecastingService.getSeasonalityPatterns()
        }
        return ResponseEntity.ok(patterns.map { SeasonalityPatternResponse.from(it) })
    }

    // ========== Budgets ==========

    @PostMapping("/budgets")
    @PreAuthorize("hasAuthority('budgets_manage')")
    @Operation(summary = "Create a budget")
    fun createBudget(
        @Valid @RequestBody request: CreateBudgetRequest,
        currentUser: CurrentUser
    ): ResponseEntity<BudgetResponse> {
        val command = CreateBudgetCommand(
            fiscalYear = request.fiscalYear,
            fiscalMonth = request.fiscalMonth,
            metricType = request.metricType,
            budgetedValue = request.budgetedValue,
            notes = request.notes
        )
        val budget = budgetService.createBudget(command, currentUser.id)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BudgetResponse.from(budget))
    }

    @PostMapping("/budgets/bulk")
    @PreAuthorize("hasAuthority('budgets_manage')")
    @Operation(summary = "Create multiple budgets")
    fun bulkCreateBudgets(
        @Valid @RequestBody request: BulkCreateBudgetsRequest,
        currentUser: CurrentUser
    ): ResponseEntity<List<BudgetResponse>> {
        val command = BulkCreateBudgetsCommand(
            fiscalYear = request.fiscalYear,
            budgets = request.budgets.map {
                MonthlyBudgetItem(
                    fiscalMonth = it.fiscalMonth,
                    metricType = it.metricType,
                    budgetedValue = it.budgetedValue,
                    notes = it.notes
                )
            }
        )
        val budgets = budgetService.bulkCreateBudgets(command, currentUser.id)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(budgets.map { BudgetResponse.from(it) })
    }

    @GetMapping("/budgets")
    @PreAuthorize("hasAuthority('budgets_view')")
    @Operation(summary = "List budgets")
    fun listBudgets(
        @RequestParam(required = false) year: Int?,
        @RequestParam(required = false) month: Int?,
        @RequestParam(required = false) metricType: MetricType?
    ): ResponseEntity<List<BudgetResponse>> {
        val budgets = when {
            year != null && month != null -> budgetService.getBudgetsByYearAndMonth(year, month)
            year != null && metricType != null -> budgetService.getBudgetsByYearAndMetricType(year, metricType)
            year != null -> budgetService.getBudgetsByYear(year)
            else -> budgetService.getBudgetsByYear(LocalDate.now().year)
        }
        return ResponseEntity.ok(budgets.map { BudgetResponse.from(it) })
    }

    @GetMapping("/budgets/{id}")
    @PreAuthorize("hasAuthority('budgets_view')")
    @Operation(summary = "Get a budget")
    fun getBudget(@PathVariable id: UUID): ResponseEntity<BudgetResponse> {
        val budget = budgetService.getBudget(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(BudgetResponse.from(budget))
    }

    @PutMapping("/budgets/{id}")
    @PreAuthorize("hasAuthority('budgets_manage')")
    @Operation(summary = "Update a budget")
    fun updateBudget(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateBudgetRequest
    ): ResponseEntity<BudgetResponse> {
        val command = UpdateBudgetCommand(
            budgetedValue = request.budgetedValue,
            notes = request.notes
        )
        val budget = budgetService.updateBudget(id, command)
        return ResponseEntity.ok(BudgetResponse.from(budget))
    }

    @PostMapping("/budgets/actual")
    @PreAuthorize("hasAuthority('budgets_manage')")
    @Operation(summary = "Record actual value for a budget period")
    fun recordBudgetActual(
        @Valid @RequestBody request: RecordBudgetActualRequest
    ): ResponseEntity<BudgetResponse> {
        val command = RecordBudgetActualCommand(
            fiscalYear = request.fiscalYear,
            fiscalMonth = request.fiscalMonth,
            metricType = request.metricType,
            actualValue = request.actualValue
        )
        val budget = budgetService.recordActual(command)
        return ResponseEntity.ok(BudgetResponse.from(budget))
    }

    @GetMapping("/budgets/summary")
    @PreAuthorize("hasAuthority('budgets_view')")
    @Operation(summary = "Get budget vs actual summary")
    fun getBudgetSummary(
        @RequestParam(required = false) year: Int?
    ): ResponseEntity<BudgetSummaryResponse> {
        val fiscalYear = year ?: LocalDate.now().year
        val summary = budgetService.getBudgetVsActualSummary(fiscalYear)
        return ResponseEntity.ok(BudgetSummaryResponse.from(summary))
    }

    @DeleteMapping("/budgets/{id}")
    @PreAuthorize("hasAuthority('budgets_manage')")
    @Operation(summary = "Delete a budget")
    fun deleteBudget(@PathVariable id: UUID): ResponseEntity<Void> {
        budgetService.deleteBudget(id)
        return ResponseEntity.noContent().build()
    }

    // ========== Scenarios ==========

    @PostMapping("/scenarios")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Create a scenario")
    fun createScenario(
        @Valid @RequestBody request: CreateScenarioRequest,
        currentUser: CurrentUser
    ): ResponseEntity<ForecastScenarioResponse> {
        val command = CreateScenarioCommand(
            name = request.name,
            nameAr = request.nameAr,
            description = request.description,
            descriptionAr = request.descriptionAr,
            adjustments = ScenarioAdjustments(
                membershipGrowthRate = request.adjustments.membershipGrowthRate,
                priceChangePercent = request.adjustments.priceChangePercent,
                churnReductionPercent = request.adjustments.churnReductionPercent,
                newLocationCount = request.adjustments.newLocationCount,
                marketingSpendChange = request.adjustments.marketingSpendChange,
                customFactors = request.adjustments.customFactors
            )
        )
        val scenario = scenarioService.createScenario(command, currentUser.id)
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ForecastScenarioResponse.from(scenario, objectMapper))
    }

    @GetMapping("/scenarios")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "List scenarios")
    fun listScenarios(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<PageResponse<ForecastScenarioResponse>> {
        val pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        val scenariosPage = scenarioService.listScenarios(pageable)
        val response = PageResponse(
            content = scenariosPage.content.map { ForecastScenarioResponse.from(it, objectMapper) },
            page = scenariosPage.number,
            size = scenariosPage.size,
            totalElements = scenariosPage.totalElements,
            totalPages = scenariosPage.totalPages,
            first = scenariosPage.isFirst,
            last = scenariosPage.isLast
        )
        return ResponseEntity.ok(response)
    }

    @GetMapping("/scenarios/{id}")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Get a scenario")
    fun getScenario(@PathVariable id: UUID): ResponseEntity<ForecastScenarioResponse> {
        val scenario = scenarioService.getScenario(id)
            ?: return ResponseEntity.notFound().build()
        return ResponseEntity.ok(ForecastScenarioResponse.from(scenario, objectMapper))
    }

    @PutMapping("/scenarios/{id}")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Update a scenario")
    fun updateScenario(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateScenarioRequest
    ): ResponseEntity<ForecastScenarioResponse> {
        val command = UpdateScenarioCommand(
            name = request.name,
            nameAr = request.nameAr,
            description = request.description,
            descriptionAr = request.descriptionAr,
            adjustments = request.adjustments?.let {
                ScenarioAdjustments(
                    membershipGrowthRate = it.membershipGrowthRate,
                    priceChangePercent = it.priceChangePercent,
                    churnReductionPercent = it.churnReductionPercent,
                    newLocationCount = it.newLocationCount,
                    marketingSpendChange = it.marketingSpendChange,
                    customFactors = it.customFactors
                )
            }
        )
        val scenario = scenarioService.updateScenario(id, command)
        return ResponseEntity.ok(ForecastScenarioResponse.from(scenario, objectMapper))
    }

    @PostMapping("/scenarios/{id}/calculate")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Calculate scenario forecasts")
    fun calculateScenario(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CalculateScenarioRequest
    ): ResponseEntity<ForecastScenarioResponse> {
        val command = CalculateScenarioCommand(
            scenarioId = id,
            forecastMonths = request.forecastMonths
        )
        val scenario = scenarioService.calculateScenario(command)
        return ResponseEntity.ok(ForecastScenarioResponse.from(scenario, objectMapper))
    }

    @PostMapping("/scenarios/{id}/baseline")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Set scenario as baseline")
    fun setAsBaseline(@PathVariable id: UUID): ResponseEntity<ForecastScenarioResponse> {
        val scenario = scenarioService.setAsBaseline(id)
        return ResponseEntity.ok(ForecastScenarioResponse.from(scenario, objectMapper))
    }

    @PostMapping("/scenarios/compare")
    @PreAuthorize("hasAuthority('forecasting_view')")
    @Operation(summary = "Compare multiple scenarios")
    fun compareScenarios(
        @Valid @RequestBody request: CompareScenarioRequest
    ): ResponseEntity<ScenarioComparisonResponse> {
        val comparison = scenarioService.compareScenarios(request.scenarioIds)
        return ResponseEntity.ok(ScenarioComparisonResponse.from(comparison))
    }

    @DeleteMapping("/scenarios/{id}")
    @PreAuthorize("hasAuthority('forecasting_manage')")
    @Operation(summary = "Delete a scenario")
    fun deleteScenario(@PathVariable id: UUID): ResponseEntity<Void> {
        scenarioService.deleteScenario(id)
        return ResponseEntity.noContent().build()
    }
}
