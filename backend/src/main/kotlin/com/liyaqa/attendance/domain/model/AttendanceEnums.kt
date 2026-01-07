package com.liyaqa.attendance.domain.model

/**
 * Method used for checking in a member.
 */
enum class CheckInMethod {
    MANUAL,      // Staff manually checks in member
    QR_CODE,     // Member scans QR code
    CARD,        // Member swipes card/key fob
    BIOMETRIC    // Fingerprint or face recognition
}

/**
 * Status of an attendance record.
 */
enum class AttendanceStatus {
    CHECKED_IN,       // Member is currently in the facility
    CHECKED_OUT,      // Member checked out normally
    AUTO_CHECKED_OUT  // System auto-checkout at end of day
}
