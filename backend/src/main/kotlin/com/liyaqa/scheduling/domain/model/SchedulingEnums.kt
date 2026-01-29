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

/**
 * Pricing model for a gym class.
 * Determines how members can pay for the class.
 */
enum class ClassPricingModel {
    /** Class is free for members with active subscription (uses subscription.classesRemaining) */
    INCLUDED_IN_MEMBERSHIP,
    /** Class requires one-time payment at dropInPrice */
    PAY_PER_ENTRY,
    /** Class can only be booked using class pack credits */
    CLASS_PACK_ONLY,
    /** Any payment method is accepted (membership, pack, or pay-per-entry) */
    HYBRID
}

/**
 * How a class booking was paid for.
 */
enum class BookingPaymentSource {
    /** Deducted from subscription's classesRemaining */
    MEMBERSHIP_INCLUDED,
    /** Used credit from a class pack balance */
    CLASS_PACK,
    /** Paid drop-in price at time of booking */
    PAY_PER_ENTRY,
    /** Granted free by admin (no charge) */
    COMPLIMENTARY
}

/**
 * Status of a member's class pack balance.
 */
enum class ClassPackBalanceStatus {
    /** Balance has remaining credits and is not expired */
    ACTIVE,
    /** All credits have been used */
    DEPLETED,
    /** Balance has expired (past expiresAt date) */
    EXPIRED,
    /** Balance was cancelled/refunded by admin */
    CANCELLED
}

/**
 * Status of a class pack product.
 */
enum class ClassPackStatus {
    /** Pack is available for purchase */
    ACTIVE,
    /** Pack is not available for purchase */
    INACTIVE
}
