package com.liyaqa.auth.domain.model

/**
 * Represents the type of account a user has within a tenant.
 * A single user can hold multiple account types (e.g., both EMPLOYEE and TRAINER).
 */
enum class AccountType {
    /** Club employee — admin, staff, or management role */
    EMPLOYEE,

    /** Trainer — teaches classes, provides personal training */
    TRAINER,

    /** Member — gym member with self-service access */
    MEMBER
}
