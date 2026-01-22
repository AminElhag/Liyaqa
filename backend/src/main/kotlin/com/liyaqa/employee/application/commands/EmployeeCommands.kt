package com.liyaqa.employee.application.commands

import com.liyaqa.auth.domain.model.Role
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.employee.domain.model.SalaryFrequency
import com.liyaqa.membership.domain.model.Address
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.trainer.domain.model.Gender
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

// ==================== EMPLOYEE COMMANDS ====================

data class CreateEmployeeCommand(
    val userId: UUID,
    val organizationId: UUID,
    val tenantId: UUID,
    val firstName: LocalizedText,
    val lastName: LocalizedText,
    val hireDate: LocalDate,
    val employmentType: EmploymentType = EmploymentType.FULL_TIME,
    val email: String? = null,
    val phone: String? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null,
    val address: Address? = null,
    val departmentId: UUID? = null,
    val jobTitleId: UUID? = null,
    val certifications: List<CertificationInput>? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val emergencyContactRelationship: String? = null,
    val salaryAmount: BigDecimal? = null,
    val salaryCurrency: String? = "SAR",
    val salaryFrequency: SalaryFrequency? = null,
    val profileImageUrl: String? = null,
    val notes: LocalizedText? = null,
    val assignedLocationIds: List<UUID>? = null,
    val primaryLocationId: UUID? = null
)

data class UpdateEmployeeCommand(
    val firstName: LocalizedText? = null,
    val lastName: LocalizedText? = null,
    val dateOfBirth: LocalDate? = null,
    val gender: Gender? = null,
    val email: String? = null,
    val phone: String? = null,
    val address: Address? = null,
    val departmentId: UUID? = null,
    val jobTitleId: UUID? = null,
    val employmentType: EmploymentType? = null,
    val certifications: List<CertificationInput>? = null,
    val emergencyContactName: String? = null,
    val emergencyContactPhone: String? = null,
    val emergencyContactRelationship: String? = null,
    val salaryAmount: BigDecimal? = null,
    val salaryCurrency: String? = null,
    val salaryFrequency: SalaryFrequency? = null,
    val profileImageUrl: String? = null,
    val notes: LocalizedText? = null
)

data class CertificationInput(
    val name: String,
    val issuedBy: String? = null,
    val issuedAt: LocalDate? = null,
    val expiresAt: LocalDate? = null
)

data class AssignEmployeeToLocationCommand(
    val employeeId: UUID,
    val locationId: UUID,
    val isPrimary: Boolean = false
)

// ==================== DEPARTMENT COMMANDS ====================

data class CreateDepartmentCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val parentDepartmentId: UUID? = null,
    val sortOrder: Int = 0
)

data class UpdateDepartmentCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val parentDepartmentId: UUID? = null,
    val sortOrder: Int? = null
)

data class SetDepartmentManagerCommand(
    val departmentId: UUID,
    val employeeId: UUID?
)

// ==================== JOB TITLE COMMANDS ====================

data class CreateJobTitleCommand(
    val name: LocalizedText,
    val description: LocalizedText? = null,
    val departmentId: UUID? = null,
    val defaultRole: Role = Role.STAFF,
    val sortOrder: Int = 0
)

data class UpdateJobTitleCommand(
    val name: LocalizedText? = null,
    val description: LocalizedText? = null,
    val departmentId: UUID? = null,
    val defaultRole: Role? = null,
    val sortOrder: Int? = null
)
