package com.liyaqa.marketing.domain.model

/**
 * Types of marketing campaigns.
 */
enum class CampaignType {
    WELCOME_SEQUENCE,     // New member welcome series
    EXPIRY_REMINDER,      // Subscription expiry reminders (30, 7, 1 day)
    WIN_BACK,             // Re-engagement for expired members
    BIRTHDAY,             // Birthday greetings
    INACTIVITY_ALERT,     // Alerts for inactive members
    PAYMENT_FOLLOWUP,     // Payment failure follow-ups
    CUSTOM                // Custom campaigns
}

/**
 * Trigger types for automatic campaign enrollment.
 */
enum class TriggerType {
    MEMBER_CREATED,       // When a new member is created
    DAYS_BEFORE_EXPIRY,   // X days before subscription expires
    DAYS_AFTER_EXPIRY,    // X days after subscription expired
    BIRTHDAY,             // On member's birthday
    DAYS_INACTIVE,        // After X days of inactivity
    PAYMENT_FAILED,       // When a payment fails
    MANUAL                // Manual enrollment only
}

/**
 * Status of a marketing campaign.
 */
enum class CampaignStatus {
    DRAFT,      // Campaign is being configured
    ACTIVE,     // Campaign is running
    PAUSED,     // Campaign is temporarily paused
    COMPLETED,  // Campaign has finished
    ARCHIVED    // Campaign is archived
}

/**
 * Status of a campaign enrollment.
 */
enum class EnrollmentStatus {
    ACTIVE,       // Member is actively in the campaign
    COMPLETED,    // Member completed all steps
    CANCELLED,    // Enrollment was cancelled
    UNSUBSCRIBED  // Member unsubscribed from marketing
}

/**
 * Status of a marketing message.
 */
enum class MessageStatus {
    PENDING,    // Message is queued for sending
    SENT,       // Message was sent
    DELIVERED,  // Message was delivered
    FAILED,     // Message failed to send
    BOUNCED     // Message bounced
}

/**
 * Types of segments.
 */
enum class SegmentType {
    DYNAMIC,  // Automatically updated based on criteria
    STATIC    // Manually managed member list
}

/**
 * Types of tracking pixels.
 */
enum class TrackingType {
    OPEN,   // Email open tracking
    CLICK   // Link click tracking
}

/**
 * Delivery channels for marketing messages.
 */
enum class MarketingChannel {
    EMAIL,
    SMS,
    WHATSAPP,
    PUSH
}
