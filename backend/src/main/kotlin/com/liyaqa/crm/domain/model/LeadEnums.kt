package com.liyaqa.crm.domain.model

/**
 * Lead lifecycle stages in the sales pipeline.
 */
enum class LeadStatus {
    NEW,
    CONTACTED,
    TOUR_SCHEDULED,
    TRIAL,
    NEGOTIATION,
    WON,
    LOST
}

/**
 * How the lead was acquired.
 */
enum class LeadSource {
    REFERRAL,
    WALK_IN,
    SOCIAL_MEDIA,
    PAID_ADS,
    WEBSITE,
    PHONE_CALL,
    EMAIL,
    PARTNER,
    EVENT,
    OTHER
}

/**
 * Types of activities that can be logged for a lead.
 */
enum class LeadActivityType {
    CALL,
    EMAIL,
    SMS,
    WHATSAPP,
    MEETING,
    TOUR,
    NOTE,
    STATUS_CHANGE,
    ASSIGNMENT,
    FOLLOW_UP_SCHEDULED,
    FOLLOW_UP_COMPLETED
}

/**
 * Lead priority levels.
 */
enum class LeadPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}

/**
 * Types of lead assignment rules.
 */
enum class LeadAssignmentRuleType {
    ROUND_ROBIN,
    LOCATION_BASED,
    SOURCE_BASED,
    MANUAL
}

/**
 * Types of lead scoring triggers.
 */
enum class LeadScoringTriggerType {
    SOURCE,
    ACTIVITY,
    ENGAGEMENT,
    ATTRIBUTE
}
