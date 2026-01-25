package com.liyaqa.accounts.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "family_group_members")
class FamilyGroupMember(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    var familyGroup: FamilyGroup? = null,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "relationship", nullable = false, length = 30)
    var relationship: FamilyRelationship,

    @Column(name = "joined_at", nullable = false)
    val joinedAt: Instant = Instant.now()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is FamilyGroupMember) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
