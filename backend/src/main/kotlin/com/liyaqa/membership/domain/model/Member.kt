package com.liyaqa.membership.domain.model

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
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.ParamDef
import org.hibernate.type.SqlTypes
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "members")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class Member(
    id: UUID = UUID.randomUUID(),

    @Column(name = "user_id")
    var userId: UUID? = null,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "first_name_en", nullable = true)),
        AttributeOverride(name = "ar", column = Column(name = "first_name_ar"))
    )
    var firstName: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "last_name_en", nullable = true)),
        AttributeOverride(name = "ar", column = Column(name = "last_name_ar"))
    )
    var lastName: LocalizedText,

    @Column(name = "email", nullable = false)
    var email: String,

    @Column(name = "phone")
    var phone: String? = null,

    @Column(name = "date_of_birth")
    var dateOfBirth: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: MemberStatus = MemberStatus.ACTIVE,

    @Embedded
    var address: Address? = null,

    @Column(name = "emergency_contact_name")
    var emergencyContactName: String? = null,

    @Column(name = "emergency_contact_phone")
    var emergencyContactPhone: String? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    // New fields for enhanced registration
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    var gender: Gender? = null,

    @Column(name = "nationality")
    var nationality: String? = null,

    @Column(name = "national_id")
    var nationalId: String? = null,

    @Column(name = "registration_notes", columnDefinition = "TEXT")
    var registrationNotes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_language")
    var preferredLanguage: Language = Language.EN,

    // WhatsApp communication preferences (Saudi market)
    @Column(name = "whatsapp_opted_in")
    var whatsappOptedIn: Boolean = false,

    @Column(name = "whatsapp_number")
    var whatsappNumber: String? = null,

    // ==========================================
    // ENHANCED PROFILE FIELDS (Phase 5)
    // ==========================================

    // Fitness goals and preferences
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fitness_goals", columnDefinition = "jsonb")
    var fitnessGoals: List<FitnessGoal>? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_trainer_gender")
    var preferredTrainerGender: Gender? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferred_class_types", columnDefinition = "jsonb")
    var preferredClassTypes: List<String>? = null,

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "communication_preferences", columnDefinition = "jsonb")
    var communicationPreferences: CommunicationPreferences? = null,

    // Profile tracking
    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    var profilePhotoUrl: String? = null,

    @Column(name = "profile_completeness")
    var profileCompleteness: Int = 0,

    // Loyalty tracking
    @Enumerated(EnumType.STRING)
    @Column(name = "loyalty_tier")
    var loyaltyTier: LoyaltyTier? = null,

    @Column(name = "loyalty_points")
    var loyaltyPoints: Int = 0,

    @Column(name = "referral_count")
    var referralCount: Int = 0,

    // Family membership
    @Column(name = "primary_member_id")
    var primaryMemberId: UUID? = null,

    @Column(name = "relationship_to_primary")
    var relationshipToPrimary: String? = null,

    // Corporate membership
    @Column(name = "company_name")
    var companyName: String? = null,

    @Column(name = "company_id")
    var companyId: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "corporate_billing_type")
    var corporateBillingType: CorporateBillingType? = null

) : BaseEntity(id) {

    val fullName: LocalizedText
        get() {
            // Build English full name (use Arabic fallback if English is empty)
            val enFirst = firstName.en.ifBlank { firstName.ar ?: "" }
            val enLast = lastName.en.ifBlank { lastName.ar ?: "" }
            val fullEn = listOf(enFirst, enLast).filter { it.isNotBlank() }.joinToString(" ")

            // Build Arabic full name
            val fullAr = if (firstName.ar != null || lastName.ar != null) {
                val arFirst = firstName.ar ?: firstName.en
                val arLast = lastName.ar ?: lastName.en
                listOf(arFirst, arLast).filter { it.isNotBlank() }.joinToString(" ")
            } else null

            return LocalizedText(en = fullEn, ar = fullAr)
        }

    fun activate() {
        require(status != MemberStatus.ACTIVE) { "Member is already active" }
        status = MemberStatus.ACTIVE
    }

    fun suspend() {
        require(status == MemberStatus.ACTIVE) { "Only active members can be suspended" }
        status = MemberStatus.SUSPENDED
    }

    fun cancel() {
        require(status != MemberStatus.CANCELLED) { "Member is already cancelled" }
        status = MemberStatus.CANCELLED
    }

    fun freeze() {
        require(status == MemberStatus.ACTIVE) { "Only active members can be frozen" }
        status = MemberStatus.FROZEN
    }

    fun unfreeze() {
        require(status == MemberStatus.FROZEN) { "Only frozen members can be unfrozen" }
        status = MemberStatus.ACTIVE
    }

    /**
     * Links this member to a user account.
     */
    fun linkToUser(userId: UUID) {
        this.userId = userId
    }

    /**
     * Unlinks this member from any user account.
     */
    fun unlinkUser() {
        this.userId = null
    }

    /**
     * Checks if this member has a linked user account.
     */
    fun hasUserAccount(): Boolean = userId != null

    /**
     * Calculates the member's current age based on date of birth.
     * @return Age in years, or null if date of birth is not set
     */
    fun getAge(): Int? {
        val dob = dateOfBirth ?: return null
        val today = LocalDate.now()
        return java.time.Period.between(dob, today).years
    }

    /**
     * Calculates the member tenure in months.
     */
    fun getTenureMonths(): Long {
        return ChronoUnit.MONTHS.between(createdAt.atZone(java.time.ZoneOffset.UTC).toLocalDate(), LocalDate.now())
    }

    /**
     * Checks if this is a family member (linked to a primary member).
     */
    fun isFamilyMember(): Boolean = primaryMemberId != null

    /**
     * Checks if this is a corporate member.
     */
    fun isCorporateMember(): Boolean = companyId != null || companyName != null

    /**
     * Checks if profile is complete (all required fields filled).
     */
    fun isProfileComplete(): Boolean = profileCompleteness >= 100

    /**
     * Calculates and updates profile completeness percentage.
     */
    fun calculateProfileCompleteness(): Int {
        var score = 0
        var maxScore = 0

        // Required fields (weight: 2)
        maxScore += 2; if (firstName.en.isNotBlank()) score += 2
        maxScore += 2; if (lastName.en.isNotBlank()) score += 2
        maxScore += 2; if (email.isNotBlank()) score += 2
        maxScore += 2; if (!phone.isNullOrBlank()) score += 2
        maxScore += 2; if (dateOfBirth != null) score += 2
        maxScore += 2; if (!emergencyContactName.isNullOrBlank()) score += 2
        maxScore += 2; if (!emergencyContactPhone.isNullOrBlank()) score += 2

        // Optional but valuable (weight: 1)
        maxScore += 1; if (gender != null) score += 1
        maxScore += 1; if (!nationality.isNullOrBlank()) score += 1
        maxScore += 1; if (!nationalId.isNullOrBlank()) score += 1
        maxScore += 1; if (address != null) score += 1
        maxScore += 1; if (!profilePhotoUrl.isNullOrBlank()) score += 1
        maxScore += 1; if (!fitnessGoals.isNullOrEmpty()) score += 1
        maxScore += 1; if (communicationPreferences != null) score += 1

        profileCompleteness = if (maxScore > 0) ((score.toDouble() / maxScore) * 100).toInt() else 0
        return profileCompleteness
    }

    /**
     * Updates loyalty tier based on tenure.
     */
    fun updateLoyaltyTier() {
        val months = getTenureMonths()
        loyaltyTier = when {
            months >= 60 -> LoyaltyTier.PLATINUM  // 5+ years
            months >= 36 -> LoyaltyTier.GOLD      // 3+ years
            months >= 24 -> LoyaltyTier.SILVER    // 2+ years
            months >= 12 -> LoyaltyTier.BRONZE    // 1+ year
            else -> null
        }
    }

    /**
     * Increments referral count.
     */
    fun incrementReferralCount() {
        referralCount++
    }

    /**
     * Adds loyalty points.
     */
    fun addLoyaltyPoints(points: Int) {
        require(points >= 0) { "Points must be non-negative" }
        loyaltyPoints += points
    }

    /**
     * Redeems loyalty points.
     */
    fun redeemLoyaltyPoints(points: Int) {
        require(points >= 0) { "Points must be non-negative" }
        require(loyaltyPoints >= points) { "Insufficient loyalty points" }
        loyaltyPoints -= points
    }
}

