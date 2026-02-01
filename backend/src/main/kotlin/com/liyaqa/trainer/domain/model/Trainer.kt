package com.liyaqa.trainer.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationAwareEntity
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
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Period
import java.util.UUID

/**
 * Trainer entity representing a service provider who teaches classes
 * and/or provides personal training sessions.
 *
 * Key features:
 * - Extends OrganizationAwareEntity for multi-club support
 * - Trainers can work across multiple clubs within the same organization
 * - Supports bilingual profile (bio, notes)
 * - Tracks qualifications (specializations, certifications as JSON)
 * - Stores availability pattern for PT booking
 * - Includes compensation information
 */
@Entity
@Table(name = "trainers")
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class Trainer(
    id: UUID = UUID.randomUUID(),

    /**
     * Link to the User account. Required - a trainer must have a user account.
     * The user should have the TRAINER role.
     */
    @Column(name = "user_id", nullable = false)
    var userId: UUID,

    // ========== Basic Info ==========

    /**
     * Display name of the trainer (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "display_name_en")),
        AttributeOverride(name = "ar", column = Column(name = "display_name_ar"))
    )
    var displayName: LocalizedText? = null,

    /**
     * Date of birth of the trainer.
     */
    @Column(name = "date_of_birth")
    var dateOfBirth: LocalDate? = null,

    /**
     * Gender of the trainer.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    var gender: Gender? = null,

    // ========== Profile ==========

    /**
     * Bilingual biography/description of the trainer.
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "bio_en")),
        AttributeOverride(name = "ar", column = Column(name = "bio_ar"))
    )
    var bio: LocalizedText? = null,

    /**
     * URL to the trainer's profile image.
     */
    @Column(name = "profile_image_url", length = 500)
    var profileImageUrl: String? = null,

    /**
     * Number of years of training experience.
     */
    @Column(name = "experience_years")
    var experienceYears: Int? = null,

    // ========== Classification ==========

    /**
     * How the trainer is contracted with the gym.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 50)
    var employmentType: TrainerEmploymentType = TrainerEmploymentType.INDEPENDENT_CONTRACTOR,

    /**
     * Type of training the trainer provides.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "trainer_type", nullable = false, length = 50)
    var trainerType: TrainerType = TrainerType.GROUP_FITNESS,

    // ========== Qualifications (stored as JSON) ==========

    /**
     * List of specializations as JSON array.
     * Example: ["Yoga", "Pilates", "CrossFit", "HIIT"]
     */
    @Column(name = "specializations", columnDefinition = "TEXT")
    var specializations: String? = null,

    /**
     * List of certifications as JSON array with expiration dates.
     * Example: [{"name": "NASM-CPT", "issuedBy": "NASM", "expiresAt": "2025-12-31"}]
     */
    @Column(name = "certifications", columnDefinition = "TEXT")
    var certifications: String? = null,

    // ========== Availability ==========

    /**
     * Weekly availability pattern for personal training as JSON.
     * Example: {"MON": [{"start": "09:00", "end": "12:00"}, {"start": "14:00", "end": "18:00"}], ...}
     */
    @Column(name = "availability", columnDefinition = "TEXT")
    var availability: String? = null,

    // ========== Compensation ==========

    /**
     * Hourly rate for the trainer (for group classes).
     */
    @Column(name = "hourly_rate", precision = 10, scale = 2)
    var hourlyRate: BigDecimal? = null,

    /**
     * Rate for personal training sessions.
     */
    @Column(name = "pt_session_rate", precision = 10, scale = 2)
    var ptSessionRate: BigDecimal? = null,

    /**
     * Compensation model used for this trainer.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "compensation_model", length = 50)
    var compensationModel: CompensationModel? = null,

    // ========== Status ==========

    /**
     * Current status of the trainer.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: TrainerStatus = TrainerStatus.ACTIVE,

    // ========== Contact ==========

    /**
     * Phone number (optional override of user's phone).
     */
    @Column(name = "phone", length = 50)
    var phone: String? = null,

    // ========== Notes ==========

    /**
     * Internal notes about the trainer (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null,

    // ========== Gender Preferences (Saudi Market) ==========

    /**
     * Preferred client gender for PT sessions.
     * In Saudi Arabia, trainers may only work with clients of the same gender.
     * null means the trainer works with all genders.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_client_gender", length = 20)
    var preferredClientGender: Gender? = null

) : OrganizationAwareEntity(id) {

    /**
     * Checks if the trainer can work with a client of the given gender.
     * Returns true if no preference is set or if the gender matches.
     */
    fun canWorkWithClientGender(clientGender: Gender?): Boolean {
        if (preferredClientGender == null || clientGender == null) return true
        return preferredClientGender == clientGender
    }

    // ========== Status Transitions ==========

    fun activate() {
        require(status != TrainerStatus.TERMINATED) { "Cannot activate a terminated trainer" }
        status = TrainerStatus.ACTIVE
    }

    fun deactivate() {
        require(status == TrainerStatus.ACTIVE) { "Can only deactivate an active trainer" }
        status = TrainerStatus.INACTIVE
    }

    fun setOnLeave() {
        require(status == TrainerStatus.ACTIVE) { "Can only set leave for an active trainer" }
        status = TrainerStatus.ON_LEAVE
    }

    fun terminate() {
        status = TrainerStatus.TERMINATED
    }

    fun returnFromLeave() {
        require(status == TrainerStatus.ON_LEAVE) { "Trainer is not on leave" }
        status = TrainerStatus.ACTIVE
    }

    // ========== Profile Updates ==========

    fun updateProfile(
        bio: LocalizedText? = this.bio,
        profileImageUrl: String? = this.profileImageUrl,
        experienceYears: Int? = this.experienceYears,
        phone: String? = this.phone
    ) {
        this.bio = bio
        this.profileImageUrl = profileImageUrl
        this.experienceYears = experienceYears
        this.phone = phone
    }

    fun updateClassification(
        employmentType: TrainerEmploymentType = this.employmentType,
        trainerType: TrainerType = this.trainerType
    ) {
        this.employmentType = employmentType
        this.trainerType = trainerType
    }

    fun updateCompensation(
        hourlyRate: BigDecimal? = this.hourlyRate,
        ptSessionRate: BigDecimal? = this.ptSessionRate,
        compensationModel: CompensationModel? = this.compensationModel
    ) {
        this.hourlyRate = hourlyRate
        this.ptSessionRate = ptSessionRate
        this.compensationModel = compensationModel
    }

    fun updateQualifications(
        specializations: String? = this.specializations,
        certifications: String? = this.certifications
    ) {
        this.specializations = specializations
        this.certifications = certifications
    }

    fun updateAvailability(availability: String?) {
        this.availability = availability
    }

    fun updateNotes(notes: LocalizedText?) {
        this.notes = notes
    }

    // ========== Basic Info Updates ==========

    fun updateBasicInfo(
        displayName: LocalizedText? = this.displayName,
        dateOfBirth: LocalDate? = this.dateOfBirth,
        gender: Gender? = this.gender
    ) {
        this.displayName = displayName
        this.dateOfBirth = dateOfBirth
        this.gender = gender
    }

    /**
     * Calculate age from date of birth.
     */
    fun getAge(): Int? {
        return dateOfBirth?.let {
            Period.between(it, LocalDate.now()).years
        }
    }

    // ========== Query Helpers ==========

    fun isActive(): Boolean = status == TrainerStatus.ACTIVE

    fun canTeachClasses(): Boolean =
        status == TrainerStatus.ACTIVE &&
        (trainerType == TrainerType.GROUP_FITNESS || trainerType == TrainerType.HYBRID)

    fun canProvidePersonalTraining(): Boolean =
        status == TrainerStatus.ACTIVE &&
        (trainerType == TrainerType.PERSONAL_TRAINER || trainerType == TrainerType.HYBRID)

    companion object {
        fun create(
            userId: UUID,
            organizationId: UUID,
            tenantId: UUID,
            employmentType: TrainerEmploymentType = TrainerEmploymentType.INDEPENDENT_CONTRACTOR,
            trainerType: TrainerType = TrainerType.GROUP_FITNESS,
            displayName: LocalizedText? = null,
            dateOfBirth: LocalDate? = null,
            gender: Gender? = null
        ): Trainer {
            return Trainer(
                userId = userId,
                displayName = displayName,
                dateOfBirth = dateOfBirth,
                gender = gender,
                employmentType = employmentType,
                trainerType = trainerType
            ).apply {
                setTenantAndOrganization(tenantId, organizationId)
            }
        }
    }
}
