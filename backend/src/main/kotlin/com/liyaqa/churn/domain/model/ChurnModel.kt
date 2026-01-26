package com.liyaqa.churn.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(name = "churn_models")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ChurnModel(
    id: UUID = UUID.randomUUID(),

    @Column(name = "model_version", nullable = false, length = 20)
    val modelVersion: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "algorithm", nullable = false, length = 50)
    val algorithm: ChurnAlgorithm,

    @Column(name = "accuracy", precision = 5, scale = 4)
    var accuracy: BigDecimal? = null,

    @Column(name = "precision_score", precision = 5, scale = 4)
    var precisionScore: BigDecimal? = null,

    @Column(name = "recall_score", precision = 5, scale = 4)
    var recallScore: BigDecimal? = null,

    @Column(name = "f1_score", precision = 5, scale = 4)
    var f1Score: BigDecimal? = null,

    @Column(name = "auc_score", precision = 5, scale = 4)
    var aucScore: BigDecimal? = null,

    @Column(name = "feature_weights", columnDefinition = "JSONB")
    var featureWeights: String? = null,

    @Column(name = "training_samples")
    var trainingSamples: Int? = null,

    @Column(name = "trained_at", nullable = false)
    val trainedAt: Instant = Instant.now(),

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = false
) : BaseEntity(id) {

    fun activate() {
        isActive = true
    }

    fun deactivate() {
        isActive = false
    }

    fun updateMetrics(
        accuracy: BigDecimal,
        precision: BigDecimal,
        recall: BigDecimal,
        f1: BigDecimal,
        auc: BigDecimal
    ) {
        this.accuracy = accuracy
        this.precisionScore = precision
        this.recallScore = recall
        this.f1Score = f1
        this.aucScore = auc
    }
}
