package com.liyaqa.churn.application.services

import com.fasterxml.jackson.databind.ObjectMapper
import com.liyaqa.churn.application.commands.*
import com.liyaqa.churn.domain.model.*
import com.liyaqa.churn.domain.ports.*
import org.slf4j.LoggerFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@Service
@Transactional
class ChurnPredictionService(
    private val churnModelRepository: ChurnModelRepository,
    private val predictionRepository: MemberChurnPredictionRepository,
    private val featureSnapshotRepository: MemberFeatureSnapshotRepository,
    private val objectMapper: ObjectMapper
) {
    private val logger = LoggerFactory.getLogger(ChurnPredictionService::class.java)

    // ========== Churn Models ==========

    fun createChurnModel(command: CreateChurnModelCommand): ChurnModel {
        val model = ChurnModel(
            modelVersion = command.modelVersion,
            algorithm = command.algorithm
        )
        logger.info("Created churn model: ${model.id} (${model.modelVersion})")
        return churnModelRepository.save(model)
    }

    fun activateChurnModel(id: UUID): ChurnModel {
        val model = churnModelRepository.findById(id)
            .orElseThrow { NoSuchElementException("Churn model not found: $id") }

        // Deactivate existing active model
        churnModelRepository.findActive()?.let {
            it.deactivate()
            churnModelRepository.save(it)
        }

        model.activate()
        logger.info("Activated churn model: ${model.id}")
        return churnModelRepository.save(model)
    }

    fun updateChurnModelMetrics(command: UpdateChurnModelMetricsCommand): ChurnModel {
        val model = churnModelRepository.findById(command.modelId)
            .orElseThrow { NoSuchElementException("Churn model not found: ${command.modelId}") }

        model.updateMetrics(
            accuracy = command.accuracy,
            precision = command.precision,
            recall = command.recall,
            f1 = command.f1Score,
            auc = command.aucScore
        )

        command.featureWeights?.let {
            model.featureWeights = objectMapper.writeValueAsString(it)
        }

        logger.info("Updated metrics for model: ${model.id}")
        return churnModelRepository.save(model)
    }

    @Transactional(readOnly = true)
    fun getChurnModel(id: UUID): ChurnModel? =
        churnModelRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listChurnModels(pageable: Pageable): Page<ChurnModel> =
        churnModelRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getActiveModel(): ChurnModel? =
        churnModelRepository.findActive()

    // ========== Predictions ==========

    fun generatePredictions(command: GeneratePredictionsCommand): List<MemberChurnPrediction> {
        val activeModel = churnModelRepository.findActive()
            ?: throw IllegalStateException("No active churn model found")

        // Get feature snapshots for members
        val memberIds = command.memberIds
        val snapshots = if (memberIds != null) {
            memberIds.mapNotNull { featureSnapshotRepository.findByMemberId(it).lastOrNull() }
        } else {
            // Get all recent snapshots (would typically filter for active members)
            featureSnapshotRepository.findTrainingData(1000)
        }

        val validUntil = Instant.now().plusSeconds(command.validityDays * 24L * 60 * 60)

        val predictions = snapshots.map { snapshot ->
            // Simple prediction logic (would be replaced by actual ML model call)
            val score = calculateChurnScore(snapshot)
            val riskLevel = MemberChurnPrediction.calculateRiskLevel(score)

            val riskFactors = buildRiskFactors(snapshot, score)
            val interventions = suggestInterventions(riskLevel)

            MemberChurnPrediction(
                memberId = snapshot.memberId,
                modelId = activeModel.id,
                churnScore = score,
                riskLevel = riskLevel,
                topRiskFactors = objectMapper.writeValueAsString(riskFactors),
                recommendedInterventions = objectMapper.writeValueAsString(interventions),
                validUntil = validUntil
            )
        }

        logger.info("Generated ${predictions.size} churn predictions")
        return predictionRepository.saveAll(predictions)
    }

    private fun calculateChurnScore(snapshot: MemberFeatureSnapshot): Int {
        // Simple scoring model - would be replaced by ML prediction
        var score = 50

        // Visit frequency (lower = higher risk)
        if (snapshot.daysSinceLastVisit > 30) score += 20
        else if (snapshot.daysSinceLastVisit > 14) score += 10
        else if (snapshot.daysSinceLastVisit < 7) score -= 15

        // Visit count
        if (snapshot.totalVisits30d < 2) score += 15
        else if (snapshot.totalVisits30d > 8) score -= 20

        // Payment behavior
        snapshot.paymentOnTimeRate?.let {
            if (it.toDouble() < 0.7) score += 15
            else if (it.toDouble() > 0.95) score -= 10
        }

        // Engagement score
        snapshot.engagementScore?.let {
            if (it.toDouble() < 0.3) score += 20
            else if (it.toDouble() > 0.7) score -= 15
        }

        // Days until expiry
        snapshot.daysUntilExpiry?.let {
            if (it < 7) score += 15
            else if (it < 14) score += 5
        }

        return score.coerceIn(0, 100)
    }

    private fun buildRiskFactors(snapshot: MemberFeatureSnapshot, score: Int): List<Map<String, Any>> {
        val factors = mutableListOf<Map<String, Any>>()

        if (snapshot.daysSinceLastVisit > 14) {
            factors.add(mapOf(
                "factor" to "LOW_VISIT_RECENCY",
                "weight" to 0.25,
                "description" to "Member hasn't visited in ${snapshot.daysSinceLastVisit} days",
                "descriptionAr" to "لم يزر العضو منذ ${snapshot.daysSinceLastVisit} يوم"
            ))
        }

        if (snapshot.totalVisits30d < 4) {
            factors.add(mapOf(
                "factor" to "LOW_VISIT_FREQUENCY",
                "weight" to 0.2,
                "description" to "Only ${snapshot.totalVisits30d} visits in last 30 days",
                "descriptionAr" to "فقط ${snapshot.totalVisits30d} زيارات في آخر 30 يوم"
            ))
        }

        snapshot.paymentOnTimeRate?.let {
            if (it.toDouble() < 0.8) {
                factors.add(mapOf(
                    "factor" to "PAYMENT_ISSUES",
                    "weight" to 0.2,
                    "description" to "Payment on-time rate is ${(it.toDouble() * 100).toInt()}%",
                    "descriptionAr" to "معدل الدفع في الوقت المحدد ${(it.toDouble() * 100).toInt()}%"
                ))
            }
        }

        snapshot.daysUntilExpiry?.let {
            if (it < 14) {
                factors.add(mapOf(
                    "factor" to "EXPIRING_SOON",
                    "weight" to 0.15,
                    "description" to "Subscription expires in $it days",
                    "descriptionAr" to "تنتهي العضوية خلال $it يوم"
                ))
            }
        }

        return factors.sortedByDescending { it["weight"] as Double }.take(3)
    }

    private fun suggestInterventions(riskLevel: RiskLevel): List<Map<String, Any>> {
        return when (riskLevel) {
            RiskLevel.CRITICAL -> listOf(
                mapOf("type" to "PERSONAL_CALL", "priority" to 1),
                mapOf("type" to "DISCOUNT_OFFER", "priority" to 2),
                mapOf("type" to "FREE_PT_SESSION", "priority" to 3)
            )
            RiskLevel.HIGH -> listOf(
                mapOf("type" to "EMAIL_CAMPAIGN", "priority" to 1),
                mapOf("type" to "DISCOUNT_OFFER", "priority" to 2)
            )
            RiskLevel.MEDIUM -> listOf(
                mapOf("type" to "EMAIL_CAMPAIGN", "priority" to 1),
                mapOf("type" to "SMS_REMINDER", "priority" to 2)
            )
            RiskLevel.LOW -> listOf(
                mapOf("type" to "SMS_REMINDER", "priority" to 1)
            )
        }
    }

    @Transactional(readOnly = true)
    fun getPrediction(id: UUID): MemberChurnPrediction? =
        predictionRepository.findById(id).orElse(null)

    @Transactional(readOnly = true)
    fun listPredictions(pageable: Pageable): Page<MemberChurnPrediction> =
        predictionRepository.findAll(pageable)

    @Transactional(readOnly = true)
    fun getAtRiskMembers(pageable: Pageable): Page<MemberChurnPrediction> =
        predictionRepository.findByRiskLevelIn(listOf(RiskLevel.HIGH, RiskLevel.CRITICAL), pageable)

    @Transactional(readOnly = true)
    fun getPredictionsByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberChurnPrediction> =
        predictionRepository.findByRiskLevel(riskLevel, pageable)

    @Transactional(readOnly = true)
    fun getPendingInterventions(pageable: Pageable): Page<MemberChurnPrediction> =
        predictionRepository.findPendingInterventions(pageable)

    @Transactional(readOnly = true)
    fun getRiskDistribution(): Map<RiskLevel, Long> =
        predictionRepository.countByRiskLevel()

    fun recordPredictionOutcome(command: RecordPredictionOutcomeCommand): MemberChurnPrediction {
        val prediction = predictionRepository.findById(command.predictionId)
            .orElseThrow { NoSuchElementException("Prediction not found: ${command.predictionId}") }

        prediction.recordOutcome(command.outcome)
        logger.info("Recorded outcome ${command.outcome} for prediction: ${command.predictionId}")
        return predictionRepository.save(prediction)
    }

    fun updateInterventionStatus(id: UUID, status: InterventionStatus): MemberChurnPrediction {
        val prediction = predictionRepository.findById(id)
            .orElseThrow { NoSuchElementException("Prediction not found: $id") }

        when (status) {
            InterventionStatus.IN_PROGRESS -> prediction.startIntervention()
            InterventionStatus.COMPLETED -> prediction.completeIntervention()
            InterventionStatus.IGNORED -> prediction.ignoreIntervention()
            else -> {}
        }

        return predictionRepository.save(prediction)
    }
}
