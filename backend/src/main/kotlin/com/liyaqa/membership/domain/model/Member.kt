package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
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

    @Column(name = "first_name", nullable = false)
    var firstName: String,

    @Column(name = "last_name", nullable = false)
    var lastName: String,

    @Column(name = "email", nullable = false, unique = true)
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
    var notes: String? = null

) : BaseEntity(id) {

    val fullName: String
        get() = "$firstName $lastName"

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
}

enum class MemberStatus {
    ACTIVE,
    SUSPENDED,
    FROZEN,
    CANCELLED,
    PENDING
}
