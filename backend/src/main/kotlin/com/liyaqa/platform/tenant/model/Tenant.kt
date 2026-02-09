package com.liyaqa.platform.tenant.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "tenants")
class Tenant(
    id: UUID = UUID.randomUUID(),

    @Column(name = "facility_name", nullable = false)
    var facilityName: String,

    @Column(name = "facility_name_ar")
    var facilityNameAr: String? = null,

    @Column(name = "subdomain", unique = true)
    var subdomain: String? = null,

    @Column(name = "cr_number")
    var crNumber: String? = null,

    @Column(name = "vat_number")
    var vatNumber: String? = null,

    @Column(name = "contact_email", nullable = false)
    var contactEmail: String,

    @Column(name = "contact_phone")
    var contactPhone: String? = null,

    @Column(name = "address")
    var address: String? = null,

    @Column(name = "city")
    var city: String? = null,

    @Column(name = "region")
    var region: String? = null,

    @Column(name = "country", nullable = false)
    var country: String = "SA",

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: TenantStatus = TenantStatus.PROVISIONING,

    @Column(name = "subscription_plan_id")
    var subscriptionPlanId: UUID? = null,

    @Column(name = "deal_id")
    var dealId: UUID? = null,

    @Column(name = "organization_id")
    var organizationId: UUID? = null,

    @Column(name = "club_id")
    var clubId: UUID? = null,

    @Column(name = "onboarded_by")
    var onboardedBy: UUID? = null,

    @Column(name = "onboarded_at")
    var onboardedAt: Instant? = null,

    @Column(name = "deactivated_at")
    var deactivatedAt: Instant? = null,

    @Column(name = "data_retention_until")
    var dataRetentionUntil: Instant? = null,

    @Column(name = "metadata", columnDefinition = "TEXT")
    var metadata: String? = null

) : OrganizationLevelEntity(id) {

    fun changeStatus(newStatus: TenantStatus) {
        val allowed = VALID_TRANSITIONS[status]
            ?: throw IllegalStateException("No transitions defined for status: $status")
        require(newStatus in allowed) {
            "Invalid transition from $status to $newStatus. Allowed: $allowed"
        }
        status = newStatus
        if (newStatus == TenantStatus.ACTIVE) {
            onboardedAt = Instant.now()
        }
        if (newStatus == TenantStatus.DEACTIVATED) {
            deactivatedAt = Instant.now()
        }
    }

    companion object {
        val VALID_TRANSITIONS: Map<TenantStatus, Set<TenantStatus>> = mapOf(
            TenantStatus.PROVISIONING to setOf(TenantStatus.ACTIVE, TenantStatus.DEACTIVATED),
            TenantStatus.ACTIVE to setOf(TenantStatus.SUSPENDED, TenantStatus.DEACTIVATED),
            TenantStatus.SUSPENDED to setOf(TenantStatus.ACTIVE, TenantStatus.DEACTIVATED),
            TenantStatus.DEACTIVATED to setOf(TenantStatus.ARCHIVED),
            TenantStatus.ARCHIVED to emptySet()
        )

        fun create(
            facilityName: String,
            contactEmail: String,
            onboardedBy: UUID? = null,
            dealId: UUID? = null
        ): Tenant {
            return Tenant(
                facilityName = facilityName,
                contactEmail = contactEmail,
                onboardedBy = onboardedBy,
                dealId = dealId
            )
        }
    }
}
