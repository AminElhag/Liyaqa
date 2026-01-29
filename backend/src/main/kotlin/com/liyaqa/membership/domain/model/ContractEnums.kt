package com.liyaqa.membership.domain.model

/**
 * Type of membership contract.
 */
enum class ContractType {
    /** Month-to-month with no fixed commitment */
    MONTH_TO_MONTH,

    /** Fixed-term contract with commitment period */
    FIXED_TERM
}

/**
 * Contract term/commitment length.
 */
enum class ContractTerm {
    /** Monthly billing, no commitment beyond current month */
    MONTHLY,

    /** 3-month commitment */
    QUARTERLY,

    /** 6-month commitment */
    SEMI_ANNUAL,

    /** 12-month commitment */
    ANNUAL;

    fun toMonths(): Int = when (this) {
        MONTHLY -> 1
        QUARTERLY -> 3
        SEMI_ANNUAL -> 6
        ANNUAL -> 12
    }
}

/**
 * Status of a membership contract.
 */
enum class ContractStatus {
    /** Contract awaiting member signature */
    PENDING_SIGNATURE,

    /** Contract is active and in force */
    ACTIVE,

    /** Member has requested cancellation, in notice period */
    IN_NOTICE_PERIOD,

    /** Contract has been cancelled */
    CANCELLED,

    /** Contract has naturally expired at end of term */
    EXPIRED,

    /** Contract is suspended (e.g., for non-payment) */
    SUSPENDED,

    /** Contract was voided (e.g., cooling-off period cancellation) */
    VOIDED
}

/**
 * Type of early termination fee calculation.
 */
enum class TerminationFeeType {
    /** No early termination fee */
    NONE,

    /** Fixed flat fee amount */
    FLAT_FEE,

    /** Charge for remaining months in commitment */
    REMAINING_MONTHS,

    /** Percentage of remaining contract value */
    PERCENTAGE
}

/**
 * Type/reason for contract cancellation.
 */
enum class CancellationType {
    /** Standard member-initiated cancellation */
    MEMBER_REQUEST,

    /** Cancelled due to non-payment */
    NON_PAYMENT,

    /** Cancelled due to terms violation */
    VIOLATION,

    /** Member relocating (may waive fees) */
    RELOCATION,

    /** Medical reasons (may waive fees) */
    MEDICAL,

    /** Within cooling-off period (full refund) */
    COOLING_OFF,

    /** Member deceased */
    DECEASED,

    /** Facility closure or service unavailable */
    FACILITY_CLOSURE,

    /** Administrative/staff-initiated */
    ADMINISTRATIVE
}

/**
 * Category type for membership categories.
 */
enum class MembershipCategoryType {
    /** Standard individual membership */
    INDIVIDUAL,

    /** Family membership with primary and dependents */
    FAMILY,

    /** Corporate/company-sponsored membership */
    CORPORATE,

    /** Student membership (age/verification required) */
    STUDENT,

    /** Senior citizen membership */
    SENIOR,

    /** Military/veterans membership */
    MILITARY,

    /** Staff/employee membership */
    STAFF,

    /** Trial membership */
    TRIAL,

    /** VIP/Premium category */
    VIP
}

/**
 * Type of proration calculation for plan changes.
 */
enum class ProrationMode {
    /** Calculate credit and charge for remaining days (used for upgrades) */
    PRORATE_IMMEDIATELY,

    /** Schedule change for end of billing period (used for downgrades) */
    END_OF_PERIOD,

    /** Full period credit + full new period charge */
    FULL_PERIOD_CREDIT,

    /** No proration, just switch (promotional) */
    NO_PRORATION
}

/**
 * Type of plan change.
 */
enum class PlanChangeType {
    /** Upgrading to a higher-value plan */
    UPGRADE,

    /** Downgrading to a lower-value plan */
    DOWNGRADE,

    /** Lateral move to equivalent plan */
    LATERAL
}

/**
 * Status of a scheduled plan change.
 */
enum class ScheduledChangeStatus {
    /** Change is pending, waiting for scheduled date */
    PENDING,

    /** Change has been processed */
    PROCESSED,

    /** Change was cancelled before processing */
    CANCELLED
}

/**
 * Category of cancellation reason for exit surveys.
 */
enum class CancellationReasonCategory {
    /** Financial reasons (can't afford, too expensive) */
    FINANCIAL,

    /** Member is relocating/moving */
    RELOCATION,

    /** Health issues preventing use */
    HEALTH,

    /** Dissatisfied with service/facilities */
    DISSATISFACTION,

    /** Not using the membership enough */
    USAGE,

    /** Switching to competitor */
    COMPETITION,

    /** Personal reasons not specified */
    PERSONAL,

    /** Other reasons */
    OTHER
}

/**
 * Type of retention offer.
 */
enum class RetentionOfferType {
    /** Free freeze days */
    FREE_FREEZE,

    /** Percentage or fixed discount */
    DISCOUNT,

    /** Wallet credit */
    CREDIT,

    /** Downgrade to cheaper plan */
    DOWNGRADE,

    /** Contract extension with benefits */
    EXTENSION,

    /** Free personal training sessions */
    PERSONAL_TRAINING,

    /** Custom offer */
    CUSTOM
}

/**
 * Status of a retention offer.
 */
enum class RetentionOfferStatus {
    /** Offer presented but not yet responded to */
    PENDING,

    /** Member accepted the offer */
    ACCEPTED,

    /** Member declined the offer */
    DECLINED,

    /** Offer expired without response */
    EXPIRED
}

/**
 * Status of a cancellation request.
 */
enum class CancellationRequestStatus {
    /** Request submitted, notice period not yet started */
    PENDING_NOTICE,

    /** Currently in notice period */
    IN_NOTICE,

    /** Member was saved (accepted retention offer) */
    SAVED,

    /** Cancellation completed */
    COMPLETED,

    /** Member withdrew cancellation request */
    WITHDRAWN
}

/**
 * Areas of dissatisfaction for exit surveys.
 */
enum class DissatisfactionArea {
    FACILITIES,
    STAFF,
    CLEANLINESS,
    EQUIPMENT,
    CLASSES,
    PRICE,
    LOCATION,
    HOURS,
    CROWDING
}
