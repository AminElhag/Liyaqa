package com.liyaqa.accounts.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

@Entity
@Table(name = "corporate_accounts")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class CorporateAccount(
    id: UUID = UUID.randomUUID(),

    @Column(name = "company_name", nullable = false, length = 200)
    var companyName: String,

    @Column(name = "company_name_ar", length = 200)
    var companyNameAr: String? = null,

    @Column(name = "contact_person", length = 100)
    var contactPerson: String? = null,

    @Column(name = "contact_email", length = 255)
    var contactEmail: String? = null,

    @Column(name = "contact_phone", length = 20)
    var contactPhone: String? = null,

    @Column(name = "cr_number", length = 50)
    var crNumber: String? = null,

    @Column(name = "vat_number", length = 50)
    var vatNumber: String? = null,

    @Column(name = "address")
    var address: String? = null,

    @Column(name = "contract_start_date")
    var contractStartDate: LocalDate? = null,

    @Column(name = "contract_end_date")
    var contractEndDate: LocalDate? = null,

    @Column(name = "max_members")
    var maxMembers: Int? = null,

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    var discountPercentage: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_type", nullable = false, length = 20)
    var billingType: CorporateBillingType = CorporateBillingType.INVOICE,

    @Column(name = "payment_terms_days", nullable = false)
    var paymentTermsDays: Int = 30,

    @Column(name = "notes")
    var notes: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    var status: AccountStatus = AccountStatus.ACTIVE,

    @OneToMany(mappedBy = "corporateAccount", cascade = [CascadeType.ALL], orphanRemoval = true)
    val members: MutableList<CorporateMember> = mutableListOf()
) : BaseEntity(id) {

    fun addMember(
        memberId: UUID,
        employeeId: String? = null,
        department: String? = null,
        position: String? = null
    ): CorporateMember {
        if (maxMembers != null && members.count { it.status == CorporateMemberStatus.ACTIVE } >= maxMembers!!) {
            throw IllegalStateException("Corporate account has reached maximum members ($maxMembers)")
        }
        if (members.any { it.memberId == memberId && it.status == CorporateMemberStatus.ACTIVE }) {
            throw IllegalArgumentException("Member is already in this corporate account")
        }

        val member = CorporateMember(
            corporateAccount = this,
            memberId = memberId,
            employeeId = employeeId,
            department = department,
            position = position
        )
        members.add(member)
        return member
    }

    fun removeMember(memberId: UUID) {
        val member = members.find { it.memberId == memberId && it.status == CorporateMemberStatus.ACTIVE }
            ?: throw NoSuchElementException("Member not found in corporate account")
        member.terminate()
    }

    fun activate() {
        status = AccountStatus.ACTIVE
    }

    fun suspend() {
        status = AccountStatus.SUSPENDED
    }

    fun terminate() {
        status = AccountStatus.TERMINATED
        members.filter { it.status == CorporateMemberStatus.ACTIVE }.forEach { it.terminate() }
    }

    val activeMemberCount: Int
        get() = members.count { it.status == CorporateMemberStatus.ACTIVE }

    val isActive: Boolean
        get() = status == AccountStatus.ACTIVE

    val isContractValid: Boolean
        get() {
            val now = LocalDate.now()
            return contractEndDate == null || !now.isAfter(contractEndDate)
        }
}
