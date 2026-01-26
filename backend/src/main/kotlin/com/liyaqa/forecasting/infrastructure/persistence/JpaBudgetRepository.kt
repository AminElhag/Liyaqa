package com.liyaqa.forecasting.infrastructure.persistence

import com.liyaqa.forecasting.domain.model.Budget
import com.liyaqa.forecasting.domain.model.MetricType
import com.liyaqa.forecasting.domain.ports.BudgetRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

interface SpringDataBudgetRepository : JpaRepository<Budget, UUID> {
    fun findByFiscalYear(year: Int): List<Budget>

    fun findByFiscalYearAndFiscalMonth(year: Int, month: Int): List<Budget>

    fun findByFiscalYearAndMetricType(year: Int, metricType: MetricType): List<Budget>

    @Query("""
        SELECT b FROM Budget b
        WHERE b.fiscalYear = :year
        AND b.fiscalMonth = :month
        AND b.metricType = :metricType
    """)
    fun findByYearMonthAndMetricType(
        @Param("year") year: Int,
        @Param("month") month: Int,
        @Param("metricType") metricType: MetricType
    ): Budget?

    @Query("""
        SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END
        FROM Budget b
        WHERE b.fiscalYear = :year
        AND b.fiscalMonth = :month
        AND b.metricType = :metricType
    """)
    fun existsByYearMonthAndMetricType(
        @Param("year") year: Int,
        @Param("month") month: Int,
        @Param("metricType") metricType: MetricType
    ): Boolean
}

@Repository
class JpaBudgetRepository(
    private val springDataRepository: SpringDataBudgetRepository
) : BudgetRepository {

    override fun save(budget: Budget): Budget =
        springDataRepository.save(budget)

    override fun saveAll(budgets: List<Budget>): List<Budget> =
        springDataRepository.saveAll(budgets)

    override fun findById(id: UUID): Optional<Budget> =
        springDataRepository.findById(id)

    override fun findAll(pageable: Pageable): Page<Budget> =
        springDataRepository.findAll(pageable)

    override fun findByFiscalYear(year: Int): List<Budget> =
        springDataRepository.findByFiscalYear(year)

    override fun findByFiscalYearAndMonth(year: Int, month: Int): List<Budget> =
        springDataRepository.findByFiscalYearAndFiscalMonth(year, month)

    override fun findByFiscalYearAndMetricType(year: Int, metricType: MetricType): List<Budget> =
        springDataRepository.findByFiscalYearAndMetricType(year, metricType)

    override fun findByYearMonthAndMetricType(year: Int, month: Int, metricType: MetricType): Budget? =
        springDataRepository.findByYearMonthAndMetricType(year, month, metricType)

    override fun deleteById(id: UUID) =
        springDataRepository.deleteById(id)

    override fun existsByYearMonthAndMetricType(year: Int, month: Int, metricType: MetricType): Boolean =
        springDataRepository.existsByYearMonthAndMetricType(year, month, metricType)
}
