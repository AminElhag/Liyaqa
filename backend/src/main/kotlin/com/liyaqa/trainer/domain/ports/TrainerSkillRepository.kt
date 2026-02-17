package com.liyaqa.trainer.domain.ports

import com.liyaqa.trainer.domain.model.TrainerSkill
import java.util.UUID

interface TrainerSkillRepository {
    fun save(skill: TrainerSkill): TrainerSkill
    fun saveAll(skills: List<TrainerSkill>): List<TrainerSkill>
    fun findByTrainerId(trainerId: UUID): List<TrainerSkill>
    fun deleteByTrainerId(trainerId: UUID)
    fun deleteByTrainerIdAndCategoryId(trainerId: UUID, categoryId: UUID)
}
