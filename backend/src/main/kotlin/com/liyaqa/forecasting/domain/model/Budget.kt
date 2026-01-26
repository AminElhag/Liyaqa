package com.liyaqa.forecasting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.*

@Entity
@Table(name = "budgets")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Budget(
    id: UUID = UUID.randomUUID(),

    @Column(name = "fiscal_year", nullable = false)
    val fiscalYear: Int,

    @Column(name = "fiscal_month", nullable = false)
    val fiscalMonth: Int,

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 30)
    val metricType: MetricType,

    @Column(name = "budgeted_value", nullable = false, precision = 15, scale = 2)
    var budgetedValue: BigDecimal,

    @Column(name = "actual_value", precision = 15, scale = 2)
    var actualValue: BigDecimal? = null,

    @Column(name = "variance", precision = 15, scale = 2)
    var variance: BigDecimal? = null,

    @Column(name = "variance_percentage", precision = 5, scale = 2)
    var variancePercentage: BigDecimal? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_by")
    val createdBy: UUID? = null
) : BaseEntity(id) {

    fun updateBudget(newBudget: BigDecimal, newNotes: String?) {
        budgetedValue = newBudget
        notes = newNotes
        recalculateVariance()
    }

    fun recordActual(actual: BigDecimal) {
        actualValue = actual
        recalculateVariance()
    }

    private fun recalculateVariance() {
        if (actualValue != null) {
            variance = actualValue!!.subtract(budgetedValue)
            if (budgetedValue != BigDecimal.ZERO) {
                variancePercentage = variance!!
                    .divide(budgetedValue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal(100))
            }
        }
    }

    fun isOnTarget(): Boolean {
        val vp = variancePercentage ?: return true
        return vp.abs() <= BigDecimal(5) // Within 5% variance
    }

    fun isOverBudget(): Boolean {
        val v = variance ?: return false
        return v < BigDecimal.ZERO
    }
}
