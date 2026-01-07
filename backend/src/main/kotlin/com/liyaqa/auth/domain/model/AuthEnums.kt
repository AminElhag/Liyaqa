package com.liyaqa.auth.domain.model

/**
 * User roles for authorization.
 * Ordered by permission level (highest to lowest).
 */
enum class Role {
    /** Organization-wide access - can manage all clubs */
    SUPER_ADMIN,

    /** Full club management - can manage members, staff, plans */
    CLUB_ADMIN,

    /** Operational access - can view members, check-in */
    STAFF,

    /** Self-service only - can view own profile and subscriptions */
    MEMBER
}

/**
 * User account status.
 */
enum class UserStatus {
    /** Account is active and can login */
    ACTIVE,

    /** Account has been deactivated */
    INACTIVE,

    /** Account is locked due to failed login attempts */
    LOCKED,

    /** Account is pending email verification */
    PENDING_VERIFICATION
}