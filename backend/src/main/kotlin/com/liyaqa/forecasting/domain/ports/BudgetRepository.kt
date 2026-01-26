package com.liyaqa.forecasting.domain.ports

import com.liyaqa.forecasting.domain.model.Budget
import com.liyaqa.forecasting.domain.model.MetricType
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.util.*

interface BudgetRepository {
    fun save(budget: Budget): Budget
    fun saveAll(budgets: List<Budget>): List<Budget>
    fun findById(id: UUID): Optional<Budget>
    fun findAll(pageable: Pageable): Page<Budget>
    fun findByFiscalYear(year: Int): List<Budget>
    fun findByFiscalYearAndMonth(year: Int, month: Int): List<Budget>
    fun findByFiscalYearAndMetricType(year: Int, metricType: MetricType): List<Budget>
    fun findByYearMonthAndMetricType(year: Int, month: Int, metricType: MetricType): Budget?
    fun deleteById(id: UUID)
    fun existsByYearMonthAndMetricType(year: Int, month: Int, metricType: MetricType): Boolean
}
