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
import org.hibernate.annotations.ParamDef
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "members")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
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
    var whatsappNumber: String? = null

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
