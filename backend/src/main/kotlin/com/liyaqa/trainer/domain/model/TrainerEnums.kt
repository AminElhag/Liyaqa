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

/**
 * Status of trainer-client relationship.
 */
enum class TrainerClientStatus {
    /** Currently training together */
    ACTIVE,

    /** No longer training together */
    INACTIVE,

    /** Relationship temporarily paused (e.g., vacation, injury) */
    ON_HOLD,

    /** Goals achieved, relationship ended positively */
    COMPLETED
}

/**
 * Type of earning for a trainer.
 */
enum class EarningType {
    /** Earning from a personal training session */
    PT_SESSION,

    /** Earning from teaching a group fitness class */
    GROUP_CLASS,

    /** Performance or achievement bonus */
    BONUS,

    /** Sales commission (e.g., from membership sales) */
    COMMISSION
}

/**
 * Payment status of trainer earnings.
 */
enum class EarningStatus {
    /** Awaiting admin approval */
    PENDING,

    /** Approved for payment but not yet paid */
    APPROVED,

    /** Payment has been processed */
    PAID,

    /** Under review or dispute */
    DISPUTED
}

/**
 * Status of trainer certification.
 */
enum class CertificationStatus {
    /** Certification is valid and current */
    ACTIVE,

    /** Certification has passed its expiry date */
    EXPIRED,

    /** Certification has been revoked or invalidated */
    REVOKED
}

/**
 * Type of notification sent to trainers.
 */
enum class NotificationType {
    // PT Session notifications
    /** New PT session request from member */
    PT_REQUEST,

    /** PT session was accepted */
    PT_ACCEPTED,

    /** PT session was declined */
    PT_DECLINED,

    /** PT session was cancelled */
    PT_CANCELLED,

    /** Reminder for upcoming PT session */
    PT_REMINDER,

    // Class notifications
    /** Member cancelled class booking */
    BOOKING_CANCELLED,

    /** Reminder for upcoming class */
    CLASS_REMINDER,

    /** Trainer was assigned to a class */
    CLASS_ASSIGNED,

    // Substitution notifications
    /** Another trainer requested substitute */
    SUBSTITUTE_REQUEST,

    /** Substitute request was accepted */
    SUBSTITUTE_ACCEPTED,

    /** Substitute request was declined */
    SUBSTITUTE_DECLINED,

    // Earnings notifications
    /** Earnings were approved for payment */
    EARNINGS_APPROVED,

    /** Payment was processed */
    EARNINGS_PAID,

    // Communication
    /** New message received */
    MESSAGE,

    // Time block notifications
    /** Time off request was approved */
    TIME_BLOCK_APPROVED,

    /** Time off request was rejected */
    TIME_BLOCK_REJECTED,

    // Profile notifications
    /** Certification is expiring soon */
    CERTIFICATION_EXPIRING,

    /** Profile is incomplete */
    PROFILE_INCOMPLETE,

    // Schedule notifications
    /** Schedule conflict detected */
    SCHEDULE_CONFLICT,

    // General
    /** System notification */
    SYSTEM
}
