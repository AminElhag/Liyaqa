package com.liyaqa.member.data.auth.model

/**
 * User roles matching backend Role enum.
 * Determines permissions and access levels within the application.
 */
enum class Role {
    // Platform-level roles (B2B internal)
    PLATFORM_ADMIN,
    SALES_REP,
    MARKETING,
    SUPPORT,

    // Organization/Club-level roles
    SUPER_ADMIN,
    CLUB_ADMIN,
    STAFF,
    MEMBER;

    companion object {
        /**
         * Safely parse a role string, defaulting to MEMBER if unknown.
         */
        fun fromString(value: String): Role {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: MEMBER
        }
    }
}

/**
 * User account status matching backend UserStatus enum.
 */
enum class UserStatus {
    ACTIVE,
    INACTIVE,
    LOCKED,
    PENDING_VERIFICATION;

    companion object {
        /**
         * Safely parse a status string, defaulting to INACTIVE if unknown.
         */
        fun fromString(value: String): UserStatus {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: INACTIVE
        }
    }
}
