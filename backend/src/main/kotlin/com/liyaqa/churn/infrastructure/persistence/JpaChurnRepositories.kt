package com.liyaqa.churn.infrastructure.persistence

import com.liyaqa.churn.domain.model.*
import com.liyaqa.churn.domain.ports.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.LocalDate
import java.util.*

// ========== Churn Model ==========

interface SpringDataChurnModelRepository : JpaRepository<ChurnModel, UUID> {
    @Query("SELECT m FROM ChurnModel m WHERE m.isActive = true")
    fun findActive(): ChurnModel?

    @Query("SELECT m FROM ChurnModel m WHERE m.isActive = true")
    fun findAllActive(): List<ChurnModel>
}

@Repository
class JpaChurnModelRepository(
    private val repo: SpringDataChurnModelRepository
) : ChurnModelRepository {
    override fun save(model: ChurnModel) = repo.save(model)
    override fun findById(id: UUID) = repo.findById(id)
    override fun findAll(pageable: Pageable) = repo.findAll(pageable)
    override fun findActive() = repo.findActive()
    override fun findAllActive() = repo.findAllActive()
    override fun deleteById(id: UUID) = repo.deleteById(id)
    override fun existsById(id: UUID) = repo.existsById(id)
}

// ========== Member Churn Prediction ==========

interface SpringDataMemberChurnPredictionRepository : JpaRepository<MemberChurnPrediction, UUID> {
    fun findByMemberId(memberId: UUID): List<MemberChurnPrediction>

    @Query("SELECT p FROM MemberChurnPrediction p WHERE p.memberId = :memberId ORDER BY p.predictionDate DESC")
    fun findLatestByMemberId(@Param("memberId") memberId: UUID, pageable: Pageable): List<MemberChurnPrediction>

    fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable): Page<MemberChurnPrediction>

    fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable): Page<MemberChurnPrediction>

    fun findByInterventionStatus(status: InterventionStatus, pageable: Pageable): Page<MemberChurnPrediction>

    @Query("SELECT p FROM MemberChurnPrediction p WHERE p.interventionStatus = 'PENDING' AND p.riskLevel IN ('HIGH', 'CRITICAL') ORDER BY p.churnScore DESC")
    fun findPendingInterventions(pageable: Pageable): Page<MemberChurnPrediction>

    @Query("SELECT p.riskLevel, COUNT(p) FROM MemberChurnPrediction p GROUP BY p.riskLevel")
    fun countByRiskLevelRaw(): List<Array<Any>>
}

@Repository
class JpaMemberChurnPredictionRepository(
    private val repo: SpringDataMemberChurnPredictionRepository
) : MemberChurnPredictionRepository {
    override fun save(prediction: MemberChurnPrediction) = repo.save(prediction)
    override fun saveAll(predictions: List<MemberChurnPrediction>) = repo.saveAll(predictions)
    override fun findById(id: UUID) = repo.findById(id)
    override fun findAll(pageable: Pageable) = repo.findAll(pageable)
    override fun findByMemberId(memberId: UUID) = repo.findByMemberId(memberId)
    override fun findLatestByMemberId(memberId: UUID): MemberChurnPrediction? =
        repo.findLatestByMemberId(memberId, PageRequest.of(0, 1)).firstOrNull()
    override fun findByRiskLevel(riskLevel: RiskLevel, pageable: Pageable) =
        repo.findByRiskLevel(riskLevel, pageable)
    override fun findByRiskLevelIn(riskLevels: List<RiskLevel>, pageable: Pageable) =
        repo.findByRiskLevelIn(riskLevels, pageable)
    override fun findByInterventionStatus(status: InterventionStatus, pageable: Pageable) =
        repo.findByInterventionStatus(status, pageable)
    override fun findPendingInterventions(pageable: Pageable) =
        repo.findPendingInterventions(pageable)
    override fun countByRiskLevel(): Map<RiskLevel, Long> =
        repo.countByRiskLevelRaw().associate { it[0] as RiskLevel to it[1] as Long }
    override fun deleteById(id: UUID) = repo.deleteById(id)
}

// ========== Member Feature Snapshot ==========

interface SpringDataMemberFeatureSnapshotRepository : JpaRepository<MemberFeatureSnapshot, UUID> {
    fun findByMemberId(memberId: UUID): List<MemberFeatureSnapshot>

    @Query("SELECT s FROM MemberFeatureSnapshot s WHERE s.memberId = :memberId AND s.snapshotDate = :date")
    fun findByMemberIdAndDate(@Param("memberId") memberId: UUID, @Param("date") date: LocalDate): MemberFeatureSnapshot?

