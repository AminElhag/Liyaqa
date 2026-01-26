package com.liyaqa.churn.domain.ports

import com.liyaqa.churn.domain.model.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.LocalDate
import java.util.*

interface ChurnModelRepository {
    fun save(model: ChurnModel): ChurnModel
    fun findById(id: UUID): Optional<ChurnModel>
    fun findAll(pageable: Pageable): Page<ChurnModel>
    fun findActive(): ChurnModel?
    fun findAllActive(): List<ChurnModel>
    fun deleteById(id: UUID)
    fun existsById(id: UUID): Boolean
}

interface MemberChurnPredictionRepository {
    fun save(prediction: MemberChurnPrediction): MemberChurnPrediction
    fun saveAll(predictions: List<MemberChurnPrediction>): List<MemberChurnPrediction>
    fun findById(id: UUID): Optional<MemberChurnPrediction>
    fun findAll(pageable: Pageable): Page<MemberChurnPrediction>
    fun findByMemberId(memberId: UUID): List<MemberChurnPrediction>
    fun findLatestByMemberId(memberId: UUID): MemberChurnPrediction?
    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberChurnPrediction>
    fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable): Page<MemberChurnPrediction>
    fun findByInterventionStatus(status: InterventionStatus, pageable: Pageable): Page<MemberChurnPrediction>
    fun findPendingInterventions(pageable: Pageable): Page<MemberChurnPrediction>
    fun countByRiskLevel(): Map<RiskLevel, Long>
    fun deleteById(id: UUID)
}

interface MemberFeatureSnapshotRepository {
    fun save(snapshot: MemberFeatureSnapshot): MemberFeatureSnapshot
    fun saveAll(snapshots: List<MemberFeatureSnapshot>): List<MemberFeatureSnapshot>
    fun findById(id: UUID): Optional<MemberFeatureSnapshot>
    fun findByMemberId(memberId: UUID): List<MemberFeatureSnapshot>
    fun findByMemberIdAndDate(memberId: UUID, date: LocalDate): MemberFeatureSnapshot?
    fun findBySnapshotDate(date: LocalDate): List<MemberFeatureSnapshot>
    fun findTrainingData(limit: Int): List<MemberFeatureSnapshot>
    fun findWithKnownOutcome(): List<MemberFeatureSnapshot>
    fun deleteByMemberId(memberId: UUID)
}

interface ChurnInterventionRepository {
    fun save(intervention: ChurnIntervention): ChurnIntervention
    fun saveAll(interventions: List<ChurnIntervention>): List<ChurnIntervention>
    fun findById(id: UUID): Optional<ChurnIntervention>
    fun findAll(pageable: Pageable): Page<ChurnIntervention>
    fun findByPredictionId(predictionId: UUID): List<ChurnIntervention>
    fun findByMemberId(memberId: UUID): List<ChurnIntervention>
    fun findByAssignedTo(userId: UUID, pageable: Pageable): Page<ChurnIntervention>
    fun findPending(pageable: Pageable): Page<ChurnIntervention>
    fun findScheduledBefore(until: java.time.Instant): List<ChurnIntervention>
    fun deleteById(id: UUID)
}

interface InterventionTemplateRepository {
    fun save(template: InterventionTemplate): InterventionTemplate
    fun findById(id: UUID): Optional<InterventionTemplate>
    fun findAll(): List<InterventionTemplate>
    fun findByType(type: InterventionType): List<InterventionTemplate>
    fun findActive(): List<InterventionTemplate>
    fun findActiveByType(type: InterventionType): List<InterventionTemplate>
    fun deleteById(id: UUID)
}
