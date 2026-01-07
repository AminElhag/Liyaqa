package com.liyaqa.organization.domain.model

/**
 * Type of legal entity for the organization.
 */
enum class OrganizationType {
    LLC,                    // Limited Liability Company
    SOLE_PROPRIETORSHIP,    // Individual ownership
    PARTNERSHIP,            // Multiple owners
    CORPORATION,            // Corporate entity
    OTHER                   // Other legal structures
}

/**
 * Lifecycle status of an organization.
 */
enum class OrganizationStatus {
    PENDING,    // Awaiting verification/setup
    ACTIVE,     // Fully operational
    SUSPENDED,  // Temporarily disabled
    CLOSED      // Permanently closed
}

/**
 * Lifecycle status of a club.
 */
enum class ClubStatus {
    ACTIVE,     // Operational
    SUSPENDED,  // Temporarily disabled
    CLOSED      // Permanently closed
}

/**
 * Lifecycle status of a location.
 */
enum class LocationStatus {
    ACTIVE,              // Operational
    TEMPORARILY_CLOSED,  // Temporarily not operating (renovation, etc.)
    PERMANENTLY_CLOSED   // No longer operating
}