    fun findBySnapshotDate(date: LocalDate): List<MemberFeatureSnapshot>

    @Query("SELECT s FROM MemberFeatureSnapshot s WHERE s.churned IS NOT NULL ORDER BY s.snapshotDate DESC")
    fun findWithKnownOutcome(): List<MemberFeatureSnapshot>

    fun deleteByMemberId(memberId: UUID)
}

@Repository
class JpaMemberFeatureSnapshotRepository(
    private val repo: SpringDataMemberFeatureSnapshotRepository
) : MemberFeatureSnapshotRepository {
    override fun save(snapshot: MemberFeatureSnapshot) = repo.save(snapshot)
    override fun saveAll(snapshots: List<MemberFeatureSnapshot>) = repo.saveAll(snapshots)
    override fun findById(id: UUID) = repo.findById(id)
    override fun findByMemberId(memberId: UUID) = repo.findByMemberId(memberId)
    override fun findByMemberIdAndDate(memberId: UUID, date: LocalDate) =
        repo.findByMemberIdAndDate(memberId, date)
    override fun findBySnapshotDate(date: LocalDate) = repo.findBySnapshotDate(date)
    override fun findTrainingData(limit: Int) =
        repo.findWithKnownOutcome().take(limit)
    override fun findWithKnownOutcome() = repo.findWithKnownOutcome()
    override fun deleteByMemberId(memberId: UUID) = repo.deleteByMemberId(memberId)
}

// ========== Churn Intervention ==========

interface SpringDataChurnInterventionRepository : JpaRepository<ChurnIntervention, UUID> {
    fun findByPredictionId(predictionId: UUID): List<ChurnIntervention>
    fun findByMemberId(memberId: UUID): List<ChurnIntervention>
    fun findByAssignedTo(userId: UUID, pageable: Pageable): Page<ChurnIntervention>

    @Query("SELECT i FROM ChurnIntervention i WHERE i.executedAt IS NULL AND i.outcome IS NULL ORDER BY i.createdAt ASC")
    fun findPending(pageable: Pageable): Page<ChurnIntervention>

    @Query("SELECT i FROM ChurnIntervention i WHERE i.scheduledAt IS NOT NULL AND i.scheduledAt <= :until AND i.executedAt IS NULL")
    fun findScheduledBefore(@Param("until") until: Instant): List<ChurnIntervention>
}

@Repository
class JpaChurnInterventionRepository(
    private val repo: SpringDataChurnInterventionRepository
) : ChurnInterventionRepository {
    override fun save(intervention: ChurnIntervention) = repo.save(intervention)
    override fun saveAll(interventions: List<ChurnIntervention>) = repo.saveAll(interventions)
    override fun findById(id: UUID) = repo.findById(id)
    override fun findAll(pageable: Pageable) = repo.findAll(pageable)
    override fun findByPredictionId(predictionId: UUID) = repo.findByPredictionId(predictionId)
    override fun findByMemberId(memberId: UUID) = repo.findByMemberId(memberId)
    override fun findByAssignedTo(userId: UUID, pageable: Pageable) = repo.findByAssignedTo(userId, pageable)
    override fun findPending(pageable: Pageable) = repo.findPending(pageable)
    override fun findScheduledBefore(until: Instant) = repo.findScheduledBefore(until)
    override fun deleteById(id: UUID) = repo.deleteById(id)
}

// ========== Intervention Template ==========

interface SpringDataInterventionTemplateRepository : JpaRepository<InterventionTemplate, UUID> {
    fun findByInterventionType(type: InterventionType): List<InterventionTemplate>

    @Query("SELECT t FROM InterventionTemplate t WHERE t.isActive = true")
    fun findActive(): List<InterventionTemplate>

    @Query("SELECT t FROM InterventionTemplate t WHERE t.isActive = true AND t.interventionType = :type")
    fun findActiveByType(@Param("type") type: InterventionType): List<InterventionTemplate>
}

@Repository
class JpaInterventionTemplateRepository(
    private val repo: SpringDataInterventionTemplateRepository
) : InterventionTemplateRepository {
    override fun save(template: InterventionTemplate) = repo.save(template)
    override fun findById(id: UUID) = repo.findById(id)
    override fun findAll() = repo.findAll()
    override fun findByType(type: InterventionType) = repo.findByInterventionType(type)
    override fun findActive() = repo.findActive()
    override fun findActiveByType(type: InterventionType) = repo.findActiveByType(type)
    override fun deleteById(id: UUID) = repo.deleteById(id)
}
