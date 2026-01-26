package com.liyaqa.churn.application.commands

import com.liyaqa.churn.domain.model.*
import java.time.Instant
import java.util.*

// ========== Churn Model Commands ==========

data class CreateChurnModelCommand(
    val modelVersion: String,
    val algorithm: ChurnAlgorithm
)

data class UpdateChurnModelMetricsCommand(
    val modelId: UUID,
    val accuracy: java.math.BigDecimal,
    val precision: java.math.BigDecimal,
    val recall: java.math.BigDecimal,
    val f1Score: java.math.BigDecimal,
    val aucScore: java.math.BigDecimal,
    val featureWeights: Map<String, Double>? = null
)

// ========== Prediction Commands ==========

data class GeneratePredictionsCommand(
    val memberIds: List<UUID>? = null, // If null, predict for all active members
    val validityDays: Int = 30
)

data class RecordPredictionOutcomeCommand(
    val predictionId: UUID,
    val outcome: ChurnOutcome
)

// ========== Intervention Commands ==========

data class CreateInterventionCommand(
    val predictionId: UUID,
    val interventionType: InterventionType,
    val templateId: UUID? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val assignedTo: UUID? = null,
    val scheduledAt: Instant? = null
)

data class AssignInterventionCommand(
    val interventionId: UUID,
    val assignedTo: UUID
)

data class ExecuteInterventionCommand(
    val interventionId: UUID
)

data class RecordInterventionOutcomeCommand(
    val interventionId: UUID,
    val outcome: InterventionOutcome,
    val notes: String? = null
)

// ========== Template Commands ==========

data class CreateInterventionTemplateCommand(
    val name: String,
    val nameAr: String? = null,
    val interventionType: InterventionType,
    val description: String? = null,
    val descriptionAr: String? = null,
    val messageTemplate: String? = null,
    val messageTemplateAr: String? = null,
    val offerDetails: Map<String, Any>? = null,
    val targetRiskLevels: List<RiskLevel>? = null
)

data class UpdateInterventionTemplateCommand(
    val name: String? = null,
    val nameAr: String? = null,
    val description: String? = null,
    val descriptionAr: String? = null,
    val messageTemplate: String? = null,
    val messageTemplateAr: String? = null,
    val offerDetails: Map<String, Any>? = null,
    val targetRiskLevels: List<RiskLevel>? = null,
    val isActive: Boolean? = null
)
