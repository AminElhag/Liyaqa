package com.liyaqa.auth.domain.model

/**
 * User roles for authorization.
 *
 * Platform roles (internal Liyaqa team) - ordinals 0-3:
 * - PLATFORM_ADMIN, SALES_REP, MARKETING, SUPPORT
 *
 * Client roles (organization users) - ordinals 4-8:
 * - SUPER_ADMIN, CLUB_ADMIN, STAFF, TRAINER, MEMBER
 */
enum class Role {
    // ======== Platform Roles (Internal Team) ========

    /** Full platform access - can manage all clients, plans, users, and settings */
    PLATFORM_ADMIN,

    /** Sales representative - can manage clients, deals, and subscriptions */
    SALES_REP,

    /** Marketing team - can view analytics and campaigns */
    MARKETING,

    /** Support team - can view/edit client data and impersonate users */
    SUPPORT,

    // ======== Client Roles (Organization Users) ========

    /** Organization-wide access - can manage all clubs */
    SUPER_ADMIN,

    /** Full club management - can manage members, staff, plans */
    CLUB_ADMIN,

    /** Operational access - can view members, check-in */
    STAFF,

    /**
     * Trainer role - service providers who teach classes and provide personal training.
     *
     * Permissions:
     * - View/edit own trainer profile
     * - Create, edit, delete own classes (group fitness)
     * - Manage schedules for own classes
     * - View assigned classes and sessions
     * - View bookings for their sessions
     * - Check-in members to their sessions
     * - Manage personal training session requests (confirm/cancel)
     * - Set own availability for PT bookings
     *
     * Restrictions:
     * - Cannot access other trainers' data or compensation info
     * - Cannot access member management or system settings
     * - Cannot create/modify other trainers' classes
     */
    TRAINER,

    /** Self-service only - can view own profile and subscriptions */
    MEMBER;

    companion object {
        /** All platform (internal team) roles */
        val PLATFORM_ROLES = setOf(PLATFORM_ADMIN, SALES_REP, MARKETING, SUPPORT)

        /** All client (organization) roles */
        val CLIENT_ROLES = setOf(SUPER_ADMIN, CLUB_ADMIN, STAFF, TRAINER, MEMBER)

        /** Roles that can manage trainers */
        val TRAINER_MANAGEMENT_ROLES = setOf(SUPER_ADMIN, CLUB_ADMIN)

        /** Check if a role is a platform role */
        fun isPlatformRole(role: Role): Boolean = role in PLATFORM_ROLES

        /** Check if a role is a client role */
        fun isClientRole(role: Role): Boolean = role in CLIENT_ROLES

        /** Check if a role can manage trainers */
        fun canManageTrainers(role: Role): Boolean = role in TRAINER_MANAGEMENT_ROLES
    }
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