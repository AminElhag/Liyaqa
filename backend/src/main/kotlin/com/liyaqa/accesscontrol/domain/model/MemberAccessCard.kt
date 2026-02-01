package com.liyaqa.accesscontrol.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "member_access_cards")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberAccessCard(
    @Column(name = "member_id", nullable = false)
    var memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "card_type", nullable = false, length = 20)
    var cardType: CardType,

    @Column(name = "card_number", nullable = false, length = 100)
    var cardNumber: String,

    @Column(name = "facility_code", length = 20)
    var facilityCode: String? = null,

    @Column(name = "card_data_encrypted", columnDefinition = "TEXT")
    var cardDataEncrypted: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    var status: CardStatus = CardStatus.ACTIVE,

    @Column(name = "issued_at")
    var issuedAt: Instant = Instant.now(),

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Column(name = "last_used_at")
    var lastUsedAt: Instant? = null,

    @Column(name = "notes", length = 500)
    var notes: String? = null
) : BaseEntity() {

    fun isValid(): Boolean {
        if (status != CardStatus.ACTIVE) return false
        if (expiresAt != null && Instant.now().isAfter(expiresAt)) return false
        return true
    }

    fun markUsed() {
        lastUsedAt = Instant.now()
    }

    fun suspend() {
        status = CardStatus.SUSPENDED
    }

    fun reactivate() {
        status = CardStatus.ACTIVE
    }

    fun reportLost() {
        status = CardStatus.LOST
    }

    fun revoke() {
        status = CardStatus.REVOKED
    }
}
