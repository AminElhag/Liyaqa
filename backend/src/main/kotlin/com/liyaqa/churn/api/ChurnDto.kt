package com.liyaqa.churn.api

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.churn.domain.model.*
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.Instant
import java.util.*

// ========== Request DTOs ==========

data class CreateChurnModelRequest(
    @field:NotBlank(message = "Model version is required")
    @field:Size(max = 20)
    val modelVersion: String,

    @field:NotNull(message = "Algorithm is required")
    val algorithm: ChurnAlgorithm
)

data class UpdateChurnModelMetricsRequest(
    @field:NotNull @field:DecimalMin("0") @field:DecimalMax("1")
    val accuracy: BigDecimal,

    @field:NotNull @field:DecimalMin("0") @field:DecimalMax("1")
    val precision: BigDecimal,

    @field:NotNull @field:DecimalMin("0") @field:DecimalMax("1")
    val recall: BigDecimal,

    @field:NotNull @field:DecimalMin("0") @field:DecimalMax("1")
    val f1Score: BigDecimal,

    @field:NotNull @field:DecimalMin("0") @field:DecimalMax("1")
    val aucScore: BigDecimal,

    val featureWeights: Map<String, Double>? = null
)

data class GeneratePredictionsRequest(
    val memberIds: List<UUID>? = null,
    @field:Min(1) @field:Max(90)
    val validityDays: Int = 30
)

data class RecordOutcomeRequest(
    @field:NotNull(message = "Outcome is required")
    val outcome: ChurnOutcome
)

data class CreateInterventionRequest(
    @field:NotNull(message = "Prediction ID is required")
    val predictionId: UUID,

    @field:NotNull(message = "Intervention type is required")
    val interventionType: InterventionType,

    val templateId: UUID? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val assignedTo: UUID? = null,
    val scheduledAt: Instant? = null
)

data class AssignInterventionRequest(
    @field:NotNull(message = "User ID is required")
    val assignedTo: UUID
)

data class RecordInterventionOutcomeRequest(
    @field:NotNull(message = "Outcome is required")
    val outcome: InterventionOutcome,
    val notes: String? = null
)

data class CreateInterventionTemplateRequest(
    @field:NotBlank(message = "Name is required")
    @field:Size(max = 100)
    val name: String,

    @field:Size(max = 100)
    val nameAr: String? = null,

    @field:NotNull(message = "Intervention type is required")
    val interventionType: InterventionType,

    val description: String? = null,
    val descriptionAr: String? = null,
    val messageTemplate: String? = null,
    val messageTemplateAr: String? = null,
    val offerDetails: Map<String, Any>? = null,
    val targetRiskLevels: List<RiskLevel>? = null
)

data class UpdateInterventionTemplateRequest(
    @field:Size(max = 100)
    val name: String? = null,
    @field:Size(max = 100)
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val messageTemplate: String? = null,
    val messageTemplateAr: String? = null,
    val offerDetails: Map<String, Any>? = null,
    val targetRiskLevels: List<RiskLevel>? = null,
    val isActive: Boolean? = null
)

// ========== Response DTOs ==========

data class ChurnModelResponse(
    val id: UUID,
    val modelVersion: String,
    val algorithm: ChurnAlgorithm,
    val accuracy: BigDecimal?,
    val precisionScore: BigDecimal?,
    val recallScore: BigDecimal?,
    val f1Score: BigDecimal?,
    val aucScore: BigDecimal?,
    val featureWeights: Map<String, Double>?,
    val trainingSamples: Int?,
    val trainedAt: Instant,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(model: ChurnModel, objectMapper: ObjectMapper): ChurnModelResponse {
            val weights = model.featureWeights?.let {
                try {
                    @Suppress("UNCHECKED_CAST")
                    objectMapper.readValue(it, Map::class.java) as Map<String, Double>
                } catch (e: Exception) { null }
            }

            return ChurnModelResponse(
                id = model.id,
                modelVersion = model.modelVersion,
                algorithm = model.algorithm,
                accuracy = model.accuracy,
                precisionScore = model.precisionScore,
                recallScore = model.recallScore,
                f1Score = model.f1Score,
                aucScore = model.aucScore,
                featureWeights = weights,
                trainingSamples = model.trainingSamples,
                trainedAt = model.trainedAt,
                isActive = model.isActive,
                createdAt = model.createdAt,
                updatedAt = model.updatedAt
            )
        }
    }
}

