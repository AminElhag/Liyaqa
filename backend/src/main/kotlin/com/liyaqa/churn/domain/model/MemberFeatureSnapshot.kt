package com.liyaqa.churn.domain.model

import com.liyaqa.shared.domain.BaseEntity
import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

@Entity
@Table(name = "member_feature_snapshots")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class MemberFeatureSnapshot(
    id: UUID = UUID.randomUUID(),

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "snapshot_date", nullable = false)
    val snapshotDate: LocalDate,

    // Engagement features
    @Column(name = "total_visits_30d")
    var totalVisits30d: Int = 0,

    @Column(name = "total_visits_90d")
    var totalVisits90d: Int = 0,

    @Column(name = "visit_frequency_trend", precision = 5, scale = 4)
    var visitFrequencyTrend: BigDecimal? = null,

    @Column(name = "days_since_last_visit")
    var daysSinceLastVisit: Int = 0,

    @Column(name = "avg_visit_duration_mins")
    var avgVisitDurationMins: Int? = null,

    // Booking features
    @Column(name = "class_booking_rate", precision = 5, scale = 4)
    var classBookingRate: BigDecimal? = null,

    @Column(name = "class_attendance_rate", precision = 5, scale = 4)
    var classAttendanceRate: BigDecimal? = null,

    @Column(name = "pt_sessions_30d")
    var ptSessions30d: Int = 0,

    // Financial features
    @Column(name = "payment_on_time_rate", precision = 5, scale = 4)
    var paymentOnTimeRate: BigDecimal? = null,

    @Column(name = "outstanding_balance", precision = 10, scale = 2)
    var outstandingBalance: BigDecimal? = null,

    @Column(name = "days_until_expiry")
    var daysUntilExpiry: Int? = null,

    // Composite engagement score
    @Column(name = "engagement_score", precision = 5, scale = 4)
    var engagementScore: BigDecimal? = null,

    // Training label
    @Column(name = "churned")
    var churned: Boolean? = null,

    @Column(name = "churn_date")
    var churnDate: LocalDate? = null
) : BaseEntity(id) {

    fun markAsChurned(date: LocalDate) {
        churned = true
        churnDate = date
    }

    fun markAsRetained() {
        churned = false
        churnDate = null
    }

    fun calculateEngagementScore(): BigDecimal {
        // Simple weighted formula (can be refined)
        val visitScore = (totalVisits30d.coerceAtMost(20) / 20.0) * 0.3
        val attendanceScore = (classAttendanceRate?.toDouble() ?: 0.5) * 0.25
        val paymentScore = (paymentOnTimeRate?.toDouble() ?: 0.5) * 0.2
        val recencyScore = ((30 - daysSinceLastVisit.coerceAtMost(30)) / 30.0) * 0.25

        engagementScore = BigDecimal(visitScore + attendanceScore + paymentScore + recencyScore)
            .setScale(4, java.math.RoundingMode.HALF_UP)

        return engagementScore!!
    }
}
