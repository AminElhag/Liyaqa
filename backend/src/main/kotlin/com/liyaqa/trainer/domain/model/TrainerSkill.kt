package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import java.util.UUID

/**
 * Junction entity linking a trainer to a class category they can teach.
 * Replaces free-form specializations with structured category references.
 */
@Entity
@Table(name = "trainer_skills")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class TrainerSkill(
    id: UUID = UUID.randomUUID(),

    @Column(name = "trainer_id", nullable = false)
    val trainerId: UUID,

    @Column(name = "category_id", nullable = false)
    val categoryId: UUID
) : BaseEntity(id) {

    companion object {
        fun create(trainerId: UUID, categoryId: UUID): TrainerSkill {
            return TrainerSkill(
                trainerId = trainerId,
                categoryId = categoryId
            )
        }
    }
}
