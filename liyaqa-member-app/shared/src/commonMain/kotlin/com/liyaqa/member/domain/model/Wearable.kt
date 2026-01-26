package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Wearable platform names matching backend
 */
enum class WearablePlatformName {
    FITBIT,
    GARMIN,
    GOOGLE_FIT,
    APPLE_HEALTH,
    WHOOP,
    OURA;

    fun getDisplayName(isArabic: Boolean): String = when (this) {
        FITBIT -> if (isArabic) "فيتبيت" else "Fitbit"
        GARMIN -> if (isArabic) "جارمين كونكت" else "Garmin Connect"
        GOOGLE_FIT -> if (isArabic) "جوجل فيت" else "Google Fit"
        APPLE_HEALTH -> if (isArabic) "صحة أبل" else "Apple Health"
        WHOOP -> if (isArabic) "ووب" else "WHOOP"
        OURA -> if (isArabic) "خاتم أورا" else "Oura Ring"
    }
}

enum class WearableAuthType {
    OAUTH2,
    DEVICE_SDK
}

enum class SyncSource {
    API,
    WEBHOOK,
    SDK
}

enum class SyncStatus {
    SUCCESS,
    FAILED,
    PARTIAL;

    fun getLabel(isArabic: Boolean): String = when (this) {
        SUCCESS -> if (isArabic) "ناجح" else "Success"
        FAILED -> if (isArabic) "فاشل" else "Failed"
        PARTIAL -> if (isArabic) "جزئي" else "Partial"
    }
}

enum class SyncJobType {
    FULL_SYNC,
    INCREMENTAL,
    ACTIVITIES,
    WORKOUTS
}

enum class SyncJobStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED;

    fun getLabel(isArabic: Boolean): String = when (this) {
        PENDING -> if (isArabic) "في الانتظار" else "Pending"
        RUNNING -> if (isArabic) "قيد التشغيل" else "Running"
        COMPLETED -> if (isArabic) "مكتمل" else "Completed"
        FAILED -> if (isArabic) "فاشل" else "Failed"
    }
}

enum class WearableActivityType {
    RUNNING,
    WALKING,
    CYCLING,
    SWIMMING,
    GYM_WORKOUT,
    HIIT,
    YOGA,
    PILATES,
    STRENGTH_TRAINING,
    CARDIO,
    ELLIPTICAL,
    ROWING,
    STAIR_CLIMBING,
    TREADMILL,
    CROSS_TRAINING,
    HIKING,
    DANCE,
    MARTIAL_ARTS,
    STRETCHING,
    MEDITATION,
    SLEEP,
    OTHER;

    fun getLabel(isArabic: Boolean): String = when (this) {
        RUNNING -> if (isArabic) "الجري" else "Running"
        WALKING -> if (isArabic) "المشي" else "Walking"
        CYCLING -> if (isArabic) "ركوب الدراجة" else "Cycling"
        SWIMMING -> if (isArabic) "السباحة" else "Swimming"
        GYM_WORKOUT -> if (isArabic) "تمرين صالة" else "Gym Workout"
        HIIT -> if (isArabic) "تدريب متقطع" else "HIIT"
        YOGA -> if (isArabic) "يوغا" else "Yoga"
        PILATES -> if (isArabic) "بيلاتس" else "Pilates"
        STRENGTH_TRAINING -> if (isArabic) "تدريب القوة" else "Strength Training"
        CARDIO -> if (isArabic) "كارديو" else "Cardio"
        ELLIPTICAL -> if (isArabic) "إليبتيكال" else "Elliptical"
        ROWING -> if (isArabic) "التجديف" else "Rowing"
        STAIR_CLIMBING -> if (isArabic) "صعود الدرج" else "Stair Climbing"
        TREADMILL -> if (isArabic) "جهاز المشي" else "Treadmill"
        CROSS_TRAINING -> if (isArabic) "تدريب شامل" else "Cross Training"
        HIKING -> if (isArabic) "المشي لمسافات" else "Hiking"
        DANCE -> if (isArabic) "الرقص" else "Dance"
        MARTIAL_ARTS -> if (isArabic) "فنون قتالية" else "Martial Arts"
        STRETCHING -> if (isArabic) "التمدد" else "Stretching"
        MEDITATION -> if (isArabic) "التأمل" else "Meditation"
        SLEEP -> if (isArabic) "النوم" else "Sleep"
        OTHER -> if (isArabic) "أخرى" else "Other"
    }

    companion object {
        fun fromString(value: String): WearableActivityType =
            entries.find { it.name == value } ?: OTHER
    }
}

/**
 * Wearable platform configuration
 */
