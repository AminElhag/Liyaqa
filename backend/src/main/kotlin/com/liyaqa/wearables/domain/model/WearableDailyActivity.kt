package com.liyaqa.wearables.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.*

/**
 * Daily activity summary from a wearable device.
 * Aggregates daily metrics like steps, calories, sleep, etc.
 */
@Entity
@Table(
    name = "wearable_daily_activities",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["connection_id", "activity_date"])
    ]
)
class WearableDailyActivity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "connection_id", nullable = false)
    val connectionId: UUID,

    @Column(name = "activity_date", nullable = false)
    val activityDate: LocalDate,

    // Activity metrics
    @Column
    val steps: Int? = null,

    @Column(name = "distance_meters")
    val distanceMeters: Int? = null,

    @Column(name = "floors_climbed")
    val floorsClimbed: Int? = null,

    // Calories
    @Column(name = "calories_total")
    val caloriesTotal: Int? = null,

    @Column(name = "calories_active")
    val caloriesActive: Int? = null,

    // Time metrics
    @Column(name = "active_minutes")
    val activeMinutes: Int? = null,

    @Column(name = "sedentary_minutes")
    val sedentaryMinutes: Int? = null,

    // Sleep metrics
    @Column(name = "sleep_minutes")
    val sleepMinutes: Int? = null,

    @Column(name = "sleep_quality_score")
    val sleepQualityScore: Int? = null,

    // Heart/health metrics
    @Column(name = "resting_heart_rate")
    val restingHeartRate: Int? = null,

    @Column(name = "hrv_average")
    val hrvAverage: BigDecimal? = null,

    @Column(name = "stress_score")
    val stressScore: Int? = null,

    @Column(name = "recovery_score")
    val recoveryScore: Int? = null,

    // Source data
    @Column(name = "raw_data")
    @JdbcTypeCode(SqlTypes.JSON)
    val rawData: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_source", nullable = false)
    val syncSource: SyncSource = SyncSource.API,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
) {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", insertable = false, updatable = false)
    var connection: MemberWearableConnection? = null

    fun getDistanceKm(): Double? = distanceMeters?.let { it / 1000.0 }

    fun getSleepHours(): Double? = sleepMinutes?.let { it / 60.0 }

    fun getActiveHours(): Double? = activeMinutes?.let { it / 60.0 }
}
