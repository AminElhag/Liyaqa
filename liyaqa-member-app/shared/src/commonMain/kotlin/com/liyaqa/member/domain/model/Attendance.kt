package com.liyaqa.member.domain.model

import kotlinx.serialization.Serializable

/**
 * Attendance record
 */
@Serializable
data class Attendance(
    val id: String,
    val checkInTime: String,
    val checkOutTime: String? = null,
    val method: CheckInMethod,
    val duration: Int? = null, // in minutes
    val locationName: LocalizedText? = null
) {
    val isCheckedOut: Boolean get() = checkOutTime != null

    val durationDisplay: String? get() = duration?.let { mins ->
        val hours = mins / 60
        val remainingMins = mins % 60
        when {
            hours > 0 && remainingMins > 0 -> "${hours}h ${remainingMins}m"
            hours > 0 -> "${hours}h"
            else -> "${remainingMins}m"
        }
    }
}

/**
 * Attendance statistics for a member
 */
@Serializable
data class AttendanceStats(
    val totalVisits: Int,
    val averageVisitsPerMonth: Double,
    val totalDuration: Int, // in minutes
    val currentStreak: Int, // consecutive days
    val longestStreak: Int
) {
    val averageDurationPerVisit: Int get() = if (totalVisits > 0) totalDuration / totalVisits else 0
}

/**
 * QR code response
 */
@Serializable
data class QrCode(
    val token: String,
    val dataUrl: String,
    val expiresAt: String
) {
    val isExpired: Boolean get() = false // TODO: implement proper expiry check
}

/**
 * QR check-in result
 */
@Serializable
data class QrCheckInResult(
    val success: Boolean,
    val memberName: LocalizedText? = null,
    val subscriptionStatus: SubscriptionStatus? = null,
    val message: String? = null,
    val messageAr: String? = null
)

/**
 * Self check-in request
 */
@Serializable
data class SelfCheckInRequest(
    val locationId: String
)
