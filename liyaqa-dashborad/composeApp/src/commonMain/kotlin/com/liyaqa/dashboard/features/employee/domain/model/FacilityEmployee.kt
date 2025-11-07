package com.liyaqa.dashboard.features.employee.domain.model

/**
 * Facility employee (gym staff) domain model
 */
data class FacilityEmployee(
    val id: String,
    val facilityId: String,
    val branchId: String?,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phoneNumber: String?,
    val employeeNumber: String,
    val position: String?,
    val status: EmployeeStatus,
    val permissions: List<FacilityPermission> = emptyList(),
    val groups: List<FacilityEmployeeGroup> = emptyList(),
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val fullName: String
        get() = "$firstName $lastName"

    fun hasPermission(permission: FacilityPermission): Boolean {
        return permissions.contains(permission)
    }

    fun isActive(): Boolean = status == EmployeeStatus.ACTIVE
}

enum class EmployeeStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED,
    TERMINATED
}

/**
 * Facility-specific permissions for gym staff
 */
enum class FacilityPermission {
    // Member Management
    MEMBER_VIEW,
    MEMBER_CREATE,
    MEMBER_UPDATE,
    MEMBER_DELETE,
    MEMBER_SUSPEND,

    // Membership Management
    MEMBERSHIP_VIEW,
    MEMBERSHIP_CREATE,
    MEMBERSHIP_UPDATE,
    MEMBERSHIP_DELETE,
    MEMBERSHIP_ASSIGN,

    // Booking Management
    BOOKING_VIEW,
    BOOKING_CREATE,
    BOOKING_UPDATE,
    BOOKING_CANCEL,
    BOOKING_CHECK_IN,
    BOOKING_CHECK_OUT,

    // Trainer Management
    TRAINER_VIEW,
    TRAINER_CREATE,
    TRAINER_UPDATE,
    TRAINER_DELETE,
    TRAINER_AVAILABILITY_MANAGE,

    // Trainer Booking Management
    TRAINER_BOOKING_VIEW,
    TRAINER_BOOKING_CREATE,
    TRAINER_BOOKING_CANCEL,
    TRAINER_BOOKING_RESCHEDULE,

    // Payment Management
    PAYMENT_VIEW,
    PAYMENT_PROCESS,
    PAYMENT_REFUND,
    PAYMENT_VOID,

    // Employee Management
    EMPLOYEE_VIEW,
    EMPLOYEE_CREATE,
    EMPLOYEE_UPDATE,
    EMPLOYEE_DELETE,
    EMPLOYEE_MANAGE_PERMISSIONS,

    // Report Access
    REPORT_VIEW,
    REPORT_EXPORT,
    REPORT_FINANCIAL,

    // Settings Management
    SETTINGS_VIEW,
    SETTINGS_UPDATE,

    // Branch Management (for multi-branch facilities)
    BRANCH_VIEW,
    BRANCH_CREATE,
    BRANCH_UPDATE
}

data class FacilityEmployeeGroup(
    val id: String,
    val name: String,
    val description: String?,
    val permissions: List<FacilityPermission> = emptyList()
)
