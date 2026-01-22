package com.liyaqa.trainer.domain.model

/**
 * Trainer employment type - how the trainer is contracted with the gym.
 */
enum class TrainerEmploymentType {
    /** Full-time or part-time employee of the gym */
    EMPLOYEE,

    /** Self-employed, invoice-based contractor */
    INDEPENDENT_CONTRACTOR,

    /** Works on a per-session basis */
    FREELANCE
}

/**
 * Type of training the trainer provides.
 */
enum class TrainerType {
    /** Provides 1-on-1 personal training sessions */
    PERSONAL_TRAINER,

    /** Teaches group fitness classes */
    GROUP_FITNESS,

    /** Specialist in a specific discipline (yoga, pilates, etc.) */
    SPECIALIST,

    /** Provides both personal training and group classes */
    HYBRID
}

/**
 * Current status of the trainer.
 */
enum class TrainerStatus {
    /** Currently available and active */
    ACTIVE,

    /** Temporarily unavailable */
    INACTIVE,

    /** On extended leave/vacation */
    ON_LEAVE,

    /** No longer working with the gym */
    TERMINATED
}

/**
 * Compensation model for the trainer.
 */
enum class CompensationModel {
    /** Fixed hourly rate */
    HOURLY,

    /** Fixed rate per class/session taught */
    PER_SESSION,

    /** Percentage of class/session fees */
    REVENUE_SHARE,

    /** Base salary plus bonus per session */
    SALARY_PLUS_COMMISSION
}

/**
 * Status of trainer-club assignment.
 */
enum class TrainerClubAssignmentStatus {
    /** Trainer is actively assigned to this club */
    ACTIVE,

    /** Trainer assignment is inactive */
    INACTIVE
}

/**
 * Gender of the trainer.
 */
enum class Gender {
    MALE,
    FEMALE,
    OTHER,
    PREFER_NOT_TO_SAY
}

/**
 * Status of a personal training session.
 */
enum class PTSessionStatus {
    /** Member requested the session, awaiting trainer confirmation */
    REQUESTED,

    /** Trainer has confirmed the session */
    CONFIRMED,

    /** Session is currently in progress */
    IN_PROGRESS,

    /** Session has been completed */
    COMPLETED,

    /** Session was cancelled by member or trainer */
    CANCELLED,

    /** Member did not show up for the session */
    NO_SHOW
}
