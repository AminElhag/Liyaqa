package com.liyaqa.equipment.domain.model

import jakarta.persistence.*
import org.hibernate.annotations.Filter
import org.hibernate.annotations.FilterDef
import org.hibernate.annotations.ParamDef
import java.math.BigDecimal
import java.time.Instant
import java.util.*

@Entity
@Table(name = "equipment_workouts")
@FilterDef(name = "tenantFilter", parameters = [ParamDef(name = "tenantId", type = UUID::class)])
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
class EquipmentWorkout(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "tenant_id", nullable = false)
    val tenantId: UUID,

    @Column(name = "member_id", nullable = false)
    val memberId: UUID,

    @Column(name = "equipment_unit_id")
    val equipmentUnitId: UUID? = null,

    @Column(name = "provider_id", nullable = false)
    val providerId: UUID,

    @Column(name = "external_workout_id")
    val externalWorkoutId: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "workout_type", nullable = false)
    val workoutType: WorkoutType,

    @Enumerated(EnumType.STRING)
    @Column(name = "equipment_type")
    val equipmentType: EquipmentType? = null,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant,

    @Column(name = "ended_at")
    val endedAt: Instant? = null,

    @Column(name = "duration_seconds")
    val durationSeconds: Int? = null,

    // Cardio metrics
    @Column(name = "distance_meters")
    val distanceMeters: Int? = null,

    @Column
    val steps: Int? = null,

    @Column(name = "floors_climbed")
    val floorsClimbed: Int? = null,

    // Calories
    @Column(name = "calories_total")
    val caloriesTotal: Int? = null,

    @Column(name = "calories_active")
    val caloriesActive: Int? = null,

    // Heart rate
    @Column(name = "avg_heart_rate")
    val avgHeartRate: Int? = null,

    @Column(name = "max_heart_rate")
    val maxHeartRate: Int? = null,

    @Column(name = "heart_rate_zones")
    val heartRateZones: String? = null,

    // Intensity metrics
    @Column(name = "avg_pace_seconds_per_km")
    val avgPaceSecondsPerKm: Int? = null,

    @Column(name = "avg_speed_kmh")
    val avgSpeedKmh: BigDecimal? = null,

    @Column(name = "max_speed_kmh")
    val maxSpeedKmh: BigDecimal? = null,

    @Column(name = "avg_power_watts")
    val avgPowerWatts: Int? = null,

    @Column(name = "max_power_watts")
    val maxPowerWatts: Int? = null,

    @Column(name = "avg_cadence")
    val avgCadence: Int? = null,

    // Strength specific
    @Column(name = "total_reps")
    val totalReps: Int? = null,

    @Column(name = "total_sets")
    val totalSets: Int? = null,

    @Column(name = "total_weight_kg")
    val totalWeightKg: BigDecimal? = null,

    @Column(columnDefinition = "jsonb")
    val exercises: String? = null,

    // Source data
    @Column(name = "raw_data")
    val rawData: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_source", nullable = false)
    val syncSource: SyncSource = SyncSource.API,

    @Column(name = "synced_at", nullable = false)
    val syncedAt: Instant = Instant.now(),

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
) {
    fun getDurationMinutes(): Int? = durationSeconds?.let { it / 60 }

    fun getDistanceKm(): Double? = distanceMeters?.let { it / 1000.0 }
}
