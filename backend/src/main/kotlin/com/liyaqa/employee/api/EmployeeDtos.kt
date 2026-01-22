package com.liyaqa.employee.api

import com.liyaqa.employee.application.commands.CertificationInput
import com.liyaqa.employee.application.commands.CreateEmployeeCommand
import com.liyaqa.employee.application.commands.UpdateEmployeeCommand
import com.liyaqa.employee.domain.model.Employee
import com.liyaqa.employee.domain.model.EmployeeLocationAssignment
import com.liyaqa.employee.domain.model.EmployeeStatus
import com.liyaqa.employee.domain.model.EmploymentType
import com.liyaqa.employee.domain.model.SalaryFrequency
import com.liyaqa.membership.domain.model.Address
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.LocalizedTextInput
import com.liyaqa.shared.domain.TenantContext
import com.liyaqa.trainer.domain.model.Gender
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Past
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.PositiveOrZero
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

// ==================== REQUEST DTOs ====================

/**
 * Request to create a new employee from an existing user.
 */
data class CreateEmployeeRequest(
    @field:NotNull(message = "User ID is required")
    val userId: UUID,

    @field:NotNull(message = "Organization ID is required")
    val organizationId: UUID,

    @field:Valid
    @field:NotNull(message = "First name is required")
    val firstName: LocalizedTextInput,

    @field:Valid
    @field:NotNull(message = "Last name is required")
    val lastName: LocalizedTextInput,

    @field:NotNull(message = "Hire date is required")
    val hireDate: LocalDate,

    val employmentType: EmploymentType = EmploymentType.FULL_TIME,

    @field:Email(message = "Invalid email format")
    val email: String? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val phone: String? = null,

    @field:Past(message = "Date of birth must be in the past")
    val dateOfBirth: LocalDate? = null,

    val gender: Gender? = null,

    @field:Valid
    val address: AddressInput? = null,

    val departmentId: UUID? = null,

    val jobTitleId: UUID? = null,

    @field:Valid
    val certifications: List<CertificationInputDto>? = null,

    val emergencyContactName: String? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val emergencyContactPhone: String? = null,

    val emergencyContactRelationship: String? = null,

    @field:PositiveOrZero(message = "Salary amount must be non-negative")
    val salaryAmount: BigDecimal? = null,

    val salaryCurrency: String? = "SAR",

    val salaryFrequency: SalaryFrequency? = null,

    val profileImageUrl: String? = null,

    @field:Valid
    val notes: LocalizedTextInput? = null,

    val assignedLocationIds: List<UUID>? = null,

    val primaryLocationId: UUID? = null
) {
    fun toCommand(): CreateEmployeeCommand {
        return CreateEmployeeCommand(
            userId = userId,
            organizationId = organizationId,
            tenantId = TenantContext.getCurrentTenant().value,
            firstName = firstName.toLocalizedText(),
            lastName = lastName.toLocalizedText(),
            hireDate = hireDate,
            employmentType = employmentType,
            email = email,
            phone = phone,
            dateOfBirth = dateOfBirth,
            gender = gender,
            address = address?.toAddress(),
            departmentId = departmentId,
            jobTitleId = jobTitleId,
            certifications = certifications?.map { it.toCertificationInput() },
            emergencyContactName = emergencyContactName,
            emergencyContactPhone = emergencyContactPhone,
            emergencyContactRelationship = emergencyContactRelationship,
            salaryAmount = salaryAmount,
            salaryCurrency = salaryCurrency,
            salaryFrequency = salaryFrequency,
            profileImageUrl = profileImageUrl,
            notes = notes?.toLocalizedText(),
            assignedLocationIds = assignedLocationIds,
            primaryLocationId = primaryLocationId
        )
    }
}

/**
 * Request to update an employee.
 */
