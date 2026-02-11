package com.liyaqa.platform.compliance.model

import com.liyaqa.shared.domain.OrganizationLevelEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.UUID

@Entity
@Table(name = "tenant_contracts")
class TenantContract(
    id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "contract_number", nullable = false, unique = true)
    val contractNumber: String,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    var type: ContractType,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    var status: ContractStatus = ContractStatus.DRAFT,

    @Column(name = "start_date", nullable = false)
    var startDate: LocalDate,

    @Column(name = "end_date", nullable = false)
    var endDate: LocalDate,

    @Column(name = "auto_renew")
    var autoRenew: Boolean = false,

    @Column(name = "document_url")
    var documentUrl: String? = null,

    @Column(name = "signed_at")
    var signedAt: Instant? = null,

    @Column(name = "signed_by")
    var signedBy: UUID? = null,

    @Column(name = "value")
    var value: BigDecimal? = null,

    @Column(name = "currency")
    var currency: String = "SAR",

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "terms", columnDefinition = "jsonb")
    var terms: MutableMap<String, String> = mutableMapOf()

) : OrganizationLevelEntity(id) {

    fun sign(signedBy: UUID) {
        this.status = ContractStatus.SIGNED
        this.signedAt = Instant.now()
        this.signedBy = signedBy
    }

    fun activate() {
        require(status == ContractStatus.SIGNED) {
            "Contract must be SIGNED to activate, current status: $status"
        }
        this.status = ContractStatus.ACTIVE
    }

    fun expire() {
        this.status = ContractStatus.EXPIRED
    }

    fun terminate() {
        this.status = ContractStatus.TERMINATED
    }

    fun renew(newEndDate: LocalDate) {
        require(status == ContractStatus.ACTIVE || status == ContractStatus.EXPIRED) {
            "Contract must be ACTIVE or EXPIRED to renew, current status: $status"
        }
        this.endDate = newEndDate
        this.status = ContractStatus.ACTIVE
    }

    fun daysUntilExpiry(): Long {
        return ChronoUnit.DAYS.between(LocalDate.now(), endDate)
    }

    fun isExpiringSoon(withinDays: Int = 30): Boolean {
        if (status != ContractStatus.ACTIVE) return false
        return daysUntilExpiry() in 0..withinDays.toLong()
    }

    companion object {
        fun create(
            tenantId: UUID,
            contractNumber: String,
            type: ContractType,
            startDate: LocalDate,
            endDate: LocalDate,
            autoRenew: Boolean = false,
            documentUrl: String? = null,
            value: BigDecimal? = null,
            currency: String = "SAR",
            terms: MutableMap<String, String> = mutableMapOf()
        ): TenantContract {
            return TenantContract(
                tenantId = tenantId,
                contractNumber = contractNumber,
                type = type,
                startDate = startDate,
                endDate = endDate,
                autoRenew = autoRenew,
                documentUrl = documentUrl,
                value = value,
                currency = currency,
                terms = terms
            )
        }
    }
}
