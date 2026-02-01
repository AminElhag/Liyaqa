package com.liyaqa.loyalty.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.time.Instant
import java.util.*

@Entity
@Table(name = "points_transactions")
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class PointsTransaction(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false, updatable = false)
    val memberId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    val type: PointsTransactionType,

    @Column(name = "points", nullable = false)
    val points: Long,

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 50)
    val source: PointsSource,

    @Column(name = "reference_type", length = 50)
    val referenceType: String? = null,

    @Column(name = "reference_id")
    val referenceId: UUID? = null,

    @Column(name = "description")
    val description: String? = null,

    @Column(name = "description_ar")
    val descriptionAr: String? = null,

    @Column(name = "balance_after", nullable = false)
    val balanceAfter: Long,

    @Column(name = "expires_at")
    val expiresAt: Instant? = null
) : BaseEntity(id) {

    companion object {
        fun earn(
            memberId: UUID,
            points: Long,
            source: PointsSource,
            balanceAfter: Long,
            referenceType: String? = null,
            referenceId: UUID? = null,
            description: String? = null,
            descriptionAr: String? = null,
            expiresAt: Instant? = null
        ) = PointsTransaction(
            memberId = memberId,
            type = PointsTransactionType.EARN,
            points = points,
            source = source,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description,
            descriptionAr = descriptionAr,
            balanceAfter = balanceAfter,
            expiresAt = expiresAt
        )

        fun redeem(
            memberId: UUID,
            points: Long,
            source: PointsSource,
            balanceAfter: Long,
            referenceType: String? = null,
            referenceId: UUID? = null,
            description: String? = null,
            descriptionAr: String? = null
        ) = PointsTransaction(
            memberId = memberId,
            type = PointsTransactionType.REDEEM,
            points = points,
            source = source,
            referenceType = referenceType,
            referenceId = referenceId,
            description = description,
            descriptionAr = descriptionAr,
            balanceAfter = balanceAfter
        )

        fun expire(
            memberId: UUID,
            points: Long,
            balanceAfter: Long,
            description: String? = null,
            descriptionAr: String? = null
        ) = PointsTransaction(
            memberId = memberId,
            type = PointsTransactionType.EXPIRE,
            points = points,
            source = PointsSource.MANUAL,
            description = description,
            descriptionAr = descriptionAr,
            balanceAfter = balanceAfter
        )

        fun adjustment(
            memberId: UUID,
            points: Long,
            balanceAfter: Long,
            description: String? = null,
            descriptionAr: String? = null
        ) = PointsTransaction(
            memberId = memberId,
            type = PointsTransactionType.ADJUSTMENT,
            points = points,
            source = PointsSource.MANUAL,
            description = description,
            descriptionAr = descriptionAr,
            balanceAfter = balanceAfter
        )
    }
}