data class UpdateEmployeeRequest(
    @field:Valid
    val firstName: LocalizedTextInput? = null,

    @field:Valid
    val lastName: LocalizedTextInput? = null,

    @field:Past(message = "Date of birth must be in the past")
    val dateOfBirth: LocalDate? = null,

    val gender: Gender? = null,

    @field:Email(message = "Invalid email format")
    val email: String? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val phone: String? = null,

    @field:Valid
    val address: AddressInput? = null,

    val departmentId: UUID? = null,

    val jobTitleId: UUID? = null,

    val employmentType: EmploymentType? = null,

    @field:Valid
    val certifications: List<CertificationInputDto>? = null,

    val emergencyContactName: String? = null,

    @field:Pattern(regexp = "^\\+?[0-9\\s\\-()]*$", message = "Invalid phone number format")
    val emergencyContactPhone: String? = null,

    val emergencyContactRelationship: String? = null,

    @field:PositiveOrZero(message = "Salary amount must be non-negative")
    val salaryAmount: BigDecimal? = null,

    val salaryCurrency: String? = null,

    val salaryFrequency: SalaryFrequency? = null,

    val profileImageUrl: String? = null,

    @field:Valid
    val notes: LocalizedTextInput? = null
) {
    fun toCommand(): UpdateEmployeeCommand {
        return UpdateEmployeeCommand(
            firstName = firstName?.toLocalizedText(),
            lastName = lastName?.toLocalizedText(),
            dateOfBirth = dateOfBirth,
            gender = gender,
            email = email,
            phone = phone,
            address = address?.toAddress(),
            departmentId = departmentId,
            jobTitleId = jobTitleId,
            employmentType = employmentType,
            certifications = certifications?.map { it.toCertificationInput() },
            emergencyContactName = emergencyContactName,
            emergencyContactPhone = emergencyContactPhone,
            emergencyContactRelationship = emergencyContactRelationship,
            salaryAmount = salaryAmount,
            salaryCurrency = salaryCurrency,
            salaryFrequency = salaryFrequency,
            profileImageUrl = profileImageUrl,
            notes = notes?.toLocalizedText()
        )
    }
}

/**
 * Request to assign employee to a location.
 */
data class AssignEmployeeToLocationRequest(
    @field:NotNull(message = "Location ID is required")
    val locationId: UUID,

    val isPrimary: Boolean = false
)

/**
 * Input for certification data.
 */
data class CertificationInputDto(
    @field:NotNull(message = "Certification name is required")
    val name: String,

    val issuedBy: String? = null,

    val issuedAt: LocalDate? = null,

    val expiresAt: LocalDate? = null
) {
    fun toCertificationInput(): CertificationInput {
        return CertificationInput(
            name = name,
            issuedBy = issuedBy,
            issuedAt = issuedAt,
            expiresAt = expiresAt
        )
    }
}

/**
 * Input for address data.
 */
data class AddressInput(
    val street: String? = null,
    val city: String? = null,
    val state: String? = null,
    val postalCode: String? = null,
    val country: String? = null
) {
    fun toAddress(): Address {
        return Address(
            street = street,
            city = city,
            state = state,
            postalCode = postalCode,
            country = country
        )
    }
}

// ==================== RESPONSE DTOs ====================

/**
 * Full employee response with all details.
 */
data class EmployeeResponse(
    val id: UUID,
    val userId: UUID,
    val organizationId: UUID,
    val firstName: LocalizedText,
    val lastName: LocalizedText,
    val fullName: LocalizedText,
    val dateOfBirth: LocalDate?,
    val gender: Gender?,
    val email: String?,
    val phone: String?,
    val address: AddressResponse?,
    val departmentId: UUID?,
    val departmentName: LocalizedText?,
    val jobTitleId: UUID?,
    val jobTitleName: LocalizedText?,
    val employmentType: EmploymentType,
    val hireDate: LocalDate,
    val terminationDate: LocalDate?,
    val status: EmployeeStatus,
    val certifications: List<CertificationResponse>,
    val emergencyContact: EmergencyContactResponse?,
    val salaryAmount: BigDecimal?,
    val salaryCurrency: String?,
    val salaryFrequency: SalaryFrequency?,
    val profileImageUrl: String?,
    val notes: LocalizedText?,
    val assignedLocations: List<EmployeeLocationAssignmentResponse>?,
    val yearsOfService: Int,
    val createdAt: Instant,
    val updatedAt: Instant
) {
    companion object {
        fun from(
            employee: Employee,
            departmentName: LocalizedText? = null,
            jobTitleName: LocalizedText? = null,
            certifications: List<CertificationResponse> = emptyList(),
            assignedLocations: List<EmployeeLocationAssignmentResponse>? = null
        ): EmployeeResponse {
            return EmployeeResponse(
                id = employee.id,
                userId = employee.userId,
                organizationId = employee.organizationId,
                firstName = employee.firstName,
                lastName = employee.lastName,
                fullName = employee.fullName,
                dateOfBirth = employee.dateOfBirth,
                gender = employee.gender,
                email = employee.email,
                phone = employee.phone,
                address = employee.address?.let { AddressResponse.from(it) },
                departmentId = employee.departmentId,
                departmentName = departmentName,
                jobTitleId = employee.jobTitleId,
                jobTitleName = jobTitleName,
                employmentType = employee.employmentType,
                hireDate = employee.hireDate,
                terminationDate = employee.terminationDate,
                status = employee.status,
                certifications = certifications,
                emergencyContact = if (employee.emergencyContactName != null) {
                    EmergencyContactResponse(
                        name = employee.emergencyContactName,
                        phone = employee.emergencyContactPhone,
                        relationship = employee.emergencyContactRelationship
                    )
                } else null,
                salaryAmount = employee.salaryAmount,
                salaryCurrency = employee.salaryCurrency,
                salaryFrequency = employee.salaryFrequency,
                profileImageUrl = employee.profileImageUrl,
                notes = employee.notes,
                assignedLocations = assignedLocations,
                yearsOfService = employee.getYearsOfService(),
                createdAt = employee.createdAt,
                updatedAt = employee.updatedAt
            )
        }
    }
}