@Serializable
data class WearablePlatform(
    val id: String,
    val name: String,
    val displayName: String,
    val authType: String,
    val logoUrl: String?,
    val isActive: Boolean,
    val supportsOAuth: Boolean
) {
    val platformName: WearablePlatformName?
        get() = try {
            WearablePlatformName.valueOf(name)
        } catch (e: Exception) {
            null
        }

    val authTypeEnum: WearableAuthType
        get() = try {
            WearableAuthType.valueOf(authType)
        } catch (e: Exception) {
            WearableAuthType.OAUTH2
        }

    val isDeviceSdk: Boolean
        get() = authTypeEnum == WearableAuthType.DEVICE_SDK
}

/**
 * Member's wearable connection
 */
@Serializable
data class WearableConnection(
    val id: String,
    val memberId: String,
    val platformId: String,
    val platformName: String?,
    val platformDisplayName: String?,
    val platformLogoUrl: String?,
    val externalUserId: String?,
    val externalUsername: String?,
    val hasOAuthTokens: Boolean,
    val isTokenExpired: Boolean,
    val syncEnabled: Boolean,
    val lastSyncAt: String?,
    val lastSyncStatus: String?,
    val createdAt: String,
    val updatedAt: String
) {
    val platformEnum: WearablePlatformName?
        get() = platformName?.let {
            try {
                WearablePlatformName.valueOf(it)
            } catch (e: Exception) {
                null
            }
        }

    val syncStatusEnum: SyncStatus?
        get() = lastSyncStatus?.let {
            try {
                SyncStatus.valueOf(it)
            } catch (e: Exception) {
                null
            }
        }
}

/**
 * Daily activity summary from wearable
 */
@Serializable
data class WearableDailyActivity(
    val id: String,
    val memberId: String,
    val connectionId: String,
    val activityDate: String,
    val steps: Int?,
    val distanceMeters: Int?,
    val distanceKm: Double?,
    val floorsClimbed: Int?,
    val caloriesTotal: Int?,
    val caloriesActive: Int?,
    val activeMinutes: Int?,
    val activeHours: Double?,
    val sedentaryMinutes: Int?,
    val sleepMinutes: Int?,
    val sleepHours: Double?,
    val sleepQualityScore: Int?,
    val restingHeartRate: Int?,
    val hrvAverage: Double?,
    val stressScore: Int?,
    val recoveryScore: Int?,
    val syncSource: String,
    val createdAt: String
)

/**
 * Individual workout from wearable
 */
@Serializable
data class WearableWorkout(
    val id: String,
    val memberId: String,
    val connectionId: String,
    val externalWorkoutId: String?,
    val activityType: String,
    val activityName: String?,
    val startedAt: String,
    val endedAt: String?,
    val durationSeconds: Int?,
    val durationMinutes: Double?,
    val distanceMeters: Int?,
    val distanceKm: Double?,
    val caloriesBurned: Int?,
    val avgHeartRate: Int?,
    val maxHeartRate: Int?,
    val avgPaceSecondsPerKm: Int?,
    val avgPaceMinutesPerKm: Double?,
    val elevationGainMeters: Int?,
    val steps: Int?,
    val syncSource: String,
    val createdAt: String
) {
    val activityTypeEnum: WearableActivityType
        get() = WearableActivityType.fromString(activityType)
}

/**
 * Workout statistics aggregation
 */
@Serializable
data class WearableWorkoutStats(
    val totalWorkouts: Int,
    val totalDurationSeconds: Long,
    val totalDurationMinutes: Double,
    val totalDurationHours: Double,
    val totalCalories: Long
)

/**
 * Activity statistics aggregation
 */
@Serializable
data class WearableActivityStats(
    val daysTracked: Int,
    val totalSteps: Long,
    val averageStepsPerDay: Double,
    val totalCalories: Long,
    val totalActiveMinutes: Long,
    val totalActiveHours: Double,
    val averageSleepMinutes: Double,
    val averageSleepHours: Double,
    val averageRestingHeartRate: Double?
)

/**
 * Sync job tracking
 */
@Serializable
data class WearableSyncJob(
    val id: String,
    val connectionId: String,
    val jobType: String,
    val status: String,
    val startedAt: String?,
    val completedAt: String?,
    val durationSeconds: Int?,
    val recordsProcessed: Int,
    val recordsCreated: Int,
    val recordsUpdated: Int,
    val recordsFailed: Int,
    val errorMessage: String?,
    val createdAt: String
) {
    val jobTypeEnum: SyncJobType
        get() = try {
            SyncJobType.valueOf(jobType)
        } catch (e: Exception) {
            SyncJobType.FULL_SYNC
        }

    val statusEnum: SyncJobStatus
        get() = try {
            SyncJobStatus.valueOf(status)
        } catch (e: Exception) {
            SyncJobStatus.PENDING
        }
}
