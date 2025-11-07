package com.liyaqa.liyaqa_internal_app.features.employee.domain.model

/**
 * Employee domain model for internal team members.
 * Represents Liyaqa team employees with RBAC permissions.
 */
data class Employee(
    val id: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val employeeNumber: String,
    val phoneNumber: String?,
    val status: EmployeeStatus,
    val isSystemAccount: Boolean,
    val locale: String,
    val timezone: String,
    val department: String?,
    val jobTitle: String?,
    val hireDate: String?,
    val groups: List<EmployeeGroup> = emptyList(),
    val permissions: List<Permission> = emptyList(),
    val lastLoginAt: String?,
    val failedLoginAttempts: Int,
    val lockedUntil: String?,
    val createdAt: String,
    val updatedAt: String
) {
    val fullName: String
        get() = "$firstName $lastName"

    val isActive: Boolean
        get() = status == EmployeeStatus.ACTIVE

    val isLocked: Boolean
        get() = lockedUntil != null

    /**
     * Check if employee has a specific permission
     */
    fun hasPermission(permission: Permission): Boolean {
        return permissions.contains(permission)
    }

    /**
     * Check if employee has any of the specified permissions
     */
    fun hasAnyPermission(vararg requiredPermissions: Permission): Boolean {
        return requiredPermissions.any { permissions.contains(it) }
    }

    /**
     * Check if employee has all specified permissions
     */
    fun hasAllPermissions(vararg requiredPermissions: Permission): Boolean {
        return requiredPermissions.all { permissions.contains(it) }
    }

    /**
     * Check if employee is in a specific group
     */
    fun hasGroup(group: EmployeeGroup): Boolean {
        return groups.contains(group)
    }
}

/**
 * Employee status enum matching backend
 */
enum class EmployeeStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}

/**
 * Employee group model
 */
data class EmployeeGroup(
    val id: String,
    val name: String,
    val description: String?,
    val permissions: List<Permission> = emptyList()
)

/**
 * Permission enum matching backend (42 permissions)
 */
enum class Permission {
    // Employee Management
    EMPLOYEE_VIEW,
    EMPLOYEE_CREATE,
    EMPLOYEE_UPDATE,
    EMPLOYEE_DELETE,
    EMPLOYEE_ASSIGN_GROUPS,
    EMPLOYEE_MANAGE_PERMISSIONS,

    // Tenant Management
    TENANT_VIEW,
    TENANT_CREATE,
    TENANT_UPDATE,
    TENANT_DELETE,
    TENANT_MANAGE_SUBSCRIPTION,

    // Facility Management
    FACILITY_VIEW,
    FACILITY_CREATE,
    FACILITY_UPDATE,
    FACILITY_DELETE,
    FACILITY_MANAGE_BRANCHES,

    // Facility Employee Management
    FACILITY_EMPLOYEE_VIEW,
    FACILITY_EMPLOYEE_CREATE,
    FACILITY_EMPLOYEE_UPDATE,
    FACILITY_EMPLOYEE_DELETE,
    FACILITY_EMPLOYEE_MANAGE_PERMISSIONS,

    // Member Management
    MEMBER_VIEW,
    MEMBER_CREATE,
    MEMBER_UPDATE,
    MEMBER_DELETE,
    MEMBER_MANAGE_MEMBERSHIPS,

    // Booking Management
    BOOKING_VIEW,
    BOOKING_CREATE,
    BOOKING_UPDATE,
    BOOKING_DELETE,
    BOOKING_MANAGE,

    // Payment Management
    PAYMENT_VIEW,
    PAYMENT_PROCESS,
    PAYMENT_REFUND,

    // Audit & Security
    AUDIT_VIEW,
    SECURITY_MANAGE,

    // System Settings
    SYSTEM_SETTINGS_VIEW,
    SYSTEM_SETTINGS_UPDATE,

    // Support
    SUPPORT_TICKET_VIEW,
    SUPPORT_TICKET_CREATE,
    SUPPORT_TICKET_UPDATE,

    // Analytics
    ANALYTICS_VIEW,
    REPORT_GENERATE
}
