package com.liyaqa.wearables.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes
import java.time.Instant
import java.util.*

/**
 * Individual workout recorded from a wearable device.
 */
@Entity
@Table(
    name = "wearable_workouts",
    uniqueConstraints = [
        UniqueConstraint(columnNames = ["connection_id", "external_workout_id"])
    ]
)
class WearableWorkout(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "connection_id", nullable = false)
    val connectionId: UUID,

    @Column(name = "external_workout_id")
    val externalWorkoutId: String? = null,

    @Column(name = "activity_type", nullable = false)
    val activityType: String,

    @Column(name = "activity_name")
    val activityName: String? = null,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant,

    @Column(name = "ended_at")
    val endedAt: Instant? = null,

    @Column(name = "duration_seconds")
    val durationSeconds: Int? = null,

    @Column(name = "distance_meters")
    val distanceMeters: Int? = null,

    @Column(name = "calories_burned")
    val caloriesBurned: Int? = null,

    @Column(name = "avg_heart_rate")
    val avgHeartRate: Int? = null,

    @Column(name = "max_heart_rate")
    val maxHeartRate: Int? = null,

    @Column(name = "avg_pace_seconds_per_km")
    val avgPaceSecondsPerKm: Int? = null,

    @Column(name = "elevation_gain_meters")
    val elevationGainMeters: Int? = null,

    @Column
    val steps: Int? = null,

    @Column(name = "raw_data", columnDefinition = "jsonb")
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

    fun getDurationMinutes(): Int? = durationSeconds?.let { it / 60 }

    fun getDistanceKm(): Double? = distanceMeters?.let { it / 1000.0 }

    fun getAvgPaceMinutesPerKm(): Double? = avgPaceSecondsPerKm?.let { it / 60.0 }
}
