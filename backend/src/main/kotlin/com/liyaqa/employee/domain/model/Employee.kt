package com.liyaqa.employee.domain.model

import com.liyaqa.membership.domain.model.Address
import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationAwareEntity
import com.liyaqa.trainer.domain.model.Gender
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
import java.math.BigDecimal
import java.time.LocalDate
import java.time.Period
import java.util.UUID

/**
 * Employee entity representing a staff member (non-trainer) who works at the gym.
 *
 * Key features:
 * - Extends OrganizationAwareEntity for multi-club support
 * - Employees can be assigned to multiple locations within the organization
 * - Supports bilingual profile (names, notes)
 * - Tracks certifications as JSON
 * - Includes compensation information for payroll
 * - Links to User for dashboard access
 */
@Entity
@Table(name = "employees")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(
    name = "tenantFilter",
    condition = "tenant_id = :tenantId OR organization_id = (SELECT c.organization_id FROM clubs c WHERE c.id = :tenantId)"
)
class Employee(
    id: UUID = UUID.randomUUID(),

    /**
     * Link to the User account. Required - an employee must have a user account
     * for dashboard access.
     */
    @Column(name = "user_id", nullable = false)
    var userId: UUID,

    // ========== Basic Info ==========

    /**
     * First name (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "first_name_en")),
        AttributeOverride(name = "ar", column = Column(name = "first_name_ar"))
    )
    var firstName: LocalizedText,

    /**
     * Last name (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "last_name_en")),
        AttributeOverride(name = "ar", column = Column(name = "last_name_ar"))
    )
    var lastName: LocalizedText,

    /**
     * Date of birth.
     */
    @Column(name = "date_of_birth")
    var dateOfBirth: LocalDate? = null,

    /**
     * Gender.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    var gender: Gender? = null,

    // ========== Contact ==========

    /**
     * Email address.
     */
    @Column(name = "email", length = 255)
    var email: String? = null,

    /**
     * Phone number.
     */
    @Column(name = "phone", length = 50)
    var phone: String? = null,

    /**
     * Address (embedded).
     */
    @Embedded
    var address: Address? = null,

    // ========== Employment ==========

    /**
     * Department the employee belongs to.
     */
    @Column(name = "department_id")
    var departmentId: UUID? = null,

    /**
     * Job title/position.
     */
    @Column(name = "job_title_id")
    var jobTitleId: UUID? = null,

    /**
     * Employment type.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 50)
    var employmentType: EmploymentType = EmploymentType.FULL_TIME,

    /**
     * Date the employee was hired.
     */
    @Column(name = "hire_date", nullable = false)
    var hireDate: LocalDate,

    /**
     * Date the employee was terminated (if applicable).
     */
    @Column(name = "termination_date")
    var terminationDate: LocalDate? = null,

    /**
     * Current employment status.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    var status: EmployeeStatus = EmployeeStatus.ACTIVE,

    // ========== Certifications (stored as JSON) ==========

    /**
     * List of certifications as JSON array.
     * Example: [{"name": "CPR", "issuedBy": "Red Cross", "issuedAt": "2024-01-01", "expiresAt": "2026-01-01"}]
     */
    @Column(name = "certifications", columnDefinition = "TEXT")
    var certifications: String? = null,

    // ========== Emergency Contact ==========

    /**
     * Emergency contact name.
     */
    @Column(name = "emergency_contact_name", length = 200)
    var emergencyContactName: String? = null,

    /**
     * Emergency contact phone.
     */
    @Column(name = "emergency_contact_phone", length = 50)
    var emergencyContactPhone: String? = null,

    /**
     * Emergency contact relationship.
     */
    @Column(name = "emergency_contact_relationship", length = 100)
    var emergencyContactRelationship: String? = null,

    // ========== Compensation ==========

    /**
     * Salary amount.
     */
    @Column(name = "salary_amount", precision = 12, scale = 2)
    var salaryAmount: BigDecimal? = null,

    /**
     * Salary currency (default SAR).
     */
    @Column(name = "salary_currency", length = 3)
    var salaryCurrency: String? = "SAR",

    /**
     * Salary frequency.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "salary_frequency", length = 50)
    var salaryFrequency: SalaryFrequency? = null,

    // ========== Profile ==========

    /**
     * Profile image URL.
     */
    @Column(name = "profile_image_url", length = 500)
    var profileImageUrl: String? = null,

    /**
     * Internal notes (bilingual).
     */
    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "notes_en")),
        AttributeOverride(name = "ar", column = Column(name = "notes_ar"))
    )
    var notes: LocalizedText? = null

) : OrganizationAwareEntity(id) {

    // ========== Computed Properties ==========

    val fullName: LocalizedText
        get() {
            val enFirst = firstName.en.ifBlank { firstName.ar ?: "" }
            val enLast = lastName.en.ifBlank { lastName.ar ?: "" }
            val fullEn = listOf(enFirst, enLast).filter { it.isNotBlank() }.joinToString(" ")

            val fullAr = if (firstName.ar != null || lastName.ar != null) {
                val arFirst = firstName.ar ?: firstName.en
                val arLast = lastName.ar ?: lastName.en
                listOf(arFirst, arLast).filter { it.isNotBlank() }.joinToString(" ")
            } else null

            return LocalizedText(en = fullEn, ar = fullAr)
        }

    // ========== Status Transitions ==========

    fun activate() {
        require(status != EmployeeStatus.TERMINATED) { "Cannot activate a terminated employee" }
        status = EmployeeStatus.ACTIVE
    }

    fun deactivate() {
        require(status == EmployeeStatus.ACTIVE || status == EmployeeStatus.PROBATION) {
            "Can only deactivate an active or probation employee"
        }
        status = EmployeeStatus.INACTIVE
    }

    fun setOnLeave() {
        require(status == EmployeeStatus.ACTIVE) { "Can only set leave for an active employee" }
        status = EmployeeStatus.ON_LEAVE
    }

    fun returnFromLeave() {
        require(status == EmployeeStatus.ON_LEAVE) { "Employee is not on leave" }
        status = EmployeeStatus.ACTIVE
    }

    fun setProbation() {
        require(status == EmployeeStatus.ACTIVE || status == EmployeeStatus.INACTIVE) {
            "Can only set probation for active or inactive employee"
        }
        status = EmployeeStatus.PROBATION
    }

    fun terminate(terminationDate: LocalDate = LocalDate.now()) {
        this.status = EmployeeStatus.TERMINATED
        this.terminationDate = terminationDate
    }

    // ========== Profile Updates ==========

    fun updateBasicInfo(
        firstName: LocalizedText = this.firstName,
        lastName: LocalizedText = this.lastName,
        dateOfBirth: LocalDate? = this.dateOfBirth,
        gender: Gender? = this.gender
    ) {
        this.firstName = firstName
        this.lastName = lastName
        this.dateOfBirth = dateOfBirth
        this.gender = gender
    }

    fun updateContact(
        email: String? = this.email,
        phone: String? = this.phone,
        address: Address? = this.address
    ) {
        this.email = email
        this.phone = phone
        this.address = address
    }

    fun updateEmployment(
        departmentId: UUID? = this.departmentId,
        jobTitleId: UUID? = this.jobTitleId,
        employmentType: EmploymentType = this.employmentType
    ) {
        this.departmentId = departmentId
        this.jobTitleId = jobTitleId
        this.employmentType = employmentType
    }

    fun updateCompensation(
        salaryAmount: BigDecimal? = this.salaryAmount,
        salaryCurrency: String? = this.salaryCurrency,
        salaryFrequency: SalaryFrequency? = this.salaryFrequency
    ) {
        this.salaryAmount = salaryAmount
        this.salaryCurrency = salaryCurrency
        this.salaryFrequency = salaryFrequency
    }

    fun updateEmergencyContact(
        name: String? = this.emergencyContactName,
        phone: String? = this.emergencyContactPhone,
        relationship: String? = this.emergencyContactRelationship
    ) {
        this.emergencyContactName = name
        this.emergencyContactPhone = phone
        this.emergencyContactRelationship = relationship
    }

    fun updateCertifications(certifications: String?) {
        this.certifications = certifications
    }

    fun updateProfile(
        profileImageUrl: String? = this.profileImageUrl,
        notes: LocalizedText? = this.notes
    ) {
        this.profileImageUrl = profileImageUrl
        this.notes = notes
    }

    // ========== Query Helpers ==========

    fun isActive(): Boolean = status == EmployeeStatus.ACTIVE

    fun isTerminated(): Boolean = status == EmployeeStatus.TERMINATED

    fun getAge(): Int? {
        return dateOfBirth?.let {
            Period.between(it, LocalDate.now()).years
        }
    }

    fun getYearsOfService(): Int {
        val endDate = terminationDate ?: LocalDate.now()
        return Period.between(hireDate, endDate).years
    }

    companion object {
        fun create(
            userId: UUID,
            organizationId: UUID,
            tenantId: UUID,
            firstName: LocalizedText,
            lastName: LocalizedText,
            hireDate: LocalDate,
            employmentType: EmploymentType = EmploymentType.FULL_TIME,
            email: String? = null,
            phone: String? = null
        ): Employee {
            return Employee(
                userId = userId,
                firstName = firstName,
                lastName = lastName,
                hireDate = hireDate,
                employmentType = employmentType,
                email = email,
                phone = phone
            ).apply {
                setTenantAndOrganization(tenantId, organizationId)
            }
        }
    }
}
