package com.liyaqa.scheduling.domain.model

import com.liyaqa.organization.domain.model.AccessGender
import com.liyaqa.organization.domain.model.GenderRestriction
import com.liyaqa.shared.domain.BaseEntity
import com.liyaqa.shared.domain.LocalizedText
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.util.UUID

/**
 * Represents a gym class definition (e.g., "Yoga Basics", "HIIT Training").
 * This is the template from which ClassSessions are created.
 */
@Entity
@Table(name = "gym_classes")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class GymClass(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "description_en")),
        AttributeOverride(name = "ar", column = Column(name = "description_ar"))
    )
    var description: LocalizedText? = null,

    @Column(name = "location_id", nullable = false)
    var locationId: UUID,

    @Column(name = "default_trainer_id")
    var defaultTrainerId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "class_type", nullable = false)
    var classType: ClassType = ClassType.GROUP_FITNESS,

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty_level", nullable = false)
    var difficultyLevel: DifficultyLevel = DifficultyLevel.ALL_LEVELS,

    @Column(name = "duration_minutes", nullable = false)
    var durationMinutes: Int = 60,

    @Column(name = "max_capacity", nullable = false)
    var maxCapacity: Int = 20,

    @Column(name = "waitlist_enabled", nullable = false)
    var waitlistEnabled: Boolean = true,

    @Column(name = "max_waitlist_size", nullable = false)
    var maxWaitlistSize: Int = 5,

    @Column(name = "requires_subscription", nullable = false)
    var requiresSubscription: Boolean = true,

    @Column(name = "deducts_class_from_plan", nullable = false)
    var deductsClassFromPlan: Boolean = true,

    @Column(name = "color_code")
    var colorCode: String? = null,

    @Column(name = "image_url")
    var imageUrl: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: GymClassStatus = GymClassStatus.ACTIVE,

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    // ==================== GENDER RESTRICTION (Saudi Market) ====================

    /**
     * Gender restriction for this class.
     * null means the class follows the location's gender policy.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender_restriction", length = 20)
    var genderRestriction: GenderRestriction? = null

) : BaseEntity(id) {

    /**
     * Checks if the class allows the given gender to book.
     * Returns true if no restriction is set (follows location policy) or if gender matches restriction.
     */
    fun allowsGender(gender: AccessGender): Boolean = when (genderRestriction) {
        null, GenderRestriction.MIXED -> true
        GenderRestriction.MALE_ONLY -> gender == AccessGender.MALE
        GenderRestriction.FEMALE_ONLY -> gender == AccessGender.FEMALE
    }

    /**
     * Activates the class so sessions can be created.
     */
    fun activate() {
        require(status != GymClassStatus.ARCHIVED) { "Cannot activate archived class" }
        status = GymClassStatus.ACTIVE
    }

    /**
     * Deactivates the class. New sessions cannot be created.
     */
    fun deactivate() {
        require(status == GymClassStatus.ACTIVE) { "Only active classes can be deactivated" }
        status = GymClassStatus.INACTIVE
    }

    /**
     * Archives the class permanently.
     */
    fun archive() {
        status = GymClassStatus.ARCHIVED
    }

    /**
     * Checks if the class is active and can have sessions created.
     */
    fun isActive(): Boolean = status == GymClassStatus.ACTIVE

    /**
     * Updates the capacity. Cannot exceed current bookings in existing sessions.
     */
    fun updateCapacity(newCapacity: Int) {
        require(newCapacity > 0) { "Capacity must be positive" }
        maxCapacity = newCapacity
    }

    /**
     * Assigns a default trainer to this class.
     */
    fun assignDefaultTrainer(trainerId: UUID) {
        this.defaultTrainerId = trainerId
    }

    /**
     * Removes the default trainer assignment.
     */
    fun removeDefaultTrainer() {
        this.defaultTrainerId = null
    }
}
