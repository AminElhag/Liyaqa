package com.liyaqa.accounts.application.commands

import com.liyaqa.accounts.domain.model.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

// Family Group Commands
data class CreateFamilyGroupCommand(
    val name: String,
    val primaryMemberId: UUID,
    val maxMembers: Int = 5,
    val discountPercentage: BigDecimal = BigDecimal.ZERO,
    val billingType: FamilyBillingType = FamilyBillingType.INDIVIDUAL,
    val notes: String? = null
)

data class UpdateFamilyGroupCommand(
    val name: String? = null,
    val maxMembers: Int? = null,
    val discountPercentage: BigDecimal? = null,
    val billingType: FamilyBillingType? = null,
    val notes: String? = null
)

data class AddFamilyMemberCommand(
    val memberId: UUID,
    val relationship: FamilyRelationship
)

// Corporate Account Commands
data class CreateCorporateAccountCommand(
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

data class UpdateCorporateAccountCommand(
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

data class AddCorporateMemberCommand(
    val memberId: UUID,
    val employeeId: String? = null,
    val department: String? = null,
    val position: String? = null
)
