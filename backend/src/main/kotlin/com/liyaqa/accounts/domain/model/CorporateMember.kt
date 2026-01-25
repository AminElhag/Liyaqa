package com.liyaqa.accounts.domain.model

import jakarta.persistence.*
import java.time.Instant
import java.util.*

@Entity
@Table(name = "corporate_members")
class CorporateMember(
    @Id
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "corporate_account_id", nullable = false)
    var corporateAccount: CorporateAccount? = null,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "employee_id", length = 50)
    var employeeId: String? = null,

    @Column(name = "department", length = 100)
    var department: String? = null,

    @Column(name = "position", length = 100)
    var position: String? = null,

    @Column(name = "joined_at", nullable = false)
    val joinedAt: Instant = Instant.now(),

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: CorporateMemberStatus = CorporateMemberStatus.ACTIVE
) {
    fun activate() {
        status = CorporateMemberStatus.ACTIVE
    }

    fun suspend() {
        status = CorporateMemberStatus.SUSPENDED
    }

    fun terminate() {
        status = CorporateMemberStatus.TERMINATED
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is CorporateMember) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
