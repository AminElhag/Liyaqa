package com.liyaqa.equipment.domain.model

enum class EquipmentType {
    TREADMILL,
    ELLIPTICAL,
    BIKE,
    SPIN_BIKE,
    ROWER,
    STAIR_CLIMBER,
    CROSS_TRAINER,
    STRENGTH_MACHINE,
    FREE_WEIGHTS,
    CABLE_MACHINE,
    SMITH_MACHINE,
    OTHER
}

enum class EquipmentStatus {
    ACTIVE,
    MAINTENANCE,
    OFFLINE,
    RETIRED
}

enum class AuthType {
    API_KEY,
    OAUTH2,
    BASIC
}

enum class WorkoutType {
    CARDIO,
    STRENGTH,
    FLEXIBILITY,
    HIIT,
    ENDURANCE,
    RECOVERY,
    MIXED,
    OTHER
}

enum class SyncSource {
    API,
    WEBHOOK,
    MANUAL
}

enum class SyncJobType {
    FULL_SYNC,
    INCREMENTAL,
    MEMBER_SYNC
}

enum class SyncJobStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED
}
