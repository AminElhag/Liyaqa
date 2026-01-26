package com.liyaqa.forecasting.application.services

import com.liyaqa.forecasting.application.commands.*
import com.liyaqa.forecasting.domain.model.Budget
import com.liyaqa.forecasting.domain.model.MetricType
import com.liyaqa.forecasting.domain.ports.BudgetRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.*

@Service
@Transactional
class BudgetService(
    private val budgetRepository: BudgetRepository
) {
    private val logger = LoggerFactory.getLogger(BudgetService::class.java)

    fun createBudget(command: CreateBudgetCommand, userId: UUID): Budget {
        if (budgetRepository.existsByYearMonthAndMetricType(
                command.fiscalYear,
                command.fiscalMonth,
                command.metricType
            )
        ) {
            throw IllegalArgumentException(
                "Budget already exists for ${command.fiscalYear}/${command.fiscalMonth} - ${command.metricType}"
            )
        }

        val budget = Budget(
            fiscalYear = command.fiscalYear,
            fiscalMonth = command.fiscalMonth,
            metricType = command.metricType,
            budgetedValue = command.budgetedValue,
            notes = command.notes,
            createdBy = userId
        )

        logger.info("Created budget: ${budget.fiscalYear}/${budget.fiscalMonth} - ${budget.metricType}")
        return budgetRepository.save(budget)
    }

    fun bulkCreateBudgets(command: BulkCreateBudgetsCommand, userId: UUID): List<Budget> {
        val budgets = command.budgets.map { item ->
            Budget(
                fiscalYear = command.fiscalYear,
                fiscalMonth = item.fiscalMonth,
                metricType = item.metricType,
                budgetedValue = item.budgetedValue,
                notes = item.notes,
                createdBy = userId
            )
        }

        logger.info("Created ${budgets.size} budgets for year ${command.fiscalYear}")
        return budgetRepository.saveAll(budgets)
    }

    fun updateBudget(id: UUID, command: UpdateBudgetCommand): Budget {
        val budget = budgetRepository.findById(id)
            .orElseThrow { NoSuchElementException("Budget not found: $id") }

        command.budgetedValue?.let { budget.budgetedValue = it }
        command.notes?.let { budget.notes = it }

        // Recalculate variance if we have actuals
        if (budget.actualValue != null) {
            budget.recordActual(budget.actualValue!!)
        }

        logger.info("Updated budget: $id")
        return budgetRepository.save(budget)
    }

    fun recordActual(command: RecordBudgetActualCommand): Budget {
        val budget = budgetRepository.findByYearMonthAndMetricType(
            command.fiscalYear,
            command.fiscalMonth,
            command.metricType
        ) ?: throw NoSuchElementException(
            "Budget not found for ${command.fiscalYear}/${command.fiscalMonth} - ${command.metricType}"
        )

        budget.recordActual(command.actualValue)
        logger.info("Recorded actual for budget: ${budget.id}")
        return budgetRepository.save(budget)
    }

    @Transactional(readOnly = true)
    fun getBudget(id: UUID): Budget? =
        budgetRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listBudgets(pageable: Pageable): Page<Budget> =
        budgetRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getBudgetsByYear(year: Int): List<Budget> =
        budgetRepository.findByFiscalYear(year)

    @Transactional(readOnly = true)
    fun getBudgetsByYearAndMonth(year: Int, month: Int): List<Budget> =
        budgetRepository.findByFiscalYearAndMonth(year, month)

    @Transactional(readOnly = true)
    fun getBudgetsByYearAndMetricType(year: Int, metricType: MetricType): List<Budget> =
        budgetRepository.findByFiscalYearAndMetricType(year, metricType)

    @Transactional(readOnly = true)
    fun getBudgetVsActualSummary(year: Int): BudgetSummary {
        val budgets = budgetRepository.findByFiscalYear(year)

        val totalBudget = budgets.sumOf { it.budgetedValue }
        val totalActual = budgets.mapNotNull { it.actualValue }.fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }
        val totalVariance = budgets.mapNotNull { it.variance }.fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }

        val onTargetCount = budgets.count { it.isOnTarget() }
        val overBudgetCount = budgets.count { it.isOverBudget() }

        return BudgetSummary(
            year = year,
            totalBudgeted = totalBudget,
            totalActual = totalActual,
            totalVariance = totalVariance,
            budgetCount = budgets.size,
            onTargetCount = onTargetCount,
            overBudgetCount = overBudgetCount,
            byMetricType = budgets.groupBy { it.metricType }.mapValues { (_, metricBudgets) ->
                MetricBudgetSummary(
                    budgeted = metricBudgets.sumOf { it.budgetedValue },
                    actual = metricBudgets.mapNotNull { it.actualValue }
                        .fold(BigDecimal.ZERO) { acc, v -> acc.add(v) },
                    variance = metricBudgets.mapNotNull { it.variance }
                        .fold(BigDecimal.ZERO) { acc, v -> acc.add(v) }
                )
            }
        )
    }

    fun deleteBudget(id: UUID) {
        if (!budgetRepository.findById(id).isPresent) {
            throw NoSuchElementException("Budget not found: $id")
        }
        budgetRepository.deleteById(id)
        logger.info("Deleted budget: $id")
    }
}

data class BudgetSummary(
    val year: Int,
    val totalBudgeted: BigDecimal,
    val totalActual: BigDecimal,
    val totalVariance: BigDecimal,
    val budgetCount: Int,
    val onTargetCount: Int,
    val overBudgetCount: Int,
    val byMetricType: Map<MetricType, MetricBudgetSummary>
)

data class MetricBudgetSummary(
    val budgeted: BigDecimal,
    val actual: BigDecimal,
    val variance: BigDecimal
)
