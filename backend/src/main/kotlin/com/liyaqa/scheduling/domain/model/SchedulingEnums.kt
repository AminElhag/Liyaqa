package com.liyaqa.scheduling.domain.model

/**
 * Status of a gym class definition.
 */
enum class GymClassStatus {
    ACTIVE,
    INACTIVE,
    ARCHIVED
}

/**
 * Status of a specific class session.
 */
enum class SessionStatus {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}

/**
 * Status of a member's booking for a class session.
 */
enum class BookingStatus {
    CONFIRMED,
    WAITLISTED,
    CHECKED_IN,
    NO_SHOW,
    CANCELLED
}

/**
 * Day of week for recurring schedules.
 */
enum class DayOfWeek {
    SUNDAY,
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY
}

/**
 * Difficulty level for gym classes.
 */
enum class DifficultyLevel {
    BEGINNER,
    INTERMEDIATE,
    ADVANCED,
    ALL_LEVELS
}

/**
 * Type of gym class.
 */
enum class ClassType {
    GROUP_FITNESS,
    PERSONAL_TRAINING,
    YOGA,
    PILATES,
    SPINNING,
    CROSSFIT,
    SWIMMING,
    MARTIAL_ARTS,
    DANCE,
    OTHER
}
