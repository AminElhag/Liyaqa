package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "member_agreements")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberAgreement(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "agreement_id", nullable = false)
    val agreementId: UUID,

    @Column(name = "agreement_version", nullable = false)
    val agreementVersion: Int,

    @Column(name = "signed_at", nullable = false)
    val signedAt: Instant = Instant.now(),

    @Column(name = "ip_address")
    val ipAddress: String? = null,

    @Column(name = "user_agent")
    val userAgent: String? = null,

    @Column(name = "signature_data", columnDefinition = "TEXT")
    val signatureData: String? = null,

    @Column(name = "health_data", columnDefinition = "TEXT")
    var healthData: String? = null

) : BaseEntity(id)
