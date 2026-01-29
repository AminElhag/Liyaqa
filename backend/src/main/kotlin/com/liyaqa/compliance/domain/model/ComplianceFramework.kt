package com.liyaqa.compliance.domain.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * Compliance framework definition (ISO 27001, SOC 2, PCI DSS, PDPL).
 */
@Entity
@Table(name = "compliance_frameworks")
class ComplianceFramework(
    @Id
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),

    @Column(name = "code", nullable = false, unique = true)
    val code: String,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "name_ar")
    var nameAr: String? = null,

    @Column(name = "description", columnDefinition = "TEXT")
    var description: String? = null,

    @Column(name = "description_ar", columnDefinition = "TEXT")
    var descriptionAr: String? = null,

    @Column(name = "version")
    var version: String? = null,

    @Column(name = "issuing_body")
    var issuingBody: String? = null,

    @Column(name = "certification_validity_months")
    var certificationValidityMonths: Int? = null,

    @Column(name = "is_active")
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    fun deactivate() {
        isActive = false
        updatedAt = Instant.now()
    }

    fun activate() {
        isActive = true
        updatedAt = Instant.now()
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is ComplianceFramework) return false
        return id == other.id
    }

    override fun hashCode(): Int = id.hashCode()
}
