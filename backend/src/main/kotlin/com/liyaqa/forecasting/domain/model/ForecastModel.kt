package com.liyaqa.forecasting.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(name = "forecast_models")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ForecastModel(
    id: UUID = UUID.randomUUID(),

    @Enumerated(EnumType.STRING)
    @Column(name = "model_type", nullable = false, length = 30)
    val modelType: ModelType,

    @Enumerated(EnumType.STRING)
    @Column(name = "algorithm", nullable = false, length = 50)
    val algorithm: Algorithm,

    @Column(name = "training_date", nullable = false)
    val trainingDate: Instant,

    @Column(name = "accuracy_mape", precision = 5, scale = 2)
    var accuracyMape: BigDecimal? = null,

    @Column(name = "accuracy_rmse", precision = 15, scale = 2)
    var accuracyRmse: BigDecimal? = null,

    @Column(name = "feature_importance", columnDefinition = "JSONB")
    var featureImportance: String? = null,

    @Column(name = "hyperparameters", columnDefinition = "JSONB")
    var hyperparameters: String? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = false
) : BaseEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    fun updateAccuracy(mape: BigDecimal, rmse: BigDecimal) {
        accuracyMape = mape
        accuracyRmse = rmse
    }
}
