package com.liyaqa.trainer.infrastructure.persistence

import com.liyaqa.trainer.domain.model.TrainerSkill
import com.liyaqa.trainer.domain.ports.TrainerSkillRepository
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.util.UUID

interface SpringDataTrainerSkillRepository : JpaRepository<TrainerSkill, UUID> {
    fun findByTrainerId(trainerId: UUID): List<TrainerSkill>

    @Modifying
    @Query("DELETE FROM TrainerSkill ts WHERE ts.trainerId = :trainerId")
    fun deleteByTrainerId(trainerId: UUID)

    @Modifying
    @Query("DELETE FROM TrainerSkill ts WHERE ts.trainerId = :trainerId AND ts.categoryId = :categoryId")
    fun deleteByTrainerIdAndCategoryId(trainerId: UUID, categoryId: UUID)
}

@Repository
class JpaTrainerSkillRepository(
    private val springDataRepository: SpringDataTrainerSkillRepository
) : TrainerSkillRepository {

    override fun save(skill: TrainerSkill): TrainerSkill =
        springDataRepository.save(skill)

    override fun saveAll(skills: List<TrainerSkill>): List<TrainerSkill> =
        springDataRepository.saveAll(skills)

    override fun findByTrainerId(trainerId: UUID): List<TrainerSkill> =
        springDataRepository.findByTrainerId(trainerId)

    override fun deleteByTrainerId(trainerId: UUID) =
        springDataRepository.deleteByTrainerId(trainerId)

    override fun deleteByTrainerIdAndCategoryId(trainerId: UUID, categoryId: UUID) =
        springDataRepository.deleteByTrainerIdAndCategoryId(trainerId, categoryId)
}
