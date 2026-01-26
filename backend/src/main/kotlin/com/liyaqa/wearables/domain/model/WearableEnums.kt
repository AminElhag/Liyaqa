package com.liyaqa.wearables.domain.model

enum class WearablePlatformName {
    FITBIT,
    GARMIN,
    GOOGLE_FIT,
    APPLE_HEALTH,
    WHOOP,
    OURA
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
    FAILED
}

enum class SyncStatus {
    SUCCESS,
    FAILED,
    PARTIAL
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
    OTHER
}
