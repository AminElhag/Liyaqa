package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.Version
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Tracks compliance status for an organization against a specific framework.
 */
@Entity
@Table(name = "organization_compliance_status")
class OrganizationComplianceStatus(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "organization_id", nullable = false)
    val organizationId: UUID,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "framework_id", nullable = false)
    val framework: ComplianceFramework,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ComplianceStatus = ComplianceStatus.NOT_STARTED,

    @Column(name = "compliance_score", precision = 5, scale = 2)
    var complianceScore: BigDecimal = BigDecimal.ZERO,

    @Column(name = "total_controls")
    var totalControls: Int = 0,

    @Column(name = "implemented_controls")
    var implementedControls: Int = 0,

    @Column(name = "certification_date")
    var certificationDate: LocalDate? = null,

    @Column(name = "certification_expiry_date")
    var certificationExpiryDate: LocalDate? = null,

    @Column(name = "last_assessment_date")
    var lastAssessmentDate: LocalDate? = null,

    @Column(name = "next_assessment_date")
    var nextAssessmentDate: LocalDate? = null,

    @Column(name = "auditor_name")
    var auditorName: String? = null,

    @Column(name = "auditor_company")
    var auditorCompany: String? = null,

    @Column(name = "notes", columnDefinition = "TEXT")
    var notes: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Version
    @Column(name = "version")
    var version: Long = 0
) {
    /**
     * Update compliance score based on implemented controls.
     */
    fun updateComplianceScore() {
        complianceScore = if (totalControls > 0) {
            BigDecimal(implementedControls * 100.0 / totalControls).setScale(2, java.math.RoundingMode.HALF_UP)
        } else {
            BigDecimal.ZERO
        }
        updatedAt = Instant.now()
    }

    /**
     * Mark as certified.
     */
    fun certify(certDate: LocalDate, expiryDate: LocalDate, auditor: String? = null, company: String? = null) {
        status = ComplianceStatus.CERTIFIED
        certificationDate = certDate
        certificationExpiryDate = expiryDate
        auditorName = auditor
        auditorCompany = company
        updatedAt = Instant.now()
    }

    /**
     * Check if certification is valid.
     */
    fun isCertificationValid(): Boolean {
        return status == ComplianceStatus.CERTIFIED &&
                certificationExpiryDate?.isAfter(LocalDate.now()) == true
    }

    /**
     * Increment implemented control count.
     */
    fun incrementImplemented() {
        implementedControls++
        updateComplianceScore()
    }

    /**
     * Decrement implemented control count.
     */
    fun decrementImplemented() {
        if (implementedControls > 0) {
            implementedControls--
            updateComplianceScore()
        }
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is OrganizationComplianceStatus) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