data class MemberChurnPredictionResponse(
    val id: UUID,
    val memberId: UUID,
    val modelId: UUID,
    val churnScore: Int,
    val riskLevel: RiskLevel,
    val topRiskFactors: List<RiskFactor>?,
    val recommendedInterventions: List<RecommendedIntervention>?,
    val predictionDate: Instant,
    val validUntil: Instant?,
    val interventionStatus: InterventionStatus,
    val actualOutcome: ChurnOutcome?,
    val outcomeDate: Instant?,
    val isExpired: Boolean,
    val createdAt: Instant
) {
    companion object {
        fun from(prediction: MemberChurnPrediction, objectMapper: ObjectMapper): MemberChurnPredictionResponse {
            val riskFactors = prediction.topRiskFactors?.let {
                try {
                    objectMapper.readValue(it, objectMapper.typeFactory
                        .constructCollectionType(List::class.java, RiskFactor::class.java))
                } catch (e: Exception) { null }
            }

            val interventions = prediction.recommendedInterventions?.let {
                try {
                    objectMapper.readValue(it, objectMapper.typeFactory
                        .constructCollectionType(List::class.java, RecommendedIntervention::class.java))
                } catch (e: Exception) { null }
            }

            return MemberChurnPredictionResponse(
                id = prediction.id,
                memberId = prediction.memberId,
                modelId = prediction.modelId,
                churnScore = prediction.churnScore,
                riskLevel = prediction.riskLevel,
                topRiskFactors = riskFactors,
                recommendedInterventions = interventions,
                predictionDate = prediction.predictionDate,
                validUntil = prediction.validUntil,
                interventionStatus = prediction.interventionStatus,
                actualOutcome = prediction.actualOutcome,
                outcomeDate = prediction.outcomeDate,
                isExpired = prediction.isExpired(),
                createdAt = prediction.createdAt
            )
        }
    }
}

data class RiskFactor(
    val factor: String,
    val weight: Double,
    val description: String,
    val descriptionAr: String?
)

data class RecommendedIntervention(
    val type: String,
    val priority: Int
)

data class ChurnInterventionResponse(
    val id: UUID,
    val predictionId: UUID,
    val memberId: UUID,
    val interventionType: InterventionType,
    val templateId: UUID?,
    val description: String?,
    val descriptionAr: String?,
    val assignedTo: UUID?,
    val scheduledAt: Instant?,
    val executedAt: Instant?,
    val outcome: InterventionOutcome?,
    val outcomeNotes: String?,
    val createdBy: UUID?,
    val isPending: Boolean,
    val isCompleted: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(intervention: ChurnIntervention): ChurnInterventionResponse = ChurnInterventionResponse(
            id = intervention.id,
            predictionId = intervention.predictionId,
            memberId = intervention.memberId,
            interventionType = intervention.interventionType,
            templateId = intervention.interventionTemplateId,
            description = intervention.description,
            descriptionAr = intervention.descriptionAr,
            assignedTo = intervention.assignedTo,
            scheduledAt = intervention.scheduledAt,
            executedAt = intervention.executedAt,
            outcome = intervention.outcome,
            outcomeNotes = intervention.outcomeNotes,
            createdBy = intervention.createdBy,
            isPending = intervention.isPending(),
            isCompleted = intervention.isCompleted(),
            createdAt = intervention.createdAt,
            updatedAt = intervention.updatedAt
        )
    }
}

data class InterventionTemplateResponse(
    val id: UUID,
    val name: String,
    val nameAr: String?,
    val interventionType: InterventionType,
    val description: String?,
    val descriptionAr: String?,
    val messageTemplate: String?,
    val messageTemplateAr: String?,
    val offerDetails: Map<String, Any>?,
    val targetRiskLevels: List<RiskLevel>?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(template: InterventionTemplate, objectMapper: ObjectMapper): InterventionTemplateResponse {
            val offer = template.offerDetails?.let {
                try {
                    @Suppress("UNCHECKED_CAST")
                    objectMapper.readValue(it, Map::class.java) as Map<String, Any>
                } catch (e: Exception) { null }
            }

            val levels = template.targetRiskLevels?.let {
                try {
                    objectMapper.readValue(it, objectMapper.typeFactory
                        .constructCollectionType(List::class.java, RiskLevel::class.java))
                } catch (e: Exception) { null }
            }

            return InterventionTemplateResponse(
                id = template.id,
                name = template.name,
                nameAr = template.nameAr,
                interventionType = template.interventionType,
                description = template.description,
                descriptionAr = template.descriptionAr,
                messageTemplate = template.messageTemplate,
                messageTemplateAr = template.messageTemplateAr,
                offerDetails = offer,
                targetRiskLevels = levels,
                isActive = template.isActive,
                createdAt = template.createdAt,
                updatedAt = template.updatedAt
            )
        }
    }
}

data class RiskDistributionResponse(
    val low: Long,
    val medium: Long,
    val high: Long,
    val critical: Long,
    val total: Long
) {
    companion object {
        fun from(distribution: Map<RiskLevel, Long>): RiskDistributionResponse {
            val low = distribution[RiskLevel.LOW] ?: 0
            val medium = distribution[RiskLevel.MEDIUM] ?: 0
            val high = distribution[RiskLevel.HIGH] ?: 0
            val critical = distribution[RiskLevel.CRITICAL] ?: 0

            return RiskDistributionResponse(
                low = low,
                medium = medium,
                high = high,
                critical = critical,
                total = low + medium + high + critical
            )
        }
    }
}

data class PageResponse<T>(
    val content: List<T>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val first: Boolean,
    val last: Boolean
)
