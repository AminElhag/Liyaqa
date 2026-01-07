package com.liyaqa.organization.domain.model

import com.liyaqa.shared.domain.LocalizedText
import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.AttributeOverride
import jakarta.persistence.AttributeOverrides
import jakarta.persistence.Column
import jakarta.persistence.Embedded
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.util.UUID

/**
 * Organization entity - the top-level entity in the hierarchy.
 * An organization can own multiple clubs.
 *
 * Organization does not have a tenant_id as it is the root of the tenant hierarchy.
 */
@Entity
@Table(name = "organizations")
class Organization(
    id: UUID = UUID.randomUUID(),

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "name_en", nullable = false)),
        AttributeOverride(name = "ar", column = Column(name = "name_ar"))
    )
    var name: LocalizedText,

    @Embedded
    @AttributeOverrides(
        AttributeOverride(name = "en", column = Column(name = "trade_name_en")),
        AttributeOverride(name = "ar", column = Column(name = "trade_name_ar"))
    )
    var tradeName: LocalizedText? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "organization_type", nullable = false)
    var organizationType: OrganizationType = OrganizationType.LLC,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: OrganizationStatus = OrganizationStatus.PENDING,

    @Column(name = "email")
    var email: String? = null,

    @Column(name = "phone", length = 20)
    var phone: String? = null,

    @Column(name = "website")
    var website: String? = null,

    @Embedded
    var zatcaInfo: ZatcaInfo? = null

) : OrganizationLevelEntity(id) {

    /**
     * Activate the organization.
     * Can only be activated from PENDING or SUSPENDED status.
     */
    fun activate() {
        require(status == OrganizationStatus.PENDING || status == OrganizationStatus.SUSPENDED) {
            "Organization can only be activated from PENDING or SUSPENDED status"
        }
        status = OrganizationStatus.ACTIVE
    }

    /**
     * Suspend the organization.
     * Only active organizations can be suspended.
     */
    fun suspend() {
        require(status == OrganizationStatus.ACTIVE) {
            "Only active organizations can be suspended"
        }
        status = OrganizationStatus.SUSPENDED
    }

    /**
     * Permanently close the organization.
     */
    fun close() {
        require(status != OrganizationStatus.CLOSED) {
            "Organization is already closed"
        }
        status = OrganizationStatus.CLOSED
    }

    /**
     * Update Zatca compliance information.
     */
    fun updateZatcaInfo(zatcaInfo: ZatcaInfo) {
        this.zatcaInfo = zatcaInfo
    }

    /**
     * Check if Zatca e-invoicing is enabled (all required fields present).
     */
    fun isZatcaEnabled(): Boolean = zatcaInfo?.isComplete() == true
}