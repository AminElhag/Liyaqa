package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Association entity for the many-to-many relationship between trainers and clubs.
 *
 * A trainer can be assigned to multiple clubs within the same organization.
 * Each assignment tracks:
 * - Whether this is the trainer's primary club
 * - The status of the assignment (active/inactive)
 */
@Entity
@Table(
    name = "trainer_club_assignments",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["trainer_id", "club_id"])
    ]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class TrainerClubAssignment(
    id: UUID = UUID.randomUUID(),

    /**
     * The trainer being assigned.
     */
    @Column(name = "trainer_id", nullable = false)
    var trainerId: UUID,

    /**
     * The club the trainer is assigned to.
     */
    @Column(name = "club_id", nullable = false)
    var clubId: UUID,

    /**
     * Whether this is the trainer's primary club.
     * A trainer can only have one primary club.
     */
    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    /**
     * Status of this assignment.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: TrainerClubAssignmentStatus = TrainerClubAssignmentStatus.ACTIVE

) : BaseEntity(id) {

    // ========== Status Transitions ==========

    fun activate() {
        status = TrainerClubAssignmentStatus.ACTIVE
    }

    fun deactivate() {
        status = TrainerClubAssignmentStatus.INACTIVE
    }

    fun makePrimary() {
        isPrimary = true
    }

    fun makeSecondary() {
        isPrimary = false
    }

    // ========== Query Helpers ==========

    fun isActive(): Boolean = status == TrainerClubAssignmentStatus.ACTIVE

    companion object {
        /**
         * Create a new trainer-club assignment.
         * Note: tenantId is automatically set from TenantContext in prePersist.
         */
        fun create(
            trainerId: UUID,
            clubId: UUID,
            isPrimary: Boolean = false
        ): TrainerClubAssignment {
            return TrainerClubAssignment(
                trainerId = trainerId,
                clubId = clubId,
                isPrimary = isPrimary
            )
        }
    }
}