enum class MemberStatus {
    ACTIVE,
    SUSPENDED,
    FROZEN,
    CANCELLED,
    PENDING
}

enum class Gender {
    MALE,
    FEMALE
}

enum class Language {
    EN,
    AR
}

enum class FitnessGoal {
    WEIGHT_LOSS,
    MUSCLE_GAIN,
    ENDURANCE,
    FLEXIBILITY,
    STRESS_RELIEF,
    GENERAL_FITNESS,
    SPORTS_PERFORMANCE,
    REHABILITATION,
    SOCIAL_FITNESS,
    COMPETITION_PREP
}

enum class LoyaltyTier {
    BRONZE,   // 1+ year
    SILVER,   // 2+ years
    GOLD,     // 3+ years
    PLATINUM  // 5+ years
}

enum class CorporateBillingType {
    COMPANY_PAYS,    // Company pays full amount
    EMPLOYEE_PAYS,   // Employee pays, company provides access
    SHARED           // Split between company and employee
}

data class CommunicationPreferences(
    val email: Boolean = true,
    val sms: Boolean = true,
    val whatsapp: Boolean = false,
    val push: Boolean = true,
    val marketingEmail: Boolean = false,
    val renewalReminders: Boolean = true,
    val classReminders: Boolean = true,
    val promotions: Boolean = false
)
