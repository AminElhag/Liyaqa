package com.liyaqa.employee.domain.model

/**
 * Employee status - current employment state.
 */
enum class EmployeeStatus {
    /** Currently employed and active */
    ACTIVE,

    /** Temporarily unavailable/inactive */
    INACTIVE,

    /** On extended leave (vacation, sick, etc.) */
    ON_LEAVE,

    /** New employee on probationary period */
    PROBATION,

    /** No longer employed */
    TERMINATED
}

/**
 * Employment type - how the employee is contracted.
 */
enum class EmploymentType {
    /** Full-time employee */
    FULL_TIME,

    /** Part-time employee */
    PART_TIME,

    /** Contract-based employee */
    CONTRACT,

    /** Intern or trainee */
    INTERN,

    /** Seasonal worker */
    SEASONAL
}

/**
 * Salary frequency - how often compensation is paid.
 */
enum class SalaryFrequency {
    /** Paid per hour worked */
    HOURLY,

    /** Paid per day worked */
    DAILY,

    /** Paid weekly */
    WEEKLY,

    /** Paid every two weeks */
    BI_WEEKLY,

    /** Paid monthly */
    MONTHLY,

    /** Paid annually */
    ANNUALLY
}

/**
 * Department status.
 */
enum class DepartmentStatus {
    /** Department is active and operational */
    ACTIVE,

    /** Department is inactive/closed */
    INACTIVE
}

/**
 * Status of employee-location assignment.
 */
enum class AssignmentStatus {
    /** Assignment is active */
    ACTIVE,

    /** Assignment is inactive */
    INACTIVE
}
