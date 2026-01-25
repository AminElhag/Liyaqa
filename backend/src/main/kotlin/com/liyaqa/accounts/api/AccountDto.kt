package com.liyaqa.accounts.api

import com.liyaqa.accounts.domain.model.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

// Family Group DTOs
data class FamilyGroupDto(
    val id: UUID,
    val name: String,
    val primaryMemberId: UUID,
    val maxMembers: Int,
    val discountPercentage: BigDecimal,
    val billingType: FamilyBillingType,
    val status: AccountStatus,
    val notes: String?,
    val members: List<FamilyGroupMemberDto>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class FamilyGroupMemberDto(
    val id: UUID,
    val memberId: UUID,
    val relationship: FamilyRelationship,
    val joinedAt: LocalDateTime,
    val status: FamilyMemberStatus
)

data class FamilyGroupSummaryDto(
    val id: UUID,
    val name: String,
    val primaryMemberId: UUID,
    val memberCount: Int,
    val maxMembers: Int,
    val discountPercentage: BigDecimal,
    val status: AccountStatus,
    val createdAt: LocalDateTime?
)

data class CreateFamilyGroupRequest(
    val name: String,
    val primaryMemberId: UUID,
    val maxMembers: Int = 5,
    val discountPercentage: BigDecimal = BigDecimal.ZERO,
    val billingType: FamilyBillingType = FamilyBillingType.INDIVIDUAL,
    val notes: String? = null
)

data class UpdateFamilyGroupRequest(
    val name: String? = null,
    val maxMembers: Int? = null,
    val discountPercentage: BigDecimal? = null,
    val billingType: FamilyBillingType? = null,
    val notes: String? = null
)

data class AddFamilyMemberRequest(
    val memberId: UUID,
    val relationship: FamilyRelationship
)

// Corporate Account DTOs
data class CorporateAccountDto(
    val id: UUID,
    val companyName: String,
    val companyNameAr: String?,
    val contactPerson: String?,
    val contactEmail: String?,
    val contactPhone: String?,
    val crNumber: String?,
    val vatNumber: String?,
    val address: String?,
    val contractStartDate: LocalDate?,
    val contractEndDate: LocalDate?,
    val maxMembers: Int?,
    val discountPercentage: BigDecimal,
    val billingType: CorporateBillingType,
    val paymentTermsDays: Int,
    val status: AccountStatus,
    val notes: String?,
    val members: List<CorporateMemberDto>,
    val createdAt: LocalDateTime?,
    val updatedAt: LocalDateTime?
)

data class CorporateMemberDto(
    val id: UUID,
    val memberId: UUID,
    val employeeId: String?,
    val department: String?,
    val position: String?,
    val joinedAt: LocalDateTime,
    val status: CorporateMemberStatus
)

data class CorporateAccountSummaryDto(
    val id: UUID,
    val companyName: String,
    val companyNameAr: String?,
    val memberCount: Int,
    val maxMembers: Int?,
    val discountPercentage: BigDecimal,
    val contractEndDate: LocalDate?,
    val status: AccountStatus,
    val createdAt: LocalDateTime?
)

data class CreateCorporateAccountRequest(
    val companyName: String,
    val companyNameAr: String? = null,
    val contactPerson: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    val address: String? = null,
    val contractStartDate: LocalDate? = null,
    val contractEndDate: LocalDate? = null,
    val maxMembers: Int? = null,
    val discountPercentage: BigDecimal = BigDecimal.ZERO,
    val billingType: CorporateBillingType = CorporateBillingType.INVOICE,
    val paymentTermsDays: Int = 30,
    val notes: String? = null
)

data class UpdateCorporateAccountRequest(
    val companyName: String? = null,
    val companyNameAr: String? = null,
    val contactPerson: String? = null,
    val contactEmail: String? = null,
    val contactPhone: String? = null,
    val crNumber: String? = null,
    val vatNumber: String? = null,
    val address: String? = null,
    val contractStartDate: LocalDate? = null,
    val contractEndDate: LocalDate? = null,
    val maxMembers: Int? = null,
    val discountPercentage: BigDecimal? = null,
    val billingType: CorporateBillingType? = null,
    val paymentTermsDays: Int? = null,
    val notes: String? = null
)

data class AddCorporateMemberRequest(
    val memberId: UUID,
    val employeeId: String? = null,
    val department: String? = null,
    val position: String? = null
)

// Mapper extensions
fun FamilyGroup.toDto() = FamilyGroupDto(
    id = id!!,
    name = name,
    primaryMemberId = primaryMemberId,
    maxMembers = maxMembers,
    discountPercentage = discountPercentage,
    billingType = billingType,
    status = status,
    notes = notes,
    members = members.map { it.toDto() },
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun FamilyGroup.toSummaryDto() = FamilyGroupSummaryDto(
    id = id!!,
    name = name,
    primaryMemberId = primaryMemberId,
    memberCount = members.size,
    maxMembers = maxMembers,
    discountPercentage = discountPercentage,
    status = status,
    createdAt = createdAt
)

fun FamilyGroupMember.toDto() = FamilyGroupMemberDto(
    id = id!!,
    memberId = memberId,
    relationship = relationship,
    joinedAt = joinedAt,
    status = status
)

fun CorporateAccount.toDto() = CorporateAccountDto(
    id = id!!,
    companyName = companyName,
    companyNameAr = companyNameAr,
    contactPerson = contactPerson,
    contactEmail = contactEmail,
    contactPhone = contactPhone,
    crNumber = crNumber,
    vatNumber = vatNumber,
    address = address,
    contractStartDate = contractStartDate,
    contractEndDate = contractEndDate,
    maxMembers = maxMembers,
    discountPercentage = discountPercentage,
    billingType = billingType,
    paymentTermsDays = paymentTermsDays,
    status = status,
    notes = notes,
    members = members.map { it.toDto() },
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun CorporateAccount.toSummaryDto() = CorporateAccountSummaryDto(
    id = id!!,
    companyName = companyName,
    companyNameAr = companyNameAr,
    memberCount = members.size,
    maxMembers = maxMembers,
    discountPercentage = discountPercentage,
    contractEndDate = contractEndDate,
    status = status,
    createdAt = createdAt
)

fun CorporateMember.toDto() = CorporateMemberDto(
    id = id!!,
    memberId = memberId,
    employeeId = employeeId,
    department = department,
    position = position,
    joinedAt = joinedAt,
    status = status
)