/**
 * Summary employee response for list views.
 */
data class EmployeeSummaryResponse(
    val id: UUID,
    val userId: UUID,
    val firstName: LocalizedText,
    val lastName: LocalizedText,
    val fullName: LocalizedText,
    val email: String?,
    val departmentId: UUID?,
    val departmentName: LocalizedText?,
    val jobTitleId: UUID?,
    val jobTitleName: LocalizedText?,
    val employmentType: EmploymentType,
    val status: EmployeeStatus,
    val profileImageUrl: String?,
    val hireDate: LocalDate,
    val createdAt: Instant
) {
    companion object {
        fun from(
            employee: Employee,
            departmentName: LocalizedText? = null,
            jobTitleName: LocalizedText? = null
        ): EmployeeSummaryResponse {
            return EmployeeSummaryResponse(
                id = employee.id,
                userId = employee.userId,
                firstName = employee.firstName,
                lastName = employee.lastName,
                fullName = employee.fullName,
                email = employee.email,
                departmentId = employee.departmentId,
                departmentName = departmentName,
                jobTitleId = employee.jobTitleId,
                jobTitleName = jobTitleName,
                employmentType = employee.employmentType,
                status = employee.status,
                profileImageUrl = employee.profileImageUrl,
                hireDate = employee.hireDate,
                createdAt = employee.createdAt
            )
        }
    }
}

/**
 * Address response.
 */
data class AddressResponse(
    val street: String?,
    val city: String?,
    val state: String?,
    val postalCode: String?,
    val country: String?,
    val formatted: String
) {
    companion object {
        fun from(address: Address): AddressResponse {
            return AddressResponse(
                street = address.street,
                city = address.city,
                state = address.state,
                postalCode = address.postalCode,
                country = address.country,
                formatted = address.toFormattedString()
            )
        }
    }
}

/**
 * Emergency contact response.
 */
data class EmergencyContactResponse(
    val name: String?,
    val phone: String?,
    val relationship: String?
)

/**
 * Certification response.
 */
data class CertificationResponse(
    val name: String,
    val issuedBy: String?,
    val issuedAt: LocalDate?,
    val expiresAt: LocalDate?,
    val isExpiring: Boolean,
    val isExpired: Boolean
) {
    companion object {
        fun from(input: CertificationInput): CertificationResponse {
            val today = LocalDate.now()
            val expiresAt = input.expiresAt
            return CertificationResponse(
                name = input.name,
                issuedBy = input.issuedBy,
                issuedAt = input.issuedAt,
                expiresAt = expiresAt,
                isExpiring = expiresAt != null && !expiresAt.isBefore(today) && !expiresAt.isAfter(today.plusDays(30)),
                isExpired = expiresAt != null && expiresAt.isBefore(today)
            )
        }
    }
}

/**
 * Employee location assignment response.
 */
data class EmployeeLocationAssignmentResponse(
    val id: UUID,
    val employeeId: UUID,
    val locationId: UUID,
    val locationName: LocalizedText?,
    val isPrimary: Boolean,
    val status: String,
    val createdAt: Instant
) {
    companion object {
        fun from(
            assignment: EmployeeLocationAssignment,
            locationName: LocalizedText? = null
        ): EmployeeLocationAssignmentResponse {
            return EmployeeLocationAssignmentResponse(
                id = assignment.id,
                employeeId = assignment.employeeId,
                locationId = assignment.locationId,
                locationName = locationName,
                isPrimary = assignment.isPrimary,
                status = assignment.status.name,
                createdAt = assignment.createdAt
            )
        }
    }
}

/**
 * Expiring certification alert response.
 */
data class ExpiringCertificationResponse(
    val employeeId: UUID,
    val employeeName: LocalizedText,
    val certificationName: String,
    val expiresAt: LocalDate,
    val daysUntilExpiry: Long
)

/**
 * Employee statistics response.
 */
data class EmployeeStatsResponse(
    val total: Long,
    val active: Long,
    val inactive: Long,
    val onLeave: Long,
    val probation: Long,
    val terminated: Long
)
