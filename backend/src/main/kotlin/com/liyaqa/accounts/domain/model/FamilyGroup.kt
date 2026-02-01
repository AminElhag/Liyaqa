package com.liyaqa.accounts.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.util.*

@Entity
@Table(name = "family_groups")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class FamilyGroup(
    id: UUID = UUID.randomUUID(),

    @Column(name = "name", nullable = false, length = 100)
    var name: String,

    @Column(name = "primary_member_id", nullable = false)
    val primaryMemberId: UUID,

    @Column(name = "max_members", nullable = false)
    var maxMembers: Int = 5,

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    var discountPercentage: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", nullable = false, length = 20)
    var billingType: FamilyBillingType = FamilyBillingType.INDIVIDUAL,

    @Column(name = "notes")
    var notes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: AccountStatus = AccountStatus.ACTIVE,

    @OneToMany(mappedBy = "familyGroup", cascade = [CascadeType.ALL], orphanRemoval = true)
    val members: MutableList<FamilyGroupMember> = mutableListOf()
) : BaseEntity(id) {

    fun addMember(memberId: UUID, relationship: FamilyRelationship): FamilyGroupMember {
        if (members.size >= maxMembers) {
            throw IllegalStateException("Family group has reached maximum members ($maxMembers)")
        }
        if (members.any { it.memberId == memberId }) {
            throw IllegalArgumentException("Member is already in this family group")
        }

        val member = FamilyGroupMember(
            familyGroup = this,
            memberId = memberId,
            relationship = relationship
        )
        members.add(member)
        return member
    }

    fun removeMember(memberId: UUID) {
        if (memberId == primaryMemberId) {
            throw IllegalArgumentException("Cannot remove primary member from family group")
        }
        members.removeIf { it.memberId == memberId }
    }

    fun activate() {
        status = AccountStatus.ACTIVE
    }

    fun suspend() {
        status = AccountStatus.SUSPENDED
    }

    fun terminate() {
        status = AccountStatus.TERMINATED
    }

    val memberCount: Int
        get() = members.size

    val isActive: Boolean
        get() = status == AccountStatus.ACTIVE
}
