package com.liyaqa.membership.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.annotations.ParamDef
import org.hibernate.type.SqlTypes
import java.util.UUID

/**
 * Exit survey collected when a member cancels their membership.
 * Used for analytics and improving retention strategies.
 */
@Entity
@Table(name = "exit_surveys")
@FilterDef(
    name = "tenantFilter",
    parameters = [ParamDef(name = "tenantId", type = UUID::class)]
)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class ExitSurvey(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "subscription_id", nullable = false)
    val subscriptionId: UUID,

    @Column(name = "contract_id")
    val contractId: UUID? = null,

    // ==========================================
    // PRIMARY REASON
    // ==========================================

    @Enumerated(EnumType.STRING)
    @Column(name = "reason_category", nullable = false)
    val reasonCategory: CancellationReasonCategory,

    @Column(name = "reason_detail", columnDefinition = "TEXT")
    val reasonDetail: String? = null,

    // ==========================================
    // DETAILED FEEDBACK
    // ==========================================

    @Column(name = "feedback", columnDefinition = "TEXT")
    val feedback: String? = null,

    // ==========================================
    // SATISFACTION SCORES
    // ==========================================

    @Column(name = "nps_score")
    val npsScore: Int? = null, // 0-10

    @Column(name = "would_recommend")
    val wouldRecommend: Boolean? = null,

    @Column(name = "overall_satisfaction")
    val overallSatisfaction: Int? = null, // 1-5

    // ==========================================
    // SPECIFIC AREAS OF DISSATISFACTION
    // ==========================================

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "dissatisfaction_areas", columnDefinition = "VARCHAR(200)[]")
    val dissatisfactionAreas: List<String>? = null,

    // ==========================================
    // WIN-BACK POTENTIAL
    // ==========================================

    @Column(name = "what_would_bring_back", columnDefinition = "TEXT")
    val whatWouldBringBack: String? = null,

    @Column(name = "open_to_future_offers", nullable = false)
    val openToFutureOffers: Boolean = true,

    // ==========================================
    // COMPETITOR INFO
    // ==========================================

    @Column(name = "competitor_name")
    val competitorName: String? = null,

    @Column(name = "competitor_reason", columnDefinition = "TEXT")
    val competitorReason: String? = null

) : BaseEntity(id) {

    /**
     * Check if this is a detractor (NPS 0-6).
     */
    fun isDetractor(): Boolean = npsScore?.let { it <= 6 } ?: false

    /**
     * Check if this is a passive (NPS 7-8).
     */
    fun isPassive(): Boolean = npsScore?.let { it in 7..8 } ?: false

    /**
     * Check if this is a promoter (NPS 9-10).
     */
    fun isPromoter(): Boolean = npsScore?.let { it >= 9 } ?: false

    /**
     * Check if member is switching to competitor.
     */
    fun isSwitchingToCompetitor(): Boolean = competitorName != null

    /**
     * Check if member is open to win-back.
     */
    fun isOpenToWinBack(): Boolean = openToFutureOffers

    /**
     * Check if financial reasons were primary.
     */
    fun isFinancialReason(): Boolean = reasonCategory == CancellationReasonCategory.FINANCIAL

    /**
     * Check if dissatisfaction was primary.
     */
    fun isDissatisfactionReason(): Boolean = reasonCategory == CancellationReasonCategory.DISSATISFACTION

    /**
     * Check if usage/not using was primary.
     */
    fun isUsageReason(): Boolean = reasonCategory == CancellationReasonCategory.USAGE

    companion object {
        fun create(
            memberId: UUID,
            subscriptionId: UUID,
            reasonCategory: CancellationReasonCategory,
            reasonDetail: String? = null,
            feedback: String? = null,
            npsScore: Int? = null,
            wouldRecommend: Boolean? = null,
            overallSatisfaction: Int? = null,
            dissatisfactionAreas: List<String>? = null,
            whatWouldBringBack: String? = null,
            openToFutureOffers: Boolean = true,
            competitorName: String? = null,
            competitorReason: String? = null,
            contractId: UUID? = null
        ): ExitSurvey {
            require(npsScore == null || npsScore in 0..10) { "NPS score must be between 0 and 10" }
            require(overallSatisfaction == null || overallSatisfaction in 1..5) {
                "Overall satisfaction must be between 1 and 5"
            }

            return ExitSurvey(
                memberId = memberId,
                subscriptionId = subscriptionId,
                contractId = contractId,
                reasonCategory = reasonCategory,
                reasonDetail = reasonDetail,
                feedback = feedback,
                npsScore = npsScore,
                wouldRecommend = wouldRecommend,
                overallSatisfaction = overallSatisfaction,
                dissatisfactionAreas = dissatisfactionAreas,
                whatWouldBringBack = whatWouldBringBack,
                openToFutureOffers = openToFutureOffers,
                competitorName = competitorName,
                competitorReason = competitorReason
            )
        }
    }
}